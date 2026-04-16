"""Shared httpx session, retry with tenacity, rate limiting, user-agent rotation.

Implements:
- IMPROVEMENTS.md §4: retry w/ exponential backoff (tenacity), 30s timeout,
  per-domain 2s delay, robots.txt compliance, 15 rotating user-agents
- docs/internet-scout.md scrapers/base.py pattern
"""

import asyncio
import random
import time
from contextlib import asynccontextmanager
from typing import AsyncGenerator
from urllib.parse import urlparse
from urllib.robotparser import RobotFileParser

import httpx
import structlog
from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception,
    before_sleep_log,
)
import logging

log = structlog.get_logger(__name__)

# ── User-Agent rotation pool (IMPROVEMENTS.md §4) ─────────────────────────────
USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_4_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Safari/605.1.15",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36 Edg/123.0.0.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:124.0) Gecko/20100101 Firefox/124.0",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1",
    "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:125.0) Gecko/20100101 Firefox/125.0",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 OPR/110.0.0.0",
    "Mozilla/5.0 (X11; Linux x86_64; rv:125.0) Gecko/20100101 Firefox/125.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Safari/605.1.15",
]

# Per-domain last-request timestamp for polite delays
_last_request_time: dict[str, float] = {}
POLITE_DELAY_SECONDS = 2.0
REQUEST_TIMEOUT_SECONDS = 30.0

# robots.txt cache: domain → RobotFileParser
_robots_cache: dict[str, RobotFileParser | None] = {}


def _random_ua() -> str:
    return random.choice(USER_AGENTS)


def _domain(url: str) -> str:
    return urlparse(url).netloc


async def _polite_delay(url: str) -> None:
    """Wait 2s between requests to the same domain (IMPROVEMENTS.md §4)."""
    domain = _domain(url)
    last = _last_request_time.get(domain, 0)
    wait = POLITE_DELAY_SECONDS - (time.monotonic() - last)
    if wait > 0:
        await asyncio.sleep(wait)
    _last_request_time[domain] = time.monotonic()


async def _check_robots(url: str, client: httpx.AsyncClient) -> bool:
    """Return True if scraping is allowed (IMPROVEMENTS.md §4)."""
    domain = _domain(url)
    if domain not in _robots_cache:
        robots_url = f"https://{domain}/robots.txt"
        try:
            resp = await client.get(robots_url, timeout=5)
            rp = RobotFileParser()
            rp.parse(resp.text.splitlines())
            _robots_cache[domain] = rp
        except Exception:
            _robots_cache[domain] = None

    rp = _robots_cache.get(domain)
    if rp is None:
        return True  # Can't fetch robots.txt — proceed cautiously
    return rp.can_fetch("*", url)


@asynccontextmanager
async def get_client() -> AsyncGenerator[httpx.AsyncClient, None]:
    """Yield a configured httpx AsyncClient with rotating user-agent."""
    headers = {"User-Agent": _random_ua(), "Accept-Language": "en-US,en;q=0.9"}
    async with httpx.AsyncClient(
        headers=headers,
        timeout=httpx.Timeout(REQUEST_TIMEOUT_SECONDS),
        follow_redirects=True,
    ) as client:
        yield client


_RETRYABLE_STATUS_CODES = {429, 500, 502, 503, 504}


def _is_retryable(exc: BaseException) -> bool:
    """Only retry transient errors — never retry 400, 401, 403, 404."""
    if isinstance(exc, (httpx.TimeoutException, httpx.ConnectError)):
        return True
    if isinstance(exc, httpx.HTTPStatusError):
        return exc.response.status_code in _RETRYABLE_STATUS_CODES
    return False


@retry(
    retry=retry_if_exception(_is_retryable),
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10),
    before_sleep=before_sleep_log(logging.getLogger(__name__), logging.WARNING),
    reraise=True,
)
async def safe_get(client: httpx.AsyncClient, url: str, **kwargs) -> httpx.Response:
    """GET with retry/backoff + robots.txt check + polite delay.
    Follows docs/internet-scout.md and IMPROVEMENTS.md §4 exactly.
    """
    allowed = await _check_robots(url, client)
    if not allowed:
        log.warning("robots_blocked", url=url)
        raise PermissionError(f"robots.txt disallows scraping: {url}")

    await _polite_delay(url)

    resp = await client.get(url, **kwargs)
    resp.raise_for_status()
    log.debug("fetched", url=url, status=resp.status_code, bytes=len(resp.content))
    return resp
