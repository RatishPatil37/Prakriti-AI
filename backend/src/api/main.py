import hashlib
import uuid
import logging
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, Depends, UploadFile, File, Request, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse

from backend.src.config import settings
from backend.src.api.schemas import (
    QueryRequest,
    EvidenceItem,
    ClarificationPayload,
    DocumentMetadata
)
from backend.src.api.auth import (
    AuthUser,
    get_current_user_optional,
    get_current_user_required
)
from backend.src.api.rate_limit import limiter
from backend.src.retriever.qdrant_store import store
from backend.src.retriever.hybrid_search import search_hybrid_evidence
from backend.src.intelligence.completeness import check_environmental_completeness
from backend.src.intelligence.evidence_gate import (
    build_evidence_manifest,
    assess_evidence_quality,
    verify_response_citations
)
from backend.src.generator.prompts import build_scientist_prompt
from backend.src.generator.llm_router import stream_gemini_tokens
from backend.src.generator.stream import generate_query_sse_stream
from backend.src.ingestion.parser import DocumentParser
from backend.src.ingestion.chunker import DocumentChunker
from backend.src.ingestion.indexer import DocumentIndexer
from backend.src.api.supabase_db import SupabaseService

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("main")

app = FastAPI(
    title="Darukaa.Earth AI Environmental Scientist API",
    version="2.0.0",
    description="Evidence-grounded conversational environmental intelligence system"
)

# Strict CORS configuration with dynamic Vercel domain support
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS if settings.CORS_ORIGINS else ["*"],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "darukaa-earth-ai-backend",
        "environment": settings.ENVIRONMENT
    }

@app.get("/ready")
async def readiness_check():
    try:
        collections = store.client.get_collections().collections
        qdrant_ready = any(c.name == store.collection_name for c in collections)
    except Exception as e:
        logger.error(f"Qdrant readiness error: {e}")
        qdrant_ready = False

    return {
        "ready": qdrant_ready,
        "qdrant": "connected" if qdrant_ready else "error",
        "llm_provider": "google-genai",
        "primary_model": settings.LLM_PRIMARY_MODEL
    }

@app.post("/api/v1/query/stream")
async def query_stream_endpoint(
    query_req: QueryRequest,
    request: Request,
    user: AuthUser = Depends(get_current_user_optional)
):
    """
    Primary SSE streaming query endpoint:
    - Applies IP rate limit (anonymous) or user_id rate limit (authenticated)
    - Checks completeness (zero-LLM clarification)
    - Retrieves dense + sparse hybrid evidence with immutable tenant filtering
    - Streams SSE tokens and detects client disconnects
    """
    limiter.check_rate_limit(request, user_id=user.user_id if user.is_authenticated else None)

    req_id = str(uuid.uuid4())
    logger.info(f"Incoming query stream [req: {req_id}, user: {user.user_id or 'anonymous'}]")

    return StreamingResponse(
        generate_query_sse_stream(query_req, user, request, request_id=req_id),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )

@app.post("/api/v1/documents")
async def upload_document_endpoint(
    request: Request,
    file: UploadFile = File(...),
    user: AuthUser = Depends(get_current_user_required)
):
    """
    Authenticated private document upload:
    - Strictly bound to verified JWT user_id
    - Enforces document quota per user (max 10)
    - Parses PDF (max 25MB, max 100 pages) or text
    - Indexes into Qdrant with scope='private' and owner_user_id=verified_user_id
    """
    limiter.check_rate_limit(request, user_id=user.user_id)

    # Check user document count quota
    existing_docs = SupabaseService.list_user_documents(verified_user_id=user.user_id)
    if len(existing_docs) >= settings.MAX_DOCUMENTS_PER_USER:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"User document limit reached ({settings.MAX_DOCUMENTS_PER_USER} documents max). Please delete an older document."
        )

    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Empty file uploaded")

    filename = file.filename or "uploaded_document"
    content_hash = hashlib.sha256(file_bytes).hexdigest()

    # Parse pages with quota validation
    if filename.lower().endswith(".pdf"):
        pages = DocumentParser.parse_pdf_bytes(file_bytes)
    else:
        pages = DocumentParser.parse_text_bytes(file_bytes)

    if not pages:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="No readable text found in document")

    chunks = DocumentChunker.chunk_pages(pages)
    doc_id = str(uuid.uuid4())
    title = filename.rsplit(".", 1)[0].replace("_", " ").title()

    # Index into Qdrant under private tenant scope
    indexed_count = DocumentIndexer.index_document_chunks(
        document_id=doc_id,
        title=title,
        chunks=chunks,
        scope="private",
        owner_user_id=user.user_id,
        organization="User Uploaded Document"
    )

    # Persist metadata to Supabase strictly scoped to user.user_id
    doc_meta = SupabaseService.create_document_record(
        document_id=doc_id,
        verified_user_id=user.user_id,
        title=title,
        content_hash=content_hash,
        page_count=len(pages),
        chunk_count=indexed_count,
        storage_path=f"{user.user_id}/{doc_id}/{filename}"
    )

    return {
        "status": "ready",
        "document": doc_meta,
        "chunks_indexed": indexed_count
    }

@app.get("/api/v1/documents")
async def list_documents_endpoint(user: AuthUser = Depends(get_current_user_required)):
    """
    Lists documents owned strictly by the verified JWT user_id.
    """
    docs = SupabaseService.list_user_documents(verified_user_id=user.user_id)
    return {"documents": docs}

@app.delete("/api/v1/documents/{document_id}")
async def delete_document_endpoint(
    document_id: str,
    user: AuthUser = Depends(get_current_user_required)
):
    """
    Deletes user document synchronously from Qdrant using wait=True,
    and updates database record strictly scoped by owner_user_id.
    """
    # Synchronously delete points from Qdrant
    deleted_from_qdrant = store.delete_document(
        document_id=document_id,
        owner_user_id=user.user_id,
        wait=True
    )

    # Update database record
    deleted_from_db = SupabaseService.delete_document_record(
        document_id=document_id,
        verified_user_id=user.user_id
    )

    if not deleted_from_db:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found or unauthorized")

    return {
        "status": "deleted",
        "document_id": document_id,
        "qdrant_purged": deleted_from_qdrant
    }

@app.get("/api/v1/sources/{source_id}")
async def get_source_endpoint(
    source_id: str,
    user: AuthUser = Depends(get_current_user_optional)
):
    """
    IDOR-guarded source metadata lookup:
    Returns the source if it is public, or if it is private and owned by the verified user.
    Blocks any unauthorized cross-tenant inspection.
    """
    verified_id = user.user_id if user.is_authenticated else None
    source = store.get_source_point(point_id=source_id, verified_user_id=verified_id)

    if not source:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Source not found or unauthorized"
        )

    return {
        "source_id": source_id,
        "title": source.get("source_title", "Scientific Document"),
        "organization": source.get("organization"),
        "publication_year": source.get("publication_year"),
        "page": source.get("page_start"),
        "section": source.get("section"),
        "doi": source.get("doi"),
        "source_url": source.get("source_url"),
        "scope": source.get("scope")
    }
