import json
import time
import uuid
import logging
from typing import AsyncGenerator, Optional, Dict, Any
from fastapi import Request

from backend.src.api.schemas import QueryRequest, StreamDoneMetrics
from backend.src.api.auth import AuthUser
from backend.src.retriever.hybrid_search import search_hybrid_evidence
from backend.src.intelligence.completeness import (
    check_environmental_completeness,
    is_out_of_scope_query
)
from backend.src.intelligence.evidence_gate import (
    build_evidence_manifest,
    assess_evidence_quality,
    verify_response_citations
)
from backend.src.generator.prompts import build_scientist_prompt
from backend.src.generator.llm_router import stream_gemini_tokens
from backend.src.intelligence.tracer import trace_pipeline, trace_span
from backend.src.config import settings

logger = logging.getLogger("stream")

def sse_event(event_type: str, data: Dict[str, Any]) -> str:
    return f"event: {event_type}\ndata: {json.dumps(data)}\n\n"

async def generate_query_sse_stream(
    query_req: QueryRequest,
    user: AuthUser,
    request: Request,
    request_id: Optional[str] = None
) -> AsyncGenerator[str, None]:
    """
    Main SSE Orchestration Pipeline:
    1. Auth validation & Stage status
    2. Zero-LLM Completeness Check (halts with clarification if incomplete)
    3. Qdrant Hybrid Retrieval with Tenant Filter
    4. Immutable Evidence Manifest & Evidence Quality Assessment
    5. Prompt Construction
    6. Streaming Token Generation with Client Disconnect Detection
    7. Post-Stream Citation Verification & Performance Metrics
    """
    req_id = request_id or str(uuid.uuid4())
    t0 = time.perf_counter()
    first_sse_time: Optional[float] = None
    first_token_time: Optional[float] = None

    session_id = getattr(query_req, "session_id", None)
    is_out_of_scope = is_out_of_scope_query(query_req.question)

    with trace_pipeline(
        name="rag-query-stream" if not is_out_of_scope else "out-of-scope-refusal",
        user_id=user.user_id if user.is_authenticated else None,
        session_id=session_id,
        query_text=query_req.question,
        tags=["prakriti-ai", "rag", "environmental-science"],
        metadata={
            "request_id": req_id,
            "is_out_of_scope": is_out_of_scope,
            "has_context": bool(query_req.environmental_context and (query_req.environmental_context.region_or_coords or query_req.environmental_context.climate_zone))
        }
    ) as root_trace:
        try:
            # Stage 1: Auth Status
            yield sse_event("status", {"stage": "auth", "request_id": req_id})
            t_auth = time.perf_counter()
            auth_ms = (t_auth - t0) * 1000.0

            # Stage 2: Completeness & Scope Check
            with trace_span(
                name="guardrails-and-completeness",
                as_type="guardrail",
                input_data={"question": query_req.question, "is_out_of_scope": is_out_of_scope}
            ) as guard_span:
                if not is_out_of_scope:
                    clarification = check_environmental_completeness(query_req.question, query_req.environmental_context)
                    t_completeness = time.perf_counter()
                    completeness_ms = (t_completeness - t_auth) * 1000.0

                    if clarification:
                        guard_span.update(output={"action": "clarification", "missing": clarification.missing_fields})
                        yield sse_event("clarification", clarification.model_dump())
                        yield sse_event("done", {
                            "request_id": req_id,
                            "is_clarification": True,
                            "metrics": {
                                "auth_ms": round(auth_ms, 2),
                                "completeness_ms": round(completeness_ms, 2),
                                "total_ms": round((time.perf_counter() - t0) * 1000.0, 2)
                            }
                        })
                        return
                    guard_span.update(output={"action": "proceed", "scope": "environmental"})
                else:
                    completeness_ms = 0.0
                    guard_span.update(output={"action": "refusal", "scope": "out_of_scope"})

            # Stage 3: Retrieval (Bypassed if query is out of scope to avoid bogus citations)
            yield sse_event("status", {"stage": "retrieval", "request_id": req_id})
            if is_out_of_scope:
                evidence_items, retrieval_ms = [], 0.0
            else:
                with trace_span(
                    name="hybrid-retrieval",
                    as_type="retriever",
                    input_data={"query": query_req.question, "filters": query_req.filters.model_dump() if query_req.filters else None}
                ) as ret_span:
                    evidence_items, retrieval_ms = await search_hybrid_evidence(
                        query_text=query_req.question,
                        verified_user_id=user.user_id if user.is_authenticated else None,
                        filters=query_req.filters
                    )
                    ret_span.update(
                        output=[{"id": item.id, "title": item.title, "score": item.score} for item in evidence_items],
                        metadata={"retrieval_ms": retrieval_ms, "count": len(evidence_items)}
                    )

            # Stage 4: Manifest & Evidence Quality
            manifest = build_evidence_manifest(evidence_items)
            quality_assessment = assess_evidence_quality(evidence_items)

            # Emit evidence manifest to client (empty for out-of-scope queries)
            yield sse_event("evidence", {
                "sources": [item.model_dump() for item in evidence_items],
                "quality": quality_assessment.model_dump()
            })

            if first_sse_time is None:
                first_sse_time = time.perf_counter()

            # Stage 5: Prompt Construction
            t_prompt_start = time.perf_counter()
            prompt = build_scientist_prompt(
                question=query_req.question,
                evidence_items=evidence_items,
                environmental_context=query_req.environmental_context if not is_out_of_scope else None,
                conversation_context=query_req.conversation_context if not is_out_of_scope else None
            )
            prompt_ms = (time.perf_counter() - t_prompt_start) * 1000.0

            # Stage 6: Reasoning & Streaming
            yield sse_event("status", {"stage": "reasoning", "request_id": req_id})
            t_llm_start = time.perf_counter()

            full_response_text = []

            with trace_span(
                name="gemini-reasoning",
                as_type="generation",
                model=settings.LLM_PRIMARY_MODEL,
                input_data=prompt,
                metadata={"prompt_ms": prompt_ms}
            ) as gen_span:
                async for token in stream_gemini_tokens(prompt):
                    if await request.is_disconnected():
                        logger.warning(f"Client disconnected from SSE stream (req: {req_id}). Aborting LLM generation.")
                        gen_span.update(output="[DISCONNECTED]")
                        return

                    if first_token_time is None:
                        first_token_time = time.perf_counter()

                    full_response_text.append(token)
                    yield sse_event("token", {"text": token})

                complete_text = "".join(full_response_text)
                gen_span.update(
                    output=complete_text,
                    metadata={
                        "ttft_ms": (first_token_time - t_llm_start) * 1000.0 if first_token_time else 0.0,
                        "output_length": len(complete_text)
                    }
                )

            t_done = time.perf_counter()

            # Stage 7: Citation Validation & Final Metrics
            with trace_span(
                name="citation-verification",
                as_type="evaluator",
                input_data={"cited_ids": list(manifest.keys()), "text_length": len(complete_text)}
            ) as eval_span:
                citations_verified, cited_ids, unverified_ids = verify_response_citations(complete_text, manifest)
                eval_span.update(
                    output={
                        "citations_verified": citations_verified,
                        "cited_ids": cited_ids,
                        "unverified_ids": unverified_ids
                    }
                )

            llm_ttft_ms = (first_token_time - t_llm_start) * 1000.0 if first_token_time else 0.0
            first_sse_ms = (first_sse_time - t0) * 1000.0 if first_sse_time else 0.0
            total_ms = (t_done - t0) * 1000.0

            root_trace.update(
                output={
                    "response": complete_text[:200] + "..." if len(complete_text) > 200 else complete_text,
                    "citations_verified": citations_verified,
                    "total_ms": round(total_ms, 2)
                }
            )

            metrics = StreamDoneMetrics(
                auth_ms=round(auth_ms, 2),
                completeness_ms=round(completeness_ms, 2),
                retrieval_ms=round(retrieval_ms, 2),
                parent_ms=0.0,
                prompt_ms=round(prompt_ms, 2),
                llm_ttft_ms=round(llm_ttft_ms, 2),
                first_sse_ms=round(first_sse_ms, 2),
                total_ms=round(total_ms, 2),
                request_id=req_id
            )

            yield sse_event("done", {
                "request_id": req_id,
                "metrics": metrics.model_dump(),
                "evidence_quality": quality_assessment.model_dump(),
                "citations_verified": citations_verified,
                "cited_ids": cited_ids,
                "unverified_citations": unverified_ids
            })

        except Exception as e:
            logger.error(f"Error during SSE generation (req: {req_id}): {e}", exc_info=True)
            root_trace.update(metadata={"error": str(e)})
            yield sse_event("error", {
                "code": "PIPELINE_ERROR",
                "message": "Internal processing error during streaming response.",
                "detail": str(e),
                "retryable": True,
                "request_id": req_id
            })
