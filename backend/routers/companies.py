"""Companies router."""

from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from db.session import get_db
from db import companies as co_db
from dependencies import get_current_user
from schemas.company import CompanyOut

router = APIRouter(prefix="/companies", tags=["companies"], dependencies=[Depends(get_current_user)])


@router.get("/", response_model=list[CompanyOut])
async def list_companies(
    search: str | None = Query(None),
    sector: str | None = Query(None),
    stage: str | None = Query(None),
    enriched: bool | None = Query(None),
    limit: int = Query(100, le=500),
    offset: int = Query(0),
    db: AsyncSession = Depends(get_db),
):
    return await co_db.get_companies(
        db,
        search=search,
        sector=sector,
        stage=stage,
        enriched=enriched,
        limit=limit,
        offset=offset,
    )


@router.get("/unenriched", response_model=list[CompanyOut])
async def list_unenriched(db: AsyncSession = Depends(get_db)):
    return await co_db.get_unenriched_companies(db)
