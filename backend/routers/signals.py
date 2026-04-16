"""Signals router."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from db.session import get_db
from db import signals as sig_db
from dependencies import get_current_user
from schemas.signal import SignalOut

router = APIRouter(prefix="/signals", tags=["signals"], dependencies=[Depends(get_current_user)])


@router.get("/", response_model=list[SignalOut])
async def list_signals(
    company_id: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    return await sig_db.get_signals(db, company_id=company_id)
