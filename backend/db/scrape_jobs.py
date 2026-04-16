"""CRUD operations for ScrapeJobs and ScrapeRuns."""

from datetime import datetime
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from models.scrape_job import ScrapeJob
from models.scrape_run import ScrapeRun


# ── ScrapeJob ──────────────────────────────────────────────────────────────────

async def get_scrape_jobs(db: AsyncSession) -> list[ScrapeJob]:
    result = await db.execute(select(ScrapeJob).order_by(ScrapeJob.created_at.desc()))
    return result.scalars().all()


async def get_scrape_job(db: AsyncSession, job_id: str) -> ScrapeJob | None:
    result = await db.execute(select(ScrapeJob).where(ScrapeJob.id == job_id))
    return result.scalar_one_or_none()


async def create_scrape_job(db: AsyncSession, data: dict) -> ScrapeJob:
    job = ScrapeJob(
        name=data["name"],
        url=data["url"],
        instructions=data.get("instructions", ""),
        config=data.get("config", {}),
        collection_id=data.get("collection_id"),
        schedule=data.get("schedule", "manual"),
        notify=data.get("notify", False),
    )
    db.add(job)
    await db.flush()
    return job


async def get_scheduled_jobs(db: AsyncSession, schedule: str) -> list[ScrapeJob]:
    """Return all jobs with the given schedule type (daily/weekly)."""
    result = await db.execute(
        select(ScrapeJob).where(ScrapeJob.schedule == schedule)
    )
    return result.scalars().all()


async def update_scrape_job_after_run(
    db: AsyncSession, job_id: str, item_count: int, health: str = "ok"
) -> None:
    await db.execute(
        update(ScrapeJob)
        .where(ScrapeJob.id == job_id)
        .values(last_run=datetime.utcnow(), last_count=item_count, health=health)
    )


# ── ScrapeRun (observability audit trail — IMPROVEMENTS.md §5) ─────────────────

async def record_run(
    db: AsyncSession,
    *,
    source_id: str | None = None,
    scrape_job_id: str | None = None,
    status: str,
    items_found: int,
    items_new: int,
    items_deduped: int,
    duration_ms: int,
    error_message: str | None = None,
    started_at: datetime,
) -> ScrapeRun:
    # Strip timezone info — the DB column is TIMESTAMP WITHOUT TIME ZONE
    naive_started = started_at.replace(tzinfo=None) if started_at.tzinfo else started_at
    run = ScrapeRun(
        source_id=source_id,
        scrape_job_id=scrape_job_id,
        status=status,
        items_found=items_found,
        items_new=items_new,
        items_deduped=items_deduped,
        duration_ms=duration_ms,
        error_message=error_message,
        started_at=naive_started,
        finished_at=datetime.utcnow(),
    )
    db.add(run)
    await db.flush()
    return run


async def get_runs(
    db: AsyncSession,
    source_id: str | None = None,
    scrape_job_id: str | None = None,
    status: str | None = None,
    limit: int = 50,
) -> list[ScrapeRun]:
    q = select(ScrapeRun).order_by(ScrapeRun.started_at.desc())
    if source_id:
        q = q.where(ScrapeRun.source_id == source_id)
    if scrape_job_id:
        q = q.where(ScrapeRun.scrape_job_id == scrape_job_id)
    if status:
        q = q.where(ScrapeRun.status == status)
    q = q.limit(limit)
    result = await db.execute(q)
    return result.scalars().all()


async def get_recent_run_counts(db: AsyncSession, source_id: str, n: int = 10) -> list[int]:
    """Return the last N items_found counts for z-score health check (IMPROVEMENTS.md §14b)."""
    result = await db.execute(
        select(ScrapeRun.items_found)
        .where(ScrapeRun.source_id == source_id)
        .order_by(ScrapeRun.started_at.desc())
        .limit(n)
    )
    return [r for (r,) in result.all()]
