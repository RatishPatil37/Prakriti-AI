import pytest
import uuid
from backend.src.ingestion.parser import ParsedPage
from backend.src.ingestion.chunker import DocumentChunker
from backend.src.ingestion.indexer import DocumentIndexer
from backend.src.retriever.hybrid_search import search_hybrid_evidence
from backend.src.retriever.qdrant_store import store
from backend.src.api.schemas import QueryFilters

@pytest.mark.asyncio
async def test_multi_tenant_isolation_matrix():
    """
    Executes Security Tests A, B, C, D, E, F:
    A: User A private document invisible to User B
    B: Exact unique phrase leak test
    C: Synchronous deletion verification (wait=True)
    D: Multi-tenant query isolation
    E: Filter relaxation preserves tenant boundary
    F: IDOR protection on source lookup
    """
    user_a_id = str(uuid.uuid4())
    user_b_id = str(uuid.uuid4())

    # 1. Ingest User A's private document with unique secret phrase
    secret_phrase = "ProjectZephyr_MicrobialRestoration_Alpha99"
    doc_a_id = str(uuid.uuid4())
    pages_a = [
        ParsedPage(
            page_number=1,
            text=f"Proprietary farm report: {secret_phrase}. Yield improved by 34% using targeted microbial inoculants."
        )
    ]
    chunks_a = DocumentChunker.chunk_pages(pages_a)
    DocumentIndexer.index_document_chunks(
        document_id=doc_a_id,
        title="User A Secret Farm Audit",
        chunks=chunks_a,
        scope="private",
        owner_user_id=user_a_id,
        organization="Private Agronomy Lab"
    )

    # Ingest a public document
    doc_pub_id = str(uuid.uuid4())
    pages_pub = [
        ParsedPage(
            page_number=1,
            text="Public scientific reference: Agroforestry in semi-arid zones enhances biodiversity and soil moisture retention."
        )
    ]
    chunks_pub = DocumentChunker.chunk_pages(pages_pub)
    DocumentIndexer.index_document_chunks(
        document_id=doc_pub_id,
        title="FAO Agroforestry Guidelines",
        chunks=chunks_pub,
        scope="public",
        owner_user_id=None,
        organization="FAO"
    )

    # TEST A: User B queries for User A's document title
    results_b, _ = await search_hybrid_evidence(
        query_text="User A Secret Farm Audit",
        verified_user_id=user_b_id
    )
    # User B should find 0 chunks from User A's document
    user_a_leaks_b = [r for r in results_b if r.owner_user_id == user_a_id or secret_phrase in r.text]
    assert len(user_a_leaks_b) == 0, f"Tenant leak detected! User B retrieved User A's private document: {user_a_leaks_b}"

    # TEST B: Exact-text leak test — User B explicitly queries the secret phrase
    results_secret, _ = await search_hybrid_evidence(
        query_text=secret_phrase,
        verified_user_id=user_b_id
    )
    secret_leaks = [r for r in results_secret if secret_phrase in r.text]
    assert len(secret_leaks) == 0, f"Secret phrase leaked to User B! Leaks: {secret_leaks}"

    # User A queries for their own secret phrase -> MUST find it!
    results_a, _ = await search_hybrid_evidence(
        query_text=secret_phrase,
        verified_user_id=user_a_id
    )
    user_a_matches = [r for r in results_a if secret_phrase in r.text]
    assert len(user_a_matches) >= 1, "User A failed to retrieve their own private document!"

    # TEST E: Filter relaxation preserves tenant boundary
    # Search with a non-existent region filter to trigger relaxation
    results_relaxed, _ = await search_hybrid_evidence(
        query_text=secret_phrase,
        verified_user_id=user_b_id,
        filters=QueryFilters(region="NonExistentRegion12345")
    )
    relaxed_leaks = [r for r in results_relaxed if secret_phrase in r.text or r.owner_user_id == user_a_id]
    assert len(relaxed_leaks) == 0, "Filter relaxation bypassed tenant boundary!"

    # TEST F: IDOR Protection on source lookup
    # Find point ID of User A's chunk
    chunk_point_id = str(uuid.uuid5(uuid.UUID(doc_a_id), "child:0"))
    # User B attempts to access User A's point directly
    idor_point = store.get_source_point(point_id=chunk_point_id, verified_user_id=user_b_id)
    assert idor_point is None, "IDOR vulnerability: User B was able to read User A's private source directly!"

    # User A accesses their own point directly -> Should succeed
    owner_point = store.get_source_point(point_id=chunk_point_id, verified_user_id=user_a_id)
    assert owner_point is not None, "Owner was unable to access their own source point!"

    # TEST C: Synchronous Deletion (wait=True)
    delete_success = store.delete_document(document_id=doc_a_id, owner_user_id=user_a_id, wait=True)
    assert delete_success is True, "Delete operation failed"

    # User A searches again -> Document must be completely gone
    results_post_delete, _ = await search_hybrid_evidence(
        query_text=secret_phrase,
        verified_user_id=user_a_id
    )
    post_delete_matches = [r for r in results_post_delete if secret_phrase in r.text]
    assert len(post_delete_matches) == 0, "Document was not synchronously purged from Qdrant after deletion!"
