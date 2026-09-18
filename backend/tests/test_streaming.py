import pytest
import json
from unittest.mock import AsyncMock, MagicMock
from backend.src.api.schemas import QueryRequest, EnvironmentalContext
from backend.src.api.auth import AuthUser
from backend.src.generator.stream import generate_query_sse_stream

@pytest.mark.asyncio
async def test_sse_stream_events():
    """
    Validates SSE event sequence: status -> evidence -> status -> token -> done
    """
    req = QueryRequest(
        question="What should I change to restore declining soil organic carbon?",
        environmental_context=EnvironmentalContext(
            soil_organic_carbon_pct=0.3,
            annual_rainfall_mm=350.0,
            current_land_use="Monoculture wheat"
        )
    )
    user = AuthUser(user_id="test_user_sse", is_authenticated=True)

    # Mock request that stays connected
    mock_request = MagicMock()
    mock_request.is_disconnected = AsyncMock(return_value=False)

    events = []
    async for event_str in generate_query_sse_stream(req, user, mock_request):
        events.append(event_str)

    assert len(events) > 0

    # Parse event types
    event_types = []
    for ev in events:
        lines = ev.strip().split("\n")
        for line in lines:
            if line.startswith("event: "):
                event_types.append(line.replace("event: ", "").strip())

    assert "status" in event_types
    assert "evidence" in event_types
    assert "token" in event_types
    assert "done" in event_types

@pytest.mark.asyncio
async def test_client_disconnect_cancels_generation():
    """
    Simulates client disconnecting mid-stream.
    Ensures generator halts immediately without completing full token generation.
    """
    req = QueryRequest(
        question="Explain agroforestry benefits in semi-arid zones.",
        environmental_context=EnvironmentalContext(
            soil_organic_carbon_pct=0.4,
            annual_rainfall_mm=400.0,
            current_land_use="Degraded pasture"
        )
    )
    user = AuthUser(user_id="test_user_disconnect", is_authenticated=True)

    # Mock request that simulates disconnect after 2 checks
    disconnect_counter = [0]
    async def mock_is_disconnected():
        disconnect_counter[0] += 1
        return disconnect_counter[0] >= 3

    mock_request = MagicMock()
    mock_request.is_disconnected = mock_is_disconnected

    events = []
    async for event_str in generate_query_sse_stream(req, user, mock_request):
        events.append(event_str)

    # Event stream should have been interrupted before normal completion
    event_types = [
        line.replace("event: ", "").strip()
        for ev in events for line in ev.strip().split("\n")
        if line.startswith("event: ")
    ]

    # Because of early abort, 'done' event should NOT have been yielded
    assert "done" not in event_types, "Stream completed fully despite client disconnect!"
