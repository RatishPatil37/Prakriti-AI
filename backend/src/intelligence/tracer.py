import logging
from contextlib import contextmanager
from typing import Optional, Dict, Any, List

from backend.src.config import settings

logger = logging.getLogger("tracer")

_langfuse_client = None
_client_initialized = False

def get_langfuse_client():
    """
    Returns singleton Langfuse client instance if credentials are configured.
    """
    global _langfuse_client, _client_initialized
    if _client_initialized:
        return _langfuse_client

    _client_initialized = True
    public_key = settings.LANGFUSE_PUBLIC_KEY
    secret_key = settings.LANGFUSE_SECRET_KEY
    base_url = settings.LANGFUSE_BASE_URL or "https://cloud.langfuse.com"

    if not public_key or not secret_key:
        logger.info("Langfuse keys not configured in settings — telemetry running in no-op mode.")
        _langfuse_client = None
        return None

    try:
        import os
        os.environ["LANGFUSE_PUBLIC_KEY"] = public_key
        os.environ["LANGFUSE_SECRET_KEY"] = secret_key
        os.environ["LANGFUSE_HOST"] = base_url

        from langfuse import Langfuse
        _langfuse_client = Langfuse(
            public_key=public_key,
            secret_key=secret_key,
            host=base_url
        )
        logger.info(f"Langfuse client initialized successfully (host: {base_url})")
    except Exception as e:
        logger.warning(f"Failed to initialize Langfuse client: {e}. Running in no-op mode.")
        _langfuse_client = None

    return _langfuse_client


class NoOpObservation:
    """Safe fallback observation that safely ignores updates and ends without crashing."""
    def update(self, *args, **kwargs):
        pass

    def end(self, *args, **kwargs):
        pass


@contextmanager
def trace_pipeline(
    name: str,
    user_id: Optional[str] = None,
    session_id: Optional[str] = None,
    query_text: Optional[str] = None,
    tags: Optional[List[str]] = None,
    metadata: Optional[Dict[str, Any]] = None
):
    """
    Root trace context manager for an end-to-end query pipeline.
    Propagates user_id, session_id, and tags to all child observations.
    """
    client = get_langfuse_client()
    if not client:
        yield NoOpObservation()
        return

    from langfuse import propagate_attributes

    trace_tags = list(tags) if tags else ["prakriti-ai", "rag"]
    if settings.ENVIRONMENT not in trace_tags:
        trace_tags.append(settings.ENVIRONMENT)

    effective_user_id = user_id or "anonymous"

    try:
        with propagate_attributes(
            user_id=effective_user_id,
            session_id=session_id,
            tags=trace_tags,
            metadata=metadata or {},
            environment=settings.ENVIRONMENT,
            trace_name=name
        ):
            with client.start_as_current_observation(
                name=name,
                as_type="chain",
                input={"query": query_text} if query_text else None
            ) as obs:
                yield obs
    except Exception as e:
        logger.warning(f"Langfuse root trace error: {e}")
        yield NoOpObservation()
    finally:
        try:
            client.flush()
        except Exception:
            pass


@contextmanager
def trace_span(
    name: str,
    as_type: str = "span",
    input_data: Optional[Any] = None,
    metadata: Optional[Dict[str, Any]] = None,
    model: Optional[str] = None
):
    """
    Child observation context manager for discrete pipeline stages (retriever, guardrail, generation, etc.)
    """
    client = get_langfuse_client()
    if not client:
        yield NoOpObservation()
        return

    try:
        kwargs = {
            "name": name,
            "as_type": as_type,
            "input": input_data,
            "metadata": metadata
        }
        if model:
            kwargs["model"] = model

        with client.start_as_current_observation(**kwargs) as obs:
            yield obs
    except Exception as e:
        logger.warning(f"Langfuse span error ({name}): {e}")
        yield NoOpObservation()
