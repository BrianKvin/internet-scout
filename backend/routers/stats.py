"""Dashboard and source performance statistics router."""

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from db import sources as src_db
from dependencies import get_current_user
from db.scrape_jobs import get_recent_run_counts
from db.session import get_db
from models.collection import Collection, CollectionItem
from models.scrape_run import ScrapeRun
from models.source import Source
from schemas.stats import DashboardStats, SourcePerformanceOut

router = APIRouter(prefix="/stats", tags=["stats"], dependencies=[Depends(get_current_user)])


@router.get("/dashboard", response_model=DashboardStats)
async def dashboard_stats(db: AsyncSession = Depends(get_db)):
    items_collected = (await db.execute(select(func.count(CollectionItem.id)))).scalar_one()
    active_sources = (
        await db.execute(select(func.count(Source.id)).where(Source.enabled.is_(True)))
    ).scalar_one()
    collections = (await db.execute(select(func.count(Collection.id)))).scalar_one()
    scrape_runs = (await db.execute(select(func.count(ScrapeRun.id)))).scalar_one()

    return DashboardStats(
        items_collected=items_collected,
        active_sources=active_sources,
        collections=collections,
        scrape_runs=scrape_runs,
    )


@router.get("/source-performance", response_model=list[SourcePerformanceOut])
async def source_performance(db: AsyncSession = Depends(get_db)):
    all_sources = await src_db.get_all_sources(db)

    rows = []
    for source in all_sources:
        items_per_run = await get_recent_run_counts(db, source.id, n=10)
        rows.append(
            SourcePerformanceOut(
                source_id=source.id,
                source_name=source.name,
                items_per_run=items_per_run,
                last_run_items=items_per_run[0] if items_per_run else 0,
                health_history=[source.health for _ in range(max(1, len(items_per_run)))],
            )
        )

    return rows
