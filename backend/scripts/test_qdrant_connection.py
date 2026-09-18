import os
import sys
import time

# Ensure project root is on PYTHONPATH
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from backend.src.config import settings

def test_qdrant_connectivity():
    print("=" * 60)
    print("Darukaa.Earth AI — Qdrant Cloud Connectivity Diagnostic")
    print("=" * 60)

    url = settings.QDRANT_URL
    api_key = settings.QDRANT_API_KEY

    print(f"Target Qdrant URL : {url}")
    print(f"API Key Present   : {'Yes (' + api_key[:4] + '...' + api_key[-4:] + ')' if api_key else 'NO (Missing)'}")

    if not api_key or not url or "localhost" in url:
        print("\n[STATUS: BLOCKED BY MISSING CREDENTIALS]")
        print("Live Qdrant Cloud credentials are not yet configured in .env.")
        print("Please configure the following keys in your .env file:")
        print("  QDRANT_URL=https://<your-cluster-id>.<region>.<cloud>.qdrant.io:6333")
        print("  QDRANT_API_KEY=<your-secret-api-key>")
        print("  QDRANT_COLLECTION_NAME=darukaa_knowledge")
        print("=" * 60)
        return False

    try:
        from qdrant_client import QdrantClient
        print(f"\nAttempting connection to {url}...")
        t0 = time.perf_counter()
        client = QdrantClient(url=url, api_key=api_key, timeout=15.0)
        collections_response = client.get_collections()
        elapsed_ms = (time.perf_counter() - t0) * 1000.0

        print(f"[SUCCESS] Connected in {elapsed_ms:.1f}ms!")
        col_names = [c.name for c in collections_response.collections]
        print(f"Existing collections in cluster: {col_names}")

        target_col = settings.QDRANT_COLLECTION_NAME
        if target_col in col_names:
            col_info = client.get_collection(collection_name=target_col)
            print(f"[STATUS] Target collection '{target_col}' exists.")
            print(f"  Points Count : {col_info.points_count}")
            print(f"  Indexed Vectors : {col_info.indexed_vectors_count}")
            print(f"  Status : {col_info.status}")
        else:
            print(f"[NOTE] Target collection '{target_col}' not yet initialized.")
            print("  Initializing collection with 384-dim dense and BM25 sparse configuration...")
            from backend.src.retriever.qdrant_store import QdrantKnowledgeStore
            store = QdrantKnowledgeStore(client=client)
            print(f"[SUCCESS] Collection '{target_col}' initialized successfully!")

        print("=" * 60)
        return True
    except Exception as e:
        print(f"\n[ERROR] Failed to connect to Qdrant cluster: {e}")
        print("=" * 60)
        return False

if __name__ == "__main__":
    test_qdrant_connectivity()
