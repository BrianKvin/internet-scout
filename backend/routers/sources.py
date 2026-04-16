"""Sources router — CRUD for the scraper source registry."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from db.session import get_db
from db import sources as src_db
from dependencies import get_current_user
from schemas.source import SourceCreate, SourceOut
from utils.url_validator import validate_scrape_url

router = APIRouter(prefix="/sources", tags=["sources"], dependencies=[Depends(get_current_user)])


@router.get("/", response_model=list[SourceOut])
async def list_sources(db: AsyncSession = Depends(get_db)):
    return await src_db.get_all_sources(db)


@router.post("/", status_code=201, response_model=SourceOut)
async def create_source(body: SourceCreate, db: AsyncSession = Depends(get_db)):
    validate_scrape_url(body.url)
    source = await src_db.create_source(db, body.model_dump())
    await db.commit()
    return source


@router.patch("/{source_id}/toggle", response_model=SourceOut)
async def toggle_source(source_id: str, db: AsyncSession = Depends(get_db)):
    source = await src_db.toggle_source(db, source_id)
    if not source:
        raise HTTPException(404, "Source not found")
    await db.commit()
    return source


@router.delete("/{source_id}", status_code=204)
async def delete_source(source_id: str, db: AsyncSession = Depends(get_db)):
    await src_db.delete_source(db, source_id)
    await db.commit()


@router.post("/seed", status_code=201)
async def seed_sources(db: AsyncSession = Depends(get_db)):
    """Seed default sources from docs/internet-scout.md."""
    await src_db.seed_default_sources(db)
    await db.commit()
    return {"seeded": True}
