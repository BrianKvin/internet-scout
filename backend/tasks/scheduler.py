"""APScheduler background task scheduler.

Runs daily scrapes at 07:00 UTC and the news monitor at 08:00 UTC.
From internet-scout.md and IMPROVEMENTS.md.
"""

from __future__ import annotations

from datetime import datetime, timezone

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

from db.session import async_session_factory
from db.sources import get_enabled_sources, mark_scraped
from db.jobs import upsert_jobs
from db.companies import upsert_companies
from db.scrape_jobs import record_run
from scrapers.registry import run_scraper
from enricher.deduplicator import find_duplicates
from signals.news_monitor import monitor_news
from notifications.digest import send_daily_digest
from utils.source_health import compute_health
import structlog

log = structlog.get_logger(__name__)

scheduler = AsyncIOScheduler(timezone="UTC")


async def _scrape_all_sources() -> None:
    """Scrape all enabled sources and upsert results into the DB."""
    async with async_session_factory() as db:
        sources = await get_enabled_sources(db)
        log.info("scheduler_scrape_start", source_count=len(sources))

        for source in sources:
            t0 = datetime.now(timezone.utc)
            try:
                raw = await run_scraper(source)
            except Exception as exc:
                log.error("scheduler_source_failed", source_id=source.id, error=str(exc))
                await record_run(
                    db,
                    source_id=source.id,
                    status="failed",
                    items_found=0,
                    items_new=0,
                    items_deduped=0,
                    duration_ms=0,
                    error_message=str(exc),
                    started_at=t0,
                )
                continue

            # Deduplicate
            unique, dupes = find_duplicates(raw)

            # Persist based on source type
            new_count = 0
            if source.type in ("jobs", "hn"):
                new_count = len(await upsert_jobs(db, unique))
            elif source.type == "portfolio":
                new_count = len(await upsert_companies(db, unique))
            else:
                new_count = len(await upsert_jobs(db, unique))

            duration_ms = int(
                (datetime.now(timezone.utc) - t0).total_seconds() * 1000
            )

            await record_run(
                db,
                source_id=source.id,
                status="success" if new_count >= 0 else "partial",
                items_found=len(raw),
                items_new=new_count,
                items_deduped=len(dupes),
                duration_ms=duration_ms,
                started_at=t0,
            )
            await mark_scraped(db, source.id, job_count=len(raw))

            # Update health via z-score
            consecutive_fails = 1 if len(raw) == 0 else 0
            await compute_health(db, source.id, len(raw), consecutive_fails)

        await db.commit()
        log.info("scheduler_scrape_done")


async def _run_news_monitor() -> None:
    async with async_session_factory() as db:
        count = await monitor_news(db)
        await db.commit()
        log.info("scheduler_news_monitor_done", signals=count)


async def _send_digest() -> None:
    async with async_session_factory() as db:
        await send_daily_digest(db)


def start_scheduler() -> None:
    """Register jobs and start the scheduler."""
    # Daily scrape at 07:00 UTC
    scheduler.add_job(
        _scrape_all_sources,
        CronTrigger(hour=7, minute=0),
        id="daily_scrape",
        replace_existing=True,
    )

    # News monitor at 08:00 UTC
    scheduler.add_job(
        _run_news_monitor,
        CronTrigger(hour=8, minute=0),
        id="news_monitor",
        replace_existing=True,
    )

    # Digest at 08:30 UTC
    scheduler.add_job(
        _send_digest,
        CronTrigger(hour=8, minute=30),
        id="daily_digest",
        replace_existing=True,
    )

    scheduler.start()
    log.info("scheduler_started")


def stop_scheduler() -> None:
    if scheduler.running:
        scheduler.shutdown(wait=False)
        log.info("scheduler_stopped")
