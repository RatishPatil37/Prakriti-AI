import pytest
from fastapi import Request, HTTPException
from backend.src.api.rate_limit import SlidingWindowRateLimiter
from backend.src.config import settings

class DummyClient:
    def __init__(self, host: str):
        self.host = host

class DummyRequest:
    def __init__(self, host: str = "127.0.0.1"):
        self.client = DummyClient(host)
        self.headers = {}

def test_anonymous_ip_rate_limiting():
    limiter = SlidingWindowRateLimiter()
    req = DummyRequest("192.168.1.50")
    limit = settings.RATE_LIMIT_ANONYMOUS_PER_MINUTE

    # First 'limit' calls should succeed
    for _ in range(limit):
        limiter.check_rate_limit(req, user_id=None)

    # Call limit + 1 must raise HTTP 429
    with pytest.raises(HTTPException) as exc_info:
        limiter.check_rate_limit(req, user_id=None)

    assert exc_info.value.status_code == 429
    assert "Anonymous rate limit exceeded" in exc_info.value.detail

def test_authenticated_user_rate_limiting():
    limiter = SlidingWindowRateLimiter()
    req = DummyRequest("192.168.1.50")
    user_id = "user_test_999"
    limit = settings.RATE_LIMIT_AUTHENTICATED_PER_MINUTE

    for _ in range(limit):
        limiter.check_rate_limit(req, user_id=user_id)

    with pytest.raises(HTTPException) as exc_info:
        limiter.check_rate_limit(req, user_id=user_id)

    assert exc_info.value.status_code == 429
    assert "Authenticated rate limit exceeded" in exc_info.value.detail
