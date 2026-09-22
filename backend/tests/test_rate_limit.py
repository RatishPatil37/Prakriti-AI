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

def test_rate_limiter_stale_key_pruning():
    import time
    limiter = SlidingWindowRateLimiter()
    old_time = time.time() - 120.0  # 2 minutes ago
    limiter._ip_history["stale_bot_ip"] = [old_time]
    limiter._user_history["stale_user_id"] = [old_time]
    limiter._last_prune = time.time() - 400.0  # Force prune interval trigger

    # Check limit triggers pruning
    req = DummyRequest("192.168.1.100")
    limiter.check_rate_limit(req, user_id=None)

    assert "stale_bot_ip" not in limiter._ip_history
    assert "stale_user_id" not in limiter._user_history

