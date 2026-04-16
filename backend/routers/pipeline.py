"""Pipeline kanban router."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from db.session import get_db
from db import pipeline as pip_db
from dependencies import get_current_user
from schemas.pipeline import StageUpdate, PipelineItemOut

router = APIRouter(prefix="/pipeline", tags=["pipeline"], dependencies=[Depends(get_current_user)])


@router.get("/")
async def get_pipeline(db: AsyncSession = Depends(get_db)):
    return await pip_db.get_pipeline(db)


@router.patch("/{item_id}/stage", response_model=PipelineItemOut)
async def update_stage(item_id: str, body: StageUpdate, db: AsyncSession = Depends(get_db)):
    item = await pip_db.update_stage(db, item_id, body.stage.value)
    if not item:
        raise HTTPException(404, "Pipeline item not found")
    await db.commit()
    return item


@router.get("/funnel")
async def funnel_counts(db: AsyncSession = Depends(get_db)):
    return await pip_db.get_funnel_counts(db)
