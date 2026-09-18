import logging
from typing import List
from qdrant_client.models import SparseVector
from backend.src.config import settings

logger = logging.getLogger("embeddings")

# Lazy-loaded fastembed singletons
_dense_model = None
_sparse_model = None

def get_dense_model():
    global _dense_model
    if _dense_model is None:
        from fastembed import TextEmbedding
        logger.info(f"Loading dense embedding model: {settings.QDRANT_DENSE_MODEL}")
        _dense_model = TextEmbedding(model_name=settings.QDRANT_DENSE_MODEL)
    return _dense_model

def get_sparse_model():
    global _sparse_model
    if _sparse_model is None:
        from fastembed import SparseTextEmbedding
        logger.info(f"Loading BM25 sparse model: {settings.QDRANT_SPARSE_MODEL}")
        _sparse_model = SparseTextEmbedding(model_name=settings.QDRANT_SPARSE_MODEL)
    return _sparse_model

def compute_dense_embedding(text: str) -> List[float]:
    """
    Computes a 384-dimensional dense semantic embedding for a single text.
    Used consistently for query embedding and document indexing.
    """
    model = get_dense_model()
    embeddings = list(model.embed([text]))
    return embeddings[0].tolist()

def compute_dense_embeddings_batch(texts: List[str]) -> List[List[float]]:
    """
    Computes dense embeddings in batch.
    """
    if not texts:
        return []
    model = get_dense_model()
    embeddings = list(model.embed(texts))
    return [e.tolist() for e in embeddings]

def compute_sparse_embedding(text: str) -> SparseVector:
    """
    Computes native Qdrant BM25 sparse vector (indices and values) for a single text.
    Used consistently for BM25 query prefetch and document sparse vectors.
    """
    model = get_sparse_model()
    embeddings = list(model.embed([text]))
    sparse_obj = embeddings[0]
    return SparseVector(
        indices=sparse_obj.indices.tolist(),
        values=sparse_obj.values.tolist()
    )

def compute_sparse_embeddings_batch(texts: List[str]) -> List[SparseVector]:
    """
    Computes BM25 sparse embeddings in batch.
    """
    if not texts:
        return []
    model = get_sparse_model()
    embeddings = list(model.embed(texts))
    return [
        SparseVector(
            indices=s.indices.tolist(),
            values=s.values.tolist()
        )
        for s in embeddings
    ]
