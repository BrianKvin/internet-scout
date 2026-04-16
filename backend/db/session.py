"""Async SQLAlchemy session factory."""

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from config import settings

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.ENV == "development",
    pool_size=10,
    max_overflow=20,
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

async_session_factory = AsyncSessionLocal


class Base(DeclarativeBase):
    pass


async def get_db():
    """FastAPI dependency that yields a database session.

    Routers own their commit boundaries — call ``await db.commit()``
    explicitly after mutations.  The session auto-rolls-back on
    unhandled exceptions and is always closed in ``finally``.
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
