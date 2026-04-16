"""Per-domain async rate limiter.

Uses a token-bucket approach so we never hammer the same domain.
One request per `interval` seconds, per domain.
"""

import asyncio
import time
from collections import defaultdict

import structlog

log = structlog.get_logger(__name__)

# Seconds between requests to the same domain
DEFAULT_INTERVAL = 2.0


class RateLimiter:
    """Async per-domain rate limiter with configurable interval."""

    def __init__(self, interval: float = DEFAULT_INTERVAL):
        self._interval = interval
        self._last: dict[str, float] = defaultdict(float)
        self._locks: dict[str, asyncio.Lock] = defaultdict(asyncio.Lock)

    async def wait(self, domain: str) -> None:
        """Wait until enough time has elapsed since the last request to domain."""
        async with self._locks[domain]:
            now = time.monotonic()
            elapsed = now - self._last[domain]
            if elapsed < self._interval:
                wait_secs = self._interval - elapsed
                log.debug("rate_limit_wait", domain=domain, wait=round(wait_secs, 2))
                await asyncio.sleep(wait_secs)
            self._last[domain] = time.monotonic()


# Module-level singleton shared across scrapers
limiter = RateLimiter()
