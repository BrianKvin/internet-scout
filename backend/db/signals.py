"""CRUD operations for Signals."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from models.signal import Signal


async def get_signals(db: AsyncSession, company_id: str | None = None) -> list[Signal]:
    q = select(Signal).order_by(Signal.detected_at.desc())
    if company_id:
        q = q.where(Signal.company_id == company_id)
    result = await db.execute(q)
    return result.scalars().all()


async def insert_signal(db: AsyncSession, company_id: str, data: dict) -> Signal:
    signal = Signal(
        company_id=company_id,
        type=data.get("type", "news"),
        title=data.get("title"),
        detail=data.get("detail"),
        amount=data.get("amount"),
        source_url=data.get("source_url"),
    )
    db.add(signal)
    await db.flush()
    return signal
