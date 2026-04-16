"""Jobs router."""

from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from db.session import get_db
from db import jobs as jobs_db
from dependencies import get_current_user
from schemas.job import JobOut, JobCountOut

router = APIRouter(prefix="/jobs", tags=["jobs"], dependencies=[Depends(get_current_user)])


@router.get("/", response_model=list[JobOut])
async def list_jobs(
    search: str | None = Query(None),
    sector: str | None = Query(None),
    is_remote: bool | None = Query(None),
    is_new: bool | None = Query(None),
    limit: int = Query(100, le=500),
    offset: int = Query(0),
    db: AsyncSession = Depends(get_db),
):
    return await jobs_db.get_jobs(
        db,
        search=search,
        sector=sector,
        is_remote=is_remote,
        is_new=is_new,
        limit=limit,
        offset=offset,
    )


@router.get("/saved", response_model=list[JobOut])
async def list_saved_jobs(db: AsyncSession = Depends(get_db)):
    return await jobs_db.get_saved_jobs(db)


@router.patch("/{job_id}/save", response_model=JobOut)
async def save_job(job_id: str, db: AsyncSession = Depends(get_db)):
    job = await jobs_db.toggle_save(db, job_id)
    if not job:
        raise HTTPException(404, "Job not found")
    await db.commit()
    return job


@router.get("/count", response_model=JobCountOut)
async def job_count(db: AsyncSession = Depends(get_db)):
    count = await jobs_db.count_jobs(db)
    return JobCountOut(count=count)
