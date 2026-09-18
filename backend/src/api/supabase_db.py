import logging
from typing import Optional, List, Dict, Any
from backend.src.config import settings

logger = logging.getLogger("supabase_db")

# In-memory mock fallback when Supabase keys are not set
_mock_documents: Dict[str, Dict[str, Any]] = {}
_mock_messages: List[Dict[str, Any]] = []

def get_supabase_client():
    if settings.SUPABASE_URL and settings.SUPABASE_SERVICE_ROLE_KEY and "example.supabase.co" not in settings.SUPABASE_URL:
        try:
            from supabase import create_client, Client
            return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)
        except Exception as e:
            logger.warning(f"Could not connect to live Supabase: {e}")
            return None
    return None

class SupabaseService:
    @staticmethod
    def list_user_documents(verified_user_id: str) -> List[Dict[str, Any]]:
        """
        Lists documents strictly scoped to verified_user_id.
        NEVER relies on RLS alone when using service role key.
        """
        client = get_supabase_client()
        if client:
            try:
                # Explicit server-side scoping to verified_user_id
                response = client.table("documents")\
                    .select("*")\
                    .eq("owner_user_id", verified_user_id)\
                    .neq("status", "deleted")\
                    .execute()
                return response.data or []
            except Exception as e:
                logger.error(f"Supabase list_documents error: {e}")

        # Local in-memory fallback
        return [
            doc for doc in _mock_documents.values()
            if doc.get("owner_user_id") == verified_user_id and doc.get("status") != "deleted"
        ]

    @staticmethod
    def create_document_record(
        document_id: str,
        verified_user_id: str,
        title: str,
        content_hash: str,
        page_count: int,
        chunk_count: int,
        storage_path: Optional[str] = None
    ) -> Dict[str, Any]:
        doc_record = {
            "id": document_id,
            "owner_user_id": verified_user_id,
            "title": title,
            "storage_path": storage_path,
            "scope": "private",
            "status": "ready",
            "content_hash": content_hash,
            "page_count": page_count,
            "chunk_count": chunk_count
        }

        client = get_supabase_client()
        if client:
            try:
                client.table("documents").insert(doc_record).execute()
                return doc_record
            except Exception as e:
                logger.error(f"Supabase insert document error: {e}")

        _mock_documents[document_id] = doc_record
        return doc_record

    @staticmethod
    def delete_document_record(document_id: str, verified_user_id: str) -> bool:
        """
        Deletes document metadata with strict scoping to owner_user_id.
        """
        client = get_supabase_client()
        if client:
            try:
                # Explicitly scoped to owner_user_id to prevent IDOR
                client.table("documents")\
                    .update({"status": "deleted"})\
                    .eq("id", document_id)\
                    .eq("owner_user_id", verified_user_id)\
                    .execute()
                return True
            except Exception as e:
                logger.error(f"Supabase delete document error: {e}")
                return False

        if document_id in _mock_documents and _mock_documents[document_id].get("owner_user_id") == verified_user_id:
            _mock_documents[document_id]["status"] = "deleted"
            return True
        return False

    @staticmethod
    def save_message(
        conversation_id: str,
        verified_user_id: str,
        role: str,
        content: str,
        citations: List[Dict[str, Any]],
        request_id: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        record = {
            "conversation_id": conversation_id,
            "owner_user_id": verified_user_id,
            "role": role,
            "content": content,
            "citations": citations,
            "request_id": request_id
        }
        client = get_supabase_client()
        if client:
            try:
                res = client.table("messages").insert(record).execute()
                return res.data[0] if res.data else record
            except Exception as e:
                logger.error(f"Supabase save_message error: {e}")

        _mock_messages.append(record)
        return record
