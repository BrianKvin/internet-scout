"""CRUD helpers for authentication users."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.user import User


async def get_user_by_email(db: AsyncSession, email: str) -> User | None:
    result = await db.execute(select(User).where(User.email == email.lower().strip()))
    return result.scalar_one_or_none()


async def get_user_by_id(db: AsyncSession, user_id: str) -> User | None:
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()


async def create_user(db: AsyncSession, *, name: str, email: str, password_hash: str) -> User:
    user = User(name=name.strip(), email=email.lower().strip(), password_hash=password_hash)
    db.add(user)
    await db.flush()
    await db.refresh(user)
    return user


async def ensure_user(
    db: AsyncSession,
    *,
    name: str,
    email: str,
    password_hash: str,
) -> User:
    existing = await get_user_by_email(db, email)
    if existing:
        return existing
    return await create_user(db, name=name, email=email, password_hash=password_hash)
