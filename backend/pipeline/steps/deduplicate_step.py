"""Deduplicate pipeline step.

Removes duplicate jobs from the DB using TF-IDF cosine similarity.
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from models.job import Job
from enricher.deduplicator import find_duplicates
import structlog

log = structlog.get_logger(__name__)


async def run(db: AsyncSession, config: dict, **kwargs) -> dict:
    """Deduplicate recent jobs.

    Config keys:
        limit      (int) – max jobs to process in one pass (default 500)
        threshold  (float) – cosine similarity threshold (default 0.85)

    Returns: {"removed": int}
    """
    limit: int = config.get("limit", 500)
    threshold: float = config.get("threshold", 0.85)

    result = await db.execute(
        select(Job).order_by(Job.scraped_at.desc()).limit(limit)
    )
    jobs = result.scalars().all()

    if not jobs:
        return {"removed": 0}

    job_dicts = [
        {"id": j.id, "title": j.title, "company": j.company, "description": j.description or ""}
        for j in jobs
    ]

    unique, dupes = find_duplicates(job_dicts, threshold=threshold)
    dupe_ids = [d["id"] for d in dupes]

    if dupe_ids:
        await db.execute(delete(Job).where(Job.id.in_(dupe_ids)))
        await db.commit()

    log.info("dedup_step_done", removed=len(dupe_ids), total=len(jobs))
    return {"removed": len(dupe_ids)}
