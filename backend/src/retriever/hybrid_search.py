import asyncio
import time
import logging
from typing import List, Optional, Tuple
from qdrant_client.models import (
    Filter,
    FieldCondition,
    MatchValue,
    Prefetch,
    FusionQuery,
    Fusion,
)
from backend.src.config import settings
from backend.src.api.schemas import EvidenceItem, QueryFilters
from backend.src.retriever.qdrant_store import store
from backend.src.retriever.embeddings import compute_dense_embedding, compute_sparse_embedding

logger = logging.getLogger("hybrid_search")

def build_tenant_filter(verified_user_id: Optional[str] = None, filters: Optional[QueryFilters] = None) -> Filter:
    """
    Builds the immutable tenant visibility filter.
    Guarantees that User A cannot see User B's private documents,
    while permitting public scientific corpus access to all.
    """
    status_condition = FieldCondition(key="ingestion_status", match=MatchValue(value="ready"))

    if verified_user_id:
        tenant_should = [
            FieldCondition(key="scope", match=MatchValue(value="public")),
            Filter(
                must=[
                    FieldCondition(key="scope", match=MatchValue(value="private")),
                    FieldCondition(key="owner_user_id", match=MatchValue(value=verified_user_id))
                ]
            )
        ]
        access_condition = Filter(should=tenant_should)
    else:
        # Anonymous users can only query the public corpus
        access_condition = FieldCondition(key="scope", match=MatchValue(value="public"))

    must_conditions = [access_condition, status_condition]

    # Optional topical filters (e.g. region, source_type)
    if filters:
        if filters.region:
            must_conditions.append(FieldCondition(key="region", match=MatchValue(value=filters.region)))
        if filters.source_type:
            must_conditions.append(FieldCondition(key="source_type", match=MatchValue(value=filters.source_type)))

    return Filter(must=must_conditions)

async def search_hybrid_evidence(
    query_text: str,
    verified_user_id: Optional[str] = None,
    filters: Optional[QueryFilters] = None,
    limit: int = 8
) -> Tuple[List[EvidenceItem], float]:
    """
    Executes a hybrid search in Qdrant with dense + sparse prefetches and server-side RRF fusion.
    Falls back gracefully if optional filters yield zero results, WITHOUT relaxing the tenant filter.
    Returns (List[EvidenceItem], retrieval_ms).
    """
    t0 = time.perf_counter()

    # ── Parallelize dense + sparse embedding (cuts CPU embed time by ~50%) ──
    dense_vector, sparse_vector = await asyncio.gather(
        asyncio.to_thread(compute_dense_embedding, query_text),
        asyncio.to_thread(compute_sparse_embedding, query_text),
    )

    # Initial query with preferred topical filters
    tenant_filter = build_tenant_filter(verified_user_id=verified_user_id, filters=filters)

    try:
        results = store.client.query_points(
            collection_name=store.collection_name,
            prefetch=[
                Prefetch(
                    query=dense_vector,
                    using="dense",
                    limit=20,
                    filter=tenant_filter
                ),
                Prefetch(
                    query=sparse_vector,
                    using="bm25",
                    limit=20,
                    filter=tenant_filter
                )
            ],
            query=FusionQuery(fusion=Fusion.RRF),
            limit=limit,
            with_payload=True
        )
        scored_points = results.points
    except Exception as e:
        logger.warning(f"Server-side RRF prefetch note, executing hybrid fallback: {e}")
        # Standard query fallback within Qdrant
        try:
            scored_points = store.client.search(
                collection_name=store.collection_name,
                query_vector=("dense", dense_vector),
                query_filter=tenant_filter,
                limit=limit,
                with_payload=True
            )
        except Exception as fallback_err:
            logger.error(f"Search failed: {fallback_err}")
            scored_points = []

    # Safe fallback: if zero results and optional topical filters were applied, retry WITHOUT topical filters
    # BUT NEVER REMOVE THE TENANT FILTER
    if not scored_points and filters and (filters.region or filters.source_type):
        logger.info("Zero results with topical filters; relaxing topical filter while retaining strict tenant boundary")
        relaxed_filter = build_tenant_filter(verified_user_id=verified_user_id, filters=None)
        try:
            results = store.client.query_points(
                collection_name=store.collection_name,
                prefetch=[
                    Prefetch(query=dense_vector, using="dense", limit=20, filter=relaxed_filter),
                    Prefetch(query=sparse_vector, using="bm25", limit=20, filter=relaxed_filter)
                ],
                query=FusionQuery(fusion=Fusion.RRF),
                limit=limit,
                with_payload=True
            )
            scored_points = results.points
        except Exception:
            scored_points = []

    # Convert retrieved points to structured EvidenceItem with stable IDs [S1], [S2]
    evidence_items: List[EvidenceItem] = []
    for idx, point in enumerate(scored_points):
        p = point.payload or {}
        evidence_items.append(
            EvidenceItem(
                id=f"S{idx + 1}",
                document_id=str(p.get("document_id", point.id)),
                parent_id=p.get("parent_id"),
                title=p.get("source_title", p.get("title", "Authoritative Scientific Report")),
                organization=p.get("organization", "Environmental Research Body"),
                publication_year=p.get("publication_year"),
                doi=p.get("doi"),
                source_url=p.get("source_url"),
                page=p.get("page_start", p.get("page")),
                section=p.get("section"),
                score=float(point.score if hasattr(point, "score") and point.score is not None else 0.0),
                text=p.get("parent_text") or p.get("text", ""),
                scope=p.get("scope", "public"),
                owner_user_id=p.get("owner_user_id")
            )
        )

    retrieval_ms = (time.perf_counter() - t0) * 1000.0
    return evidence_items, retrieval_ms
