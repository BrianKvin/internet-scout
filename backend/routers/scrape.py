"""Scrape trigger router — fire scrapes on demand."""

from datetime import datetime, timezone

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

import structlog
from db.session import AsyncSessionLocal, get_db
from db import sources as src_db, jobs as jobs_db, companies as co_db
from db import collections as col_db
from db.scrape_jobs import record_run
from dependencies import get_current_user
from scrapers.registry import run_scraper
from enricher.deduplicator import find_duplicates
from schemas.scrape import ScrapeResult
from schemas.scraped import validate_jobs, validate_companies
from utils.source_health import compute_health
from utils.url_validator import validate_scrape_url

log = structlog.get_logger(__name__)
router = APIRouter(prefix="/scrape", tags=["scrape"], dependencies=[Depends(get_current_user)])

JOB_LIKE_TYPES = {"jobs", "hn", "job_board"}
COMPANY_LIKE_TYPES = {"portfolio", "vc_portfolio"}


async def _get_or_create_source_collection(db: AsyncSession, source) -> str:
    """Get or create a collection for this source's scrape results."""
    col_name = f"{source.name} — Scrape Results"
    collection = await col_db.get_or_create_collection(
        db, col_name, category=source.type or "custom"
    )
    return collection.id


async def _store_in_collection(
    db: AsyncSession, collection_id: str, items: list[dict], source_id: str
) -> int:
    """Store scraped items in a collection. Returns count of new items."""
    clean_items = [
        {k: v for k, v in item.items() if k not in ("source_id", "dedup_key")}
        for item in items
    ]
    new_count, _ = await col_db.insert_collection_items(
        db, collection_id, scrape_job_id=None, items=clean_items
    )
    return new_count


async def _extract_companies(db: AsyncSession, items: list[dict], source_id: str) -> int:
    """Extract company data from scraped items and upsert into companies table."""
    companies_to_add = []
    for item in items:
        company_name = item.get("company") or item.get("name")
        if not company_name or len(company_name) < 2:
            continue

        companies_to_add.append({
            "name": company_name,
            "website": item.get("website") or item.get("apply_url"),
            "domain": item.get("domain"),
            "description": item.get("description"),
            "sector": item.get("sector"),
            "stage": item.get("stage"),
            "source_id": source_id,
        })

    if not companies_to_add:
        return 0

    inserted = await co_db.upsert_companies(db, companies_to_add)
    return len(inserted)


async def _run_source(source, db: AsyncSession) -> dict:
    t0 = datetime.now(timezone.utc)

    try:
        raw = await run_scraper(source)
    except Exception as exc:
        duration_ms = int((datetime.now(timezone.utc) - t0).total_seconds() * 1000)
        await record_run(
            db,
            source_id=source.id,
            status="failed",
            items_found=0,
            items_new=0,
            items_deduped=0,
            duration_ms=duration_ms,
            started_at=t0,
            error_message=str(exc)[:500],
        )
        await db.commit()
        log.error("scrape_failed", source_id=source.id, error=str(exc))
        raise HTTPException(502, f"Scrape failed for {source.name}")

    source_type = (source.type or "").lower()

    # Validate scraped data
    if source_type in COMPANY_LIKE_TYPES:
        validated = validate_companies(raw)
    else:
        validated = validate_jobs(raw)

    unique, dupes = find_duplicates(validated)

    # Store in typed tables (jobs or companies)
    new_count = 0
    if source_type in JOB_LIKE_TYPES:
        inserted = await jobs_db.upsert_jobs(db, unique)
        new_count = len(inserted)
    elif source_type in COMPANY_LIKE_TYPES:
        inserted = await co_db.upsert_companies(db, unique)
        new_count = len(inserted)
    else:
        inserted = await jobs_db.upsert_jobs(db, unique)
        new_count = len(inserted)

    # Store ALL results in a collection for export
    collection_id = await _get_or_create_source_collection(db, source)
    collection_new = await _store_in_collection(db, collection_id, unique, source.id)

    # Extract company data from job listings
    if source_type in JOB_LIKE_TYPES and unique:
        companies_added = await _extract_companies(db, unique, source.id)
        if companies_added:
            log.info("companies_extracted", source_id=source.id, count=companies_added)

    duration_ms = int((datetime.now(timezone.utc) - t0).total_seconds() * 1000)

    await record_run(
        db,
        source_id=source.id,
        status="success",
        items_found=len(raw),
        items_new=new_count,
        items_deduped=len(dupes),
        duration_ms=duration_ms,
        started_at=t0,
    )
    from db.sources import mark_scraped
    await mark_scraped(db, source.id, item_count=len(raw))
    await compute_health(db, source.id, len(raw))
    await db.commit()

    return {
        "source_id": source.id,
        "found": len(raw),
        "new": new_count,
        "dupes": len(dupes),
        "collection_id": collection_id,
        "collection_items_added": collection_new,
    }


@router.post("/{source_id}")
async def scrape_source(source_id: str, db: AsyncSession = Depends(get_db)):
    source = await src_db.get_source(db, source_id)
    if not source:
        raise HTTPException(404, "Source not found")

    validate_scrape_url(source.url)

    try:
        result = await _run_source(source, db)
    except HTTPException:
        raise
    except Exception as exc:
        log.error("scrape_endpoint_error", source_id=source_id, error=str(exc))
        raise HTTPException(500, "Internal scrape error")

    return result


async def _scrape_all_background() -> None:
    """Run all enabled sources in the background with a fresh DB session."""
    async with AsyncSessionLocal() as db:
        try:
            sources = await src_db.get_enabled_sources(db)
            for source in sources:
                try:
                    await _run_source(source, db)
                except Exception as exc:
                    log.error("scrape_all_source_failed", source_id=source.id, error=str(exc))
        except Exception as exc:
            log.error("scrape_all_failed", error=str(exc))


@router.post("/all/run")
async def scrape_all(
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    """Trigger a scrape of all enabled sources in the background."""
    sources = await src_db.get_enabled_sources(db)
    source_count = len(sources)
    background_tasks.add_task(_scrape_all_background)
    return {"message": f"Scraping {source_count} sources in background", "source_count": source_count}
