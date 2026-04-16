"""Daily digest builder.

Compiles a summary of new jobs and signals found in the last 24 hours.
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from models.job import Job
from models.signal import Signal
from notifications.slack import send_slack
import structlog

log = structlog.get_logger(__name__)


async def build_digest(db: AsyncSession) -> str:
    """Build a plain-text digest of the past 24 hours."""
    since = datetime.now(timezone.utc) - timedelta(hours=24)

    # Count new jobs
    job_count_q = await db.execute(
        select(func.count()).where(Job.scraped_at >= since)
    )
    new_jobs: int = job_count_q.scalar_one_or_none() or 0

    # Count new signals
    sig_count_q = await db.execute(
        select(func.count()).where(Signal.detected_at >= since)
    )
    new_signals: int = sig_count_q.scalar_one_or_none() or 0

    # Top 5 newest jobs
    recent_jobs_q = await db.execute(
        select(Job).order_by(Job.scraped_at.desc()).limit(5)
    )
    recent_jobs = recent_jobs_q.scalars().all()

    lines = [
        f"*Internet Scout — Daily Digest* ({datetime.now(timezone.utc).strftime('%Y-%m-%d')})",
        f"• {new_jobs} new jobs scraped in the last 24h",
        f"• {new_signals} company signals detected",
        "",
        "*Latest jobs:*",
    ]
    for j in recent_jobs:
        lines.append(f"  - {j.title} @ {j.company}")

    return "\n".join(lines)


async def send_daily_digest(db: AsyncSession) -> None:
    """Build and send the daily digest to Slack."""
    text = await build_digest(db)
    sent = await send_slack(text)
    if sent:
        log.info("daily_digest_sent")
    else:
        log.info("daily_digest_skipped_no_slack")
