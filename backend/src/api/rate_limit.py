import time
from collections import defaultdict
from typing import Dict, List, Optional
from fastapi import Request, HTTPException, status
from backend.src.config import settings

class SlidingWindowRateLimiter:
    """
    In-memory sliding-window rate limiter for API abuse prevention.
    Applies strict IP-based limits to unauthenticated users and
    per-user_id limits to authenticated requests.
    """
    def __init__(self):
        self._ip_history: Dict[str, List[float]] = defaultdict(list)
        self._user_history: Dict[str, List[float]] = defaultdict(list)

    def _clean_window(self, timestamps: List[float], window_seconds: float = 60.0) -> List[float]:
        cutoff = time.time() - window_seconds
        return [t for t in timestamps if t > cutoff]

    def check_rate_limit(self, request: Request, user_id: Optional[str] = None):
        now = time.time()
        window_seconds = 60.0

        if user_id:
            # Authenticated user limit
            limit = settings.RATE_LIMIT_AUTHENTICATED_PER_MINUTE
            history = self._clean_window(self._user_history[user_id], window_seconds)
            if len(history) >= limit:
                retry_after = int(window_seconds - (now - history[0])) + 1
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=f"Authenticated rate limit exceeded ({limit} requests/min). Please wait.",
                    headers={"Retry-After": str(max(1, retry_after))}
                )
            history.append(now)
            self._user_history[user_id] = history
        else:
            # Unauthenticated IP limit
            limit = settings.RATE_LIMIT_ANONYMOUS_PER_MINUTE
            client_ip = request.client.host if request.client else "unknown"
            # Respect X-Forwarded-For if behind a proxy
            forwarded = request.headers.get("X-Forwarded-For")
            if forwarded:
                client_ip = forwarded.split(",")[0].strip()

            history = self._clean_window(self._ip_history[client_ip], window_seconds)
            if len(history) >= limit:
                retry_after = int(window_seconds - (now - history[0])) + 1
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=f"Anonymous rate limit exceeded ({limit} requests/min). Please authenticate for higher throughput.",
                    headers={"Retry-After": str(max(1, retry_after))}
                )
            history.append(now)
            self._ip_history[client_ip] = history

limiter = SlidingWindowRateLimiter()
