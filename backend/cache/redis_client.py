"""Redis client with 1-hour TTL helper.

From IMPROVEMENTS.md — cache scrape results to avoid redundant HTTP calls.
"""

import json
from typing import Any
import redis.asyncio as aioredis
from config import settings
import structlog

log = structlog.get_logger(__name__)

DEFAULT_TTL = 3600  # 1 hour


def _make_client() -> aioredis.Redis:
    return aioredis.from_url(
        settings.REDIS_URL,
        encoding="utf-8",
        decode_responses=True,
    )


# Module-level singleton
_redis: aioredis.Redis | None = None


def get_redis() -> aioredis.Redis:
    global _redis
    if _redis is None:
        _redis = _make_client()
    return _redis


async def cache_get(key: str) -> Any | None:
    """Return cached value (deserialised JSON) or None."""
    r = get_redis()
    try:
        raw = await r.get(key)
        if raw is None:
            return None
        return json.loads(raw)
    except Exception as exc:
        log.warning("cache_get_error", key=key, error=str(exc))
        return None


async def cache_set(key: str, value: Any, ttl: int = DEFAULT_TTL) -> None:
    """Serialise value to JSON and store with TTL."""
    r = get_redis()
    try:
        await r.set(key, json.dumps(value), ex=ttl)
    except Exception as exc:
        log.warning("cache_set_error", key=key, error=str(exc))


async def cache_delete(key: str) -> None:
    r = get_redis()
    try:
        await r.delete(key)
    except Exception as exc:
        log.warning("cache_delete_error", key=key, error=str(exc))


async def close_redis() -> None:
    """Call on app shutdown."""
    global _redis
    if _redis:
        await _redis.aclose()
        _redis = None
