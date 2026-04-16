"""Webhook pipeline step.

POSTs scrape results to a configured external webhook URL.
"""

import httpx
from sqlalchemy.ext.asyncio import AsyncSession
import structlog

log = structlog.get_logger(__name__)


async def run(db: AsyncSession, config: dict, **kwargs) -> dict:
    """POST a JSON payload to a webhook URL.

    Config keys:
        url      (str) – webhook endpoint (required)
        headers  (dict, optional) – extra HTTP headers

    Kwargs forwarded as the JSON body.

    Returns: {"status_code": int}
    """
    url: str | None = config.get("url")
    if not url:
        log.warning("webhook_step_no_url")
        return {"status_code": 0}

    headers: dict = config.get("headers", {})
    payload: dict = {k: v for k, v in kwargs.items() if v is not None}

    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.post(url, json=payload, headers=headers)
            log.info("webhook_step_done", url=url, status=resp.status_code)
            return {"status_code": resp.status_code}
    except Exception as exc:
        log.error("webhook_step_failed", url=url, error=str(exc))
        return {"status_code": 0}
