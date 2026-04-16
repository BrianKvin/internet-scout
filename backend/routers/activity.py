"""Activity router for scrape run history and summary stats."""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Query
from sqlalchemy import distinct, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from db.session import get_db
from dependencies import get_current_user
from db.scrape_jobs import get_runs
from models.scrape_run import ScrapeRun
from models.source import Source
from schemas.activity import ScrapeRunOut, ActivityStats

router = APIRouter(prefix="/activity", tags=["activity"], dependencies=[Depends(get_current_user)])


@router.get("/runs", response_model=list[ScrapeRunOut])
async def list_runs(
    status: str | None = Query(None),
    source_id: str | None = Query(None),
    limit: int = Query(50, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
):
    runs = await get_runs(db, source_id=source_id, status=status, limit=limit)

    source_ids = {run.source_id for run in runs if run.source_id}
    source_names: dict[str, str] = {}
    if source_ids:
        result = await db.execute(
            select(Source.id, Source.name).where(Source.id.in_(source_ids))
        )
        source_names = {sid: name for sid, name in result.all()}

    return [
        ScrapeRunOut(
            id=run.id,
            source_id=run.source_id,
            source_name=source_names.get(run.source_id or "", run.source_id or "Unknown"),
            status=run.status,
            items_found=run.items_found,
            items_new=run.items_new,
            items_deduped=run.items_deduped,
            duration_ms=run.duration_ms,
            error_message=run.error_message,
            started_at=run.started_at,
            finished_at=run.finished_at,
        )
        for run in runs
    ]


@router.get("/stats", response_model=ActivityStats)
async def activity_stats(db: AsyncSession = Depends(get_db)):
    total_runs = (await db.execute(select(func.count(ScrapeRun.id)))).scalar_one()

    success_runs = (
        await db.execute(
            select(func.count(ScrapeRun.id)).where(ScrapeRun.status == "success")
        )
    ).scalar_one()

    start_of_day = datetime.now(timezone.utc).replace(
        hour=0, minute=0, second=0, microsecond=0
    )
    items_today_raw = (
        await db.execute(
            select(func.coalesce(func.sum(ScrapeRun.items_new), 0)).where(
                ScrapeRun.started_at >= start_of_day
            )
        )
    ).scalar_one()

    active_sources = (
        await db.execute(select(func.count(distinct(ScrapeRun.source_id))))
    ).scalar_one()

    success_rate = 0
    if total_runs > 0:
        success_rate = round((success_runs / total_runs) * 100)

    return ActivityStats(
        total_runs=total_runs,
        success_rate=success_rate,
        items_collected_today=int(items_today_raw or 0),
        active_source_count=int(active_sources or 0),
    )
