import pytest
from backend.src.intelligence.tracer import get_langfuse_client, trace_pipeline, trace_span

def test_tracer_no_op_fallback():
    # When credentials are not configured or empty, trace_pipeline should yield safely without throwing
    with trace_pipeline(
        name="test-pipeline",
        user_id="test_user",
        session_id="test_session",
        query_text="What is soil carbon?",
        tags=["test"]
    ) as root:
        assert root is not None
        root.update(output={"status": "ok"})

        with trace_span(
            name="test-span",
            as_type="retriever",
            input_data={"query": "test"}
        ) as child:
            assert child is not None
            child.update(output={"score": 0.95})

def test_tracer_client_retrieval():
    # Client should return either a Langfuse instance or None without crashing
    client = get_langfuse_client()
    # It should not raise an exception
    assert client is None or hasattr(client, "start_as_current_observation")
