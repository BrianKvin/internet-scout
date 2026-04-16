"""CRUD operations for Jobs."""

import hashlib, re
from datetime import datetime
from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession
from models.job import Job


def _make_dedup_key(title: str, company: str) -> str:
    normalised = re.sub(r"[^a-z0-9]", "", f"{title}{company}".lower())
    return hashlib.md5(normalised.encode()).hexdigest()


async def get_jobs(
    db: AsyncSession,
    search: str | None = None,
    source_id: str | None = None,
    is_remote: bool | None = None,
    is_new: bool | None = None,
    sector: str | None = None,
    stage: str | None = None,
    limit: int = 100,
    offset: int = 0,
) -> list[Job]:
    q = select(Job).order_by(Job.scraped_at.desc())

    if search:
        term = f"%{search.lower()}%"
        q = q.where(
            or_(
                Job.title.ilike(term),
                Job.company.ilike(term),
                Job.description.ilike(term),
                Job.sector.ilike(term),
            )
        )
    if source_id:
        q = q.where(Job.source_id == source_id)
    if is_remote is not None:
        q = q.where(Job.is_remote.is_(is_remote))
    if is_new is not None:
        q = q.where(Job.is_new.is_(is_new))
    if sector:
        q = q.where(Job.sector.ilike(f"%{sector}%"))
    if stage:
        q = q.where(Job.stage.ilike(f"%{stage}%"))

    q = q.limit(limit).offset(offset)
    result = await db.execute(q)
    return result.scalars().all()


async def get_job(db: AsyncSession, job_id: str) -> Job | None:
    result = await db.execute(select(Job).where(Job.id == job_id))
    return result.scalar_one_or_none()


async def upsert_jobs(db: AsyncSession, items: list[dict]) -> list[Job]:
    """Insert new jobs, skipping duplicates by dedup_key. Returns newly inserted jobs."""
    new_jobs = []
    for item in items:
        title = item.get("title", "")
        company = item.get("company", "")
        if not title or not company:
            continue

        dedup_key = _make_dedup_key(title, company)

        existing = await db.execute(select(Job).where(Job.dedup_key == dedup_key))
        if existing.scalar_one_or_none():
            continue

        # Detect remote from location
        location = item.get("location", "") or ""
        is_remote = "remote" in location.lower()

        job = Job(
            title=title,
            company=company,
            company_id=item.get("company_id"),
            source_id=item.get("source_id"),
            dedup_key=dedup_key,
            location=item.get("location"),
            salary=item.get("salary"),
            description=item.get("description"),
            apply_url=item.get("apply_url", ""),
            sector=item.get("sector"),
            stage=item.get("stage"),
            is_remote=is_remote,
            is_new=True,
        )
        db.add(job)
        new_jobs.append(job)

    if new_jobs:
        await db.flush()
    return new_jobs


async def toggle_save(db: AsyncSession, job_id: str) -> Job | None:
    job = await get_job(db, job_id)
    if not job:
        return None
    job.saved_at = None if job.saved_at else datetime.utcnow()
    await db.flush()
    return job


async def get_saved_jobs(db: AsyncSession) -> list[Job]:
    result = await db.execute(
        select(Job).where(Job.saved_at.is_not(None)).order_by(Job.saved_at.desc())
    )
    return result.scalars().all()


async def count_jobs(db: AsyncSession) -> int:
    from sqlalchemy import func
    result = await db.execute(select(func.count(Job.id)))
    return result.scalar_one()
