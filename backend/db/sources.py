"""CRUD operations for Sources."""

from datetime import datetime
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from models.source import Source


async def get_all_sources(db: AsyncSession) -> list[Source]:
    result = await db.execute(select(Source).order_by(Source.name))
    return result.scalars().all()


async def get_enabled_sources(db: AsyncSession) -> list[Source]:
    result = await db.execute(select(Source).where(Source.enabled.is_(True)))
    return result.scalars().all()


async def get_source(db: AsyncSession, source_id: str) -> Source | None:
    result = await db.execute(select(Source).where(Source.id == source_id))
    return result.scalar_one_or_none()


async def create_source(db: AsyncSession, data: dict) -> Source:
    source = Source(**data)
    db.add(source)
    await db.flush()
    await db.refresh(source)
    return source


async def toggle_source(db: AsyncSession, source_id: str) -> Source | None:
    source = await get_source(db, source_id)
    if not source:
        return None
    source.enabled = not source.enabled
    await db.flush()
    return source


async def update_health(db: AsyncSession, source_id: str, health: str) -> None:
    await db.execute(
        update(Source).where(Source.id == source_id).values(health=health)
    )


async def mark_scraped(db: AsyncSession, source_id: str, item_count: int) -> None:
    await db.execute(
        update(Source)
        .where(Source.id == source_id)
        .values(
            last_scraped=datetime.utcnow(),
            job_count=Source.job_count + item_count,
        )
    )


async def delete_source(db: AsyncSession, source_id: str) -> bool:
    source = await get_source(db, source_id)
    if not source:
        return False
    await db.delete(source)
    return True


async def seed_default_sources(db: AsyncSession) -> None:
    """Insert default sources if the table is empty."""
    existing = await get_all_sources(db)
    if existing:
        return

    defaults = [
        {"id": "src_yc",     "name": "Y Combinator",         "url": "https://workatastartup.com/jobs",    "type": "job_board",    "strategy": "yc",                   "enabled": True},
        {"id": "src_seq",    "name": "Sequoia Capital",       "url": "https://sequoiacap.com/companies",   "type": "vc_portfolio", "strategy": "generic_portfolio",    "enabled": True},
        {"id": "src_pear",   "name": "Pear VC",               "url": "https://pear.vc/portfolio",          "type": "vc_portfolio", "strategy": "generic_portfolio",    "enabled": True},
        {"id": "src_wf",     "name": "Wellfound",             "url": "https://wellfound.com/jobs",         "type": "job_board",    "strategy": "generic_jobs",         "enabled": False, "notes": "Disabled — heavy rate limiting"},
        {"id": "src_a16z",   "name": "Andreessen Horowitz",   "url": "https://a16z.com/portfolio",         "type": "vc_portfolio", "strategy": "playwright_portfolio", "enabled": False},
        {"id": "src_ls",     "name": "Lightspeed Ventures",   "url": "https://lsvp.com/portfolio",         "type": "vc_portfolio", "strategy": "playwright_portfolio", "enabled": False},
        {"id": "src_accel",  "name": "Accel",                 "url": "https://www.accel.com/companies",    "type": "vc_portfolio", "strategy": "playwright_portfolio", "enabled": False},
        {"id": "src_gv",     "name": "GV (Google Ventures)",  "url": "https://www.gv.com/portfolio",       "type": "vc_portfolio", "strategy": "playwright_portfolio", "enabled": False},
        {"id": "src_hn",     "name": "HN Who is Hiring",      "url": "https://news.ycombinator.com",       "type": "job_board",    "strategy": "hn_hiring",            "enabled": False},
        {"id": "src_remote", "name": "Remote OK",             "url": "https://remoteok.com",               "type": "job_board",    "strategy": "generic_jobs",         "enabled": False},
    ]
    for d in defaults:
        db.add(Source(**d))
    await db.flush()
