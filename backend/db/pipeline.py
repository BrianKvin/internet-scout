"""CRUD operations for Pipeline items."""

from datetime import datetime
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from models.pipeline import PipelineItem
from models.job import Job


VALID_STAGES = {"discovered", "researched", "applied", "interviewing", "offer", "rejected"}


async def get_pipeline(db: AsyncSession) -> list[dict]:
    """Return pipeline items with denormalized job data for the kanban board."""
    result = await db.execute(
        select(PipelineItem, Job)
        .join(Job, PipelineItem.job_id == Job.id)
        .order_by(PipelineItem.updated_at.desc())
    )
    rows = result.all()
    items = []
    for pip, job in rows:
        items.append({
            "id": pip.id,
            "job_id": pip.job_id,
            "stage": pip.stage,
            "notes": pip.notes,
            "applied_at": pip.applied_at.isoformat() if pip.applied_at else None,
            "updated_at": pip.updated_at.isoformat(),
            "job": {
                "id": job.id,
                "title": job.title,
                "company": job.company,
                "location": job.location,
                "salary": job.salary,
                "apply_url": job.apply_url,
                "sector": job.sector,
                "stage": job.stage,
                "is_remote": job.is_remote,
                "source_id": job.source_id,
                "scraped_at": job.scraped_at.isoformat(),
            },
        })
    return items


async def get_pipeline_item(db: AsyncSession, item_id: str) -> PipelineItem | None:
    result = await db.execute(select(PipelineItem).where(PipelineItem.id == item_id))
    return result.scalar_one_or_none()


async def add_to_pipeline(db: AsyncSession, job_id: str) -> PipelineItem:
    item = PipelineItem(job_id=job_id, stage="discovered")
    db.add(item)
    await db.flush()
    return item


async def update_stage(db: AsyncSession, item_id: str, stage: str) -> PipelineItem | None:
    if stage not in VALID_STAGES:
        raise ValueError(f"Invalid stage '{stage}'. Must be one of {VALID_STAGES}")
    item = await get_pipeline_item(db, item_id)
    if not item:
        return None
    item.stage = stage
    item.updated_at = datetime.utcnow()
    if stage == "applied" and not item.applied_at:
        item.applied_at = datetime.utcnow()
    await db.flush()
    return item


async def get_funnel_counts(db: AsyncSession) -> dict:
    result = await db.execute(
        select(PipelineItem.stage, func.count(PipelineItem.id))
        .group_by(PipelineItem.stage)
    )
    rows = result.all()
    counts = {stage: 0 for stage in VALID_STAGES}
    for stage, count in rows:
        counts[stage] = count
    return counts
