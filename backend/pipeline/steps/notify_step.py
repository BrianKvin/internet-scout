"""Notify pipeline step.

Sends a Slack message summarising the scrape run results.
"""

from sqlalchemy.ext.asyncio import AsyncSession
from notifications.slack import send_slack
import structlog

log = structlog.get_logger(__name__)


async def run(db: AsyncSession, config: dict, **kwargs) -> dict:
    """Send a Slack notification with scrape summary.

    Kwargs expected:
        new_count (int)   – number of new items found
        source_name (str) – name of the source that was scraped

    Config keys:
        message_template (str, optional) – override message

    Returns: {"sent": bool}
    """
    new_count: int = kwargs.get("new_count", 0)
    source_name: str = kwargs.get("source_name", "unknown source")
    template: str = config.get(
        "message_template",
        f":mag: *{new_count} new jobs* from `{source_name}`",
    )

    sent = await send_slack(template)
    log.info("notify_step_done", sent=sent, new_count=new_count)
    return {"sent": sent}
