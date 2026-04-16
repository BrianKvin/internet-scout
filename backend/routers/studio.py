"""Scrape Studio router — manage instruction-driven scrape jobs.

Studio is the primary scrape creation flow. Each scrape job points at a
source, adds keyword filters, and routes results to a collection.
"""

from datetime import datetime, timezone

from fastapi import APIRouter, Body, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

import structlog
from db import collections as col_db, sources as src_db, companies as co_db
from db.scrape_jobs import (
    create_scrape_job,
    get_runs,
    get_scrape_job,
    get_scrape_jobs,
    record_run,
)
from db.session import get_db
from dependencies import get_current_user
from scrapers.executor import execute_scrape
from scrapers.registry import STRATEGY_MAP, run_scraper
from schemas.studio import ScrapeJobCreate, ScrapeJobOut, PreviewResponse, RunResponse
from schemas.activity import ScrapeRunOut
from schemas.scraped import validate_jobs, validate_companies
from enricher.deduplicator import find_duplicates
from utils.url_validator import validate_scrape_url

log = structlog.get_logger(__name__)
router = APIRouter(prefix="/studio", tags=["studio"], dependencies=[Depends(get_current_user)])


def _matches_keywords(item: dict, keywords: list[str]) -> bool:
    """Check if any keyword appears in any string value of the item."""
    if not keywords:
        return True
    searchable = " ".join(
        str(v).lower() for v in item.values() if isinstance(v, str) and v
    )
    return any(kw.lower() in searchable for kw in keywords)


def _filter_by_keywords(items: list[dict], keywords: list[str]) -> list[dict]:
    """Filter items, keeping only those matching at least one keyword."""
    if not keywords:
        return items
    return [item for item in items if _matches_keywords(item, keywords)]


async def _resolve_source(db: AsyncSession, body: ScrapeJobCreate) -> tuple[str, str]:
    """Resolve the URL and strategy from source_id or direct fields."""
    if body.source_id:
        source = await src_db.get_source(db, body.source_id)
        if not source:
            raise HTTPException(404, "Source not found")
        return source.url, source.strategy
    if body.url:
        strategy = body.strategy.value if body.strategy else "generic_list"
        return body.url, strategy
    raise HTTPException(400, "Either source_id or url is required")


async def _run_scrape(url: str, strategy: str, config: dict) -> list[dict]:
    """Run the appropriate scraper for the given strategy."""
    if strategy in STRATEGY_MAP:
        return await STRATEGY_MAP[strategy](url, "studio")
    return await execute_scrape(url, config)


async def _extract_companies(db: AsyncSession, items: list[dict], source_id: str | None) -> int:
    """Extract company data from scraped items and upsert."""
    companies = []
    for item in items:
        name = item.get("company") or item.get("name")
        if not name or len(name) < 2:
            continue
        companies.append({
            "name": name,
            "website": item.get("website") or item.get("apply_url"),
            "domain": item.get("domain"),
            "description": item.get("description"),
            "sector": item.get("sector"),
            "stage": item.get("stage"),
            "source_id": source_id,
        })
    if not companies:
        return 0
    inserted = await co_db.upsert_companies(db, companies)
    return len(inserted)


@router.get("/", response_model=list[ScrapeJobOut])
async def list_jobs(db: AsyncSession = Depends(get_db)):
    return await get_scrape_jobs(db)


@router.post("/", status_code=201, response_model=ScrapeJobOut)
async def create_job(body: ScrapeJobCreate, db: AsyncSession = Depends(get_db)):
    url, strategy = await _resolve_source(db, body)
    validate_scrape_url(url)

    # Resolve collection
    collection_id = body.collection_id
    if not collection_id and body.collection_name:
        collection = await col_db.get_or_create_collection(
            db, body.collection_name, category="custom"
        )
        collection_id = collection.id

    payload = {
        "name": body.name,
        "source_id": body.source_id,
        "url": url,
        "instructions": body.instructions,
        "keywords": body.keywords if body.keywords else None,
        "config": {**(body.config or {}), "strategy": strategy},
        "collection_id": collection_id,
        "schedule": body.schedule.value if hasattr(body.schedule, "value") else body.schedule,
        "notify": body.notify,
    }

    job = await create_scrape_job(db, payload)
    await db.commit()
    return job


@router.post("/preview", response_model=PreviewResponse)
async def preview(
    url: str = Query(...),
    strategy: str = Query("generic_list"),
    limit: int = Query(10, le=50),
    keywords: str = Query(""),
):
    """Preview scrape results with optional keyword filtering."""
    validate_scrape_url(url)
    try:
        raw = await _run_scrape(url, strategy, {})
    except Exception as exc:
        log.error("preview_scrape_failed", url=url, strategy=strategy, error=str(exc))
        raise HTTPException(502, f"Scrape failed: could not fetch {url}")
    keyword_list = [k.strip() for k in keywords.split(",") if k.strip()] if keywords else []
    filtered = _filter_by_keywords(raw, keyword_list)
    return PreviewResponse(
        items=filtered[:limit],
        filtered=len(filtered),
        total=len(raw),
    )


@router.post("/{job_id}/run", response_model=RunResponse)
async def run_job(job_id: str, db: AsyncSession = Depends(get_db)):
    job = await get_scrape_job(db, job_id)
    if not job:
        raise HTTPException(404, "Scrape job not found")

    t0 = datetime.now(timezone.utc)
    config = job.config or {}
    strategy = config.get("strategy", "generic_list")

    try:
        raw = await _run_scrape(job.url, strategy, config)
    except Exception as exc:
        duration_ms = int((datetime.now(timezone.utc) - t0).total_seconds() * 1000)
        await record_run(
            db, scrape_job_id=job_id, status="failed",
            items_found=0, items_new=0, items_deduped=0,
            duration_ms=duration_ms, started_at=t0,
            error_message=str(exc)[:500],
        )
        await db.commit()
        log.error("studio_run_failed", job_id=job_id, error=str(exc))
        raise HTTPException(502, "Scrape failed")

    # Apply keyword filter
    keywords = job.keywords or []
    filtered = _filter_by_keywords(raw, keywords)

    # Validate
    source_type = config.get("source_type", "job_board")
    if source_type in ("vc_portfolio", "portfolio"):
        validated = validate_companies(filtered)
    else:
        validated = validate_jobs(filtered)

    # Dedup + store in collection
    unique, dupes = find_duplicates(validated)
    collection_new = 0
    if job.collection_id and unique:
        clean_items = [
            {k: v for k, v in item.items() if k not in ("source_id", "dedup_key")}
            for item in unique
        ]
        collection_new, _ = await col_db.insert_collection_items(
            db, job.collection_id, scrape_job_id=job_id, items=clean_items
        )

    # Extract companies
    companies_added = 0
    if unique:
        companies_added = await _extract_companies(db, unique, job.source_id)

    duration_ms = int((datetime.now(timezone.utc) - t0).total_seconds() * 1000)
    await record_run(
        db, scrape_job_id=job_id, source_id=job.source_id,
        status="success",
        items_found=len(raw), items_new=collection_new,
        items_deduped=len(dupes), duration_ms=duration_ms,
        started_at=t0,
    )
    await db.commit()

    return RunResponse(
        scraped=collection_new,
        items=unique[:10],
        collection_id=job.collection_id,
        companies_added=companies_added,
    )


@router.get("/{job_id}/runs", response_model=list[ScrapeRunOut])
async def job_runs(job_id: str, limit: int = Query(20), db: AsyncSession = Depends(get_db)):
    return await get_runs(db, scrape_job_id=job_id, limit=limit)
