"""CRUD operations for Companies."""

from datetime import datetime
from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession
from models.company import Company


async def get_companies(
    db: AsyncSession,
    search: str | None = None,
    sector: str | None = None,
    stage: str | None = None,
    enriched: bool | None = None,
    limit: int = 100,
    offset: int = 0,
) -> list[Company]:
    q = select(Company).order_by(Company.created_at.desc())

    if search:
        term = f"%{search.lower()}%"
        q = q.where(
            or_(
                Company.name.ilike(term),
                Company.domain.ilike(term),
                Company.sector.ilike(term),
            )
        )
    if sector:
        q = q.where(Company.sector.ilike(f"%{sector}%"))
    if stage:
        q = q.where(Company.stage.ilike(f"%{stage}%"))
    if enriched is not None:
        q = q.where(Company.enriched.is_(enriched))

    q = q.limit(limit).offset(offset)
    result = await db.execute(q)
    return result.scalars().all()


async def get_company(db: AsyncSession, company_id: str) -> Company | None:
    result = await db.execute(select(Company).where(Company.id == company_id))
    return result.scalar_one_or_none()


async def get_company_by_name(db: AsyncSession, name: str) -> Company | None:
    result = await db.execute(select(Company).where(Company.name == name))
    return result.scalar_one_or_none()


async def upsert_companies(db: AsyncSession, items: list[dict]) -> list[Company]:
    """Insert new companies, skipping existing by name."""
    new_companies = []
    for item in items:
        name = item.get("name", "").strip()
        if not name:
            continue

        existing = await get_company_by_name(db, name)
        if existing:
            continue

        company = Company(
            name=name,
            domain=item.get("domain"),
            website=item.get("website"),
            careers_url=item.get("careers_url"),
            source_id=item.get("source_id"),
            sector=item.get("sector"),
            stage=item.get("stage"),
            description=item.get("description"),
        )
        db.add(company)
        new_companies.append(company)

    if new_companies:
        await db.flush()
    return new_companies


async def get_unenriched_companies(db: AsyncSession, limit: int = 50) -> list[Company]:
    result = await db.execute(
        select(Company)
        .where(Company.enriched.is_(False))
        .where(Company.domain.is_not(None))
        .limit(limit)
    )
    return result.scalars().all()


async def mark_enriched(
    db: AsyncSession,
    company_id: str,
    careers_url: str | None = None,
) -> None:
    company = await get_company(db, company_id)
    if not company:
        return
    company.enriched = True
    company.enriched_at = datetime.utcnow()
    if careers_url:
        company.careers_url = careers_url
    await db.flush()


async def count_companies(db: AsyncSession) -> int:
    from sqlalchemy import func
    result = await db.execute(select(func.count(Company.id)))
    return result.scalar_one()
