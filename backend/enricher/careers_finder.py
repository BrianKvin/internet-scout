"""Careers URL finder.

Probes common paths to discover a company's careers/jobs page.
"""

import httpx
import structlog
from scrapers.base import get_client

log = structlog.get_logger(__name__)

# Paths to probe, in priority order
PATHS = [
    "/careers",
    "/jobs",
    "/join",
    "/join-us",
    "/work-with-us",
    "/about/careers",
    "/hiring",
]


async def find_careers_url(website: str) -> str | None:
    """Return the first responding careers path for the given website root.

    Args:
        website: Base URL, e.g. "https://example.com"

    Returns:
        Full URL of careers page, or None if none found.
    """
    base = website.rstrip("/")
    async with get_client() as client:
        for path in PATHS:
            url = f"{base}{path}"
            try:
                resp = await client.head(url, follow_redirects=True, timeout=10)
                if resp.status_code < 400:
                    log.info("careers_url_found", company=base, url=url)
                    return str(resp.url)  # resolved URL after redirects
            except Exception:
                continue  # path doesn't exist, try next

    log.info("careers_url_not_found", company=base)
    return None
