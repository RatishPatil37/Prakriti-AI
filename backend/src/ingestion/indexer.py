import uuid
import hashlib
from typing import List, Optional, Dict, Any
from qdrant_client.models import PointStruct
from backend.src.config import settings
from backend.src.ingestion.chunker import Chunk
from backend.src.retriever.qdrant_store import store
from backend.src.retriever.hybrid_search import generate_local_embedding, generate_local_bm25_sparse

class DocumentIndexer:
    @staticmethod
    def index_document_chunks(
        document_id: str,
        title: str,
        chunks: List[Chunk],
        scope: str = "private",
        owner_user_id: Optional[str] = None,
        organization: str = "User Uploaded Evidence",
        publication_year: Optional[int] = None,
        source_type: str = "user_upload",
        doi: Optional[str] = None,
        source_url: Optional[str] = None
    ) -> int:
        """
        Indexes chunks into the Qdrant knowledge collection with named dense and BM25 sparse vectors.
        Uses deterministic point IDs and marks points with ingestion_status='ready'.
        """
        points = []

        try:
            doc_uuid = uuid.UUID(document_id)
        except ValueError:
            doc_uuid = uuid.uuid5(uuid.NAMESPACE_DNS, document_id)

        for chunk in chunks:
            point_id = str(uuid.uuid5(doc_uuid, f"child:{chunk.chunk_index}"))

            dense_vec = generate_local_embedding(chunk.child_text, settings.DENSE_VECTOR_SIZE)
            sparse_vec = generate_local_bm25_sparse(chunk.child_text)

            payload = {
                "chunk_id": point_id,
                "document_id": document_id,
                "parent_id": str(doc_uuid),
                "scope": scope,
                "owner_user_id": owner_user_id,
                "source_title": title,
                "organization": organization,
                "publication_year": publication_year,
                "source_type": source_type,
                "doi": doi,
                "source_url": source_url,
                "page_start": chunk.page_start,
                "page_end": chunk.page_end,
                "text": chunk.child_text,
                "parent_text": chunk.parent_text,
                "ingestion_status": "ready"
            }

            points.append(
                PointStruct(
                    id=point_id,
                    vector={
                        "dense": dense_vec,
                        "bm25": sparse_vec
                    },
                    payload=payload
                )
            )

        if points:
            store.upsert_points(points=points, wait=True)

        return len(points)
