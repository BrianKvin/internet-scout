"""Slack notification helper."""

import httpx
from config import settings
import structlog

log = structlog.get_logger(__name__)


async def send_slack(message: str) -> bool:
    """Post a message to the configured Slack webhook.

    Returns True on success, False if webhook is not configured or fails.
    """
    webhook = getattr(settings, "SLACK_WEBHOOK_URL", None)
    if not webhook:
        log.debug("slack_not_configured")
        return False

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(webhook, json={"text": message})
            resp.raise_for_status()
            log.info("slack_sent", preview=message[:80])
            return True
    except Exception as exc:
        log.error("slack_send_failed", error=str(exc))
        return False


async def alert_source_health(source_name: str, health: str, z_score: float) -> None:
    await send_slack(
        f":warning: *Source health alert*\n"
        f"Source: `{source_name}`\n"
        f"Status: `{health}`\n"
        f"Z-score: `{z_score:.2f}`"
    )


async def alert_new_jobs(count: int, source_name: str) -> None:
    await send_slack(
        f":mag: *{count} new jobs* scraped from `{source_name}`"
    )
