import logging
from typing import Optional, List, Dict, Any
from qdrant_client import QdrantClient
from qdrant_client.models import (
    VectorParams,
    Distance,
    SparseVectorParams,
    Modifier,
    PayloadSchemaType,
    PointStruct,
    Filter,
    FieldCondition,
    MatchValue,
    UpdateStatus
)
from backend.src.config import settings

logger = logging.getLogger("qdrant_store")

class QdrantKnowledgeStore:
    def __init__(self, client: Optional[QdrantClient] = None):
        if client:
            self.client = client
        elif settings.QDRANT_API_KEY and settings.QDRANT_URL:
            logger.info(f"Connecting to Qdrant cluster at {settings.QDRANT_URL}")
            self.client = QdrantClient(
                url=settings.QDRANT_URL,
                api_key=settings.QDRANT_API_KEY,
                timeout=60.0
            )
        else:
            # Local or in-memory fallback for offline test suites
            logger.info("Initializing local in-memory Qdrant client")
            self.client = QdrantClient(":memory:")

        self.collection_name = settings.QDRANT_COLLECTION_NAME
        self._initialize_collection()

    def _initialize_collection(self):
        """
        Configures the single multi-tenant knowledge collection with:
        - Named dense vector (384 dimensions, Cosine)
        - Named sparse vector (BM25 with IDF modifier)
        - Payload indexes for rapid tenant filtering
        """
        collections = [c.name for c in self.client.get_collections().collections]
        if self.collection_name not in collections:
            logger.info(f"Creating Qdrant collection: {self.collection_name}")
            self.client.create_collection(
                collection_name=self.collection_name,
                vectors_config={
                    "dense": VectorParams(
                        size=settings.DENSE_VECTOR_SIZE,
                        distance=Distance.COSINE
                    )
                },
                sparse_vectors_config={
                    "bm25": SparseVectorParams(
                        modifier=Modifier.IDF
                    )
                }
            )

            # Create payload indexes on mandatory filter fields
            index_fields = [
                ("scope", PayloadSchemaType.KEYWORD),
                ("owner_user_id", PayloadSchemaType.KEYWORD),
                ("document_id", PayloadSchemaType.KEYWORD),
                ("ingestion_status", PayloadSchemaType.KEYWORD),
                ("source_type", PayloadSchemaType.KEYWORD),
                ("region", PayloadSchemaType.KEYWORD),
                ("climate_zone", PayloadSchemaType.KEYWORD),
                ("publication_year", PayloadSchemaType.INTEGER)
            ]
            for field_name, schema_type in index_fields:
                try:
                    self.client.create_payload_index(
                        collection_name=self.collection_name,
                        field_name=field_name,
                        field_schema=schema_type
                    )
                except Exception as e:
                    logger.debug(f"Payload index note for {field_name}: {e}")

    def upsert_points(self, points: List[PointStruct], wait: bool = True) -> UpdateStatus:
        """
        Idempotently inserts or updates points in the knowledge collection.
        """
        result = self.client.upsert(
            collection_name=self.collection_name,
            points=points,
            wait=wait
        )
        return result.status

    def delete_document(self, document_id: str, owner_user_id: str, wait: bool = True) -> bool:
        """
        Synchronously deletes all points belonging to a specific document and owner.
        Uses wait=True to guarantee immediate removal from vector retrieval.
        """
        delete_filter = Filter(
            must=[
                FieldCondition(key="document_id", match=MatchValue(value=document_id)),
                FieldCondition(key="owner_user_id", match=MatchValue(value=owner_user_id))
            ]
        )
        result = self.client.delete(
            collection_name=self.collection_name,
            points_selector=delete_filter,
            wait=wait
        )
        return result.status == UpdateStatus.COMPLETED

    def get_source_point(self, point_id: str, verified_user_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """
        Looks up a single source point, enforcing tenant access rules to prevent IDOR:
        Returns point if scope is public, or if scope is private and owner matches verified_user_id.
        """
        records = self.client.retrieve(
            collection_name=self.collection_name,
            ids=[point_id],
            with_payload=True,
            with_vectors=False
        )
        if not records:
            return None

        payload = records[0].payload or {}
        scope = payload.get("scope", "public")
        owner = payload.get("owner_user_id")

        if scope == "public":
            return payload
        elif scope == "private" and verified_user_id and owner == verified_user_id:
            return payload

        # Block cross-tenant inspection
        return None

# Global instance
store = QdrantKnowledgeStore()
