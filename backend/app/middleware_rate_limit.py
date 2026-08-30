"""Rate limiting middleware for general API endpoints.

Provides a FastAPI middleware that limits requests per IP per time window.
Uses in-memory storage (per-process). For multi-process deployments, consider Redis.

Usage in main.py:
    from .middleware_rate_limit import RateLimitMiddleware
    app.add_middleware(RateLimitMiddleware, max_requests=60, window_seconds=60)
"""

import os
import time
from collections import defaultdict
from threading import Lock

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

# Endpoints that are exempt from rate limiting (auth, health, etc.)
_EXEMPT_PREFIXES = (
    "/api/auth/login",
    "/api/auth/register",
    "/api/auth/wallet",
    "/api/auth/refresh",
    "/api/auth/me",
    "/health",
    "/docs",
    "/openapi.json",
    "/graphql",
)


class RateLimitMiddleware(BaseHTTPMiddleware):
    """In-memory per-IP rate limiter.

    Args:
        max_requests: Maximum requests per window per IP.
        window_seconds: Time window in seconds.
    """

    def __init__(self, app, max_requests: int = 60, window_seconds: int = 60):
        super().__init__(app)
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self._requests: dict[str, list[float]] = defaultdict(list)
        self._lock = Lock()

    def _get_client_ip(self, request: Request) -> str:
        forwarded = request.headers.get("x-forwarded-for")
        if forwarded:
            return forwarded.split(",")[0].strip()
        return request.client.host if request.client else "unknown"

    async def dispatch(self, request: Request, call_next) -> Response:
        # Skip rate limiting in test mode
        if os.environ.get("SOUNDHUB_ENV", "").lower() in ("test", "testing"):
            return await call_next(request)

        # Skip rate limiting for exempt endpoints
        path = request.url.path
        if any(path.startswith(p) for p in _EXEMPT_PREFIXES):
            return await call_next(request)

        ip = self._get_client_ip(request)
        now = time.time()

        with self._lock:
            # Clean old entries
            self._requests[ip] = [
                t for t in self._requests[ip] if now - t < self.window_seconds
            ]

            if len(self._requests[ip]) >= self.max_requests:
                retry_after = int(
                    self._requests[ip][0] + self.window_seconds - now
                )
                return JSONResponse(
                    status_code=429,
                    content={
                        "detail": "Too many requests",
                        "retry_after": max(retry_after, 1),
                    },
                    headers={"Retry-After": str(max(retry_after, 1))},
                )

            self._requests[ip].append(now)

        return await call_next(request)
