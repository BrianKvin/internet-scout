"""CRUD operations for Collections and CollectionItems."""

import hashlib
import json
from datetime import datetime
from sqlalchemy import select, func, update
from sqlalchemy.ext.asyncio import AsyncSession
from models.collection import Collection, CollectionItem


def _make_item_dedup_key(data: dict) -> str:
    """Hash the data dict for deduplication, as per docs/internet-scout.md."""
    serialized = json.dumps(data, sort_keys=True)
    return hashlib.md5(serialized.encode()).hexdigest()


async def get_collections(db: AsyncSession) -> list[Collection]:
    result = await db.execute(select(Collection).order_by(Collection.updated_at.desc()))
    return result.scalars().all()


async def get_collection(db: AsyncSession, collection_id: str) -> Collection | None:
    result = await db.execute(select(Collection).where(Collection.id == collection_id))
    return result.scalar_one_or_none()


async def get_collection_by_name(db: AsyncSession, name: str) -> Collection | None:
    result = await db.execute(select(Collection).where(Collection.name == name))
    return result.scalar_one_or_none()


async def create_collection(db: AsyncSession, name: str, description: str | None = None, category: str | None = None) -> Collection:
    col = Collection(name=name, description=description, category=category)
    db.add(col)
    await db.flush()
    return col


async def get_or_create_collection(db: AsyncSession, name: str, category: str | None = None) -> Collection:
    existing = await get_collection_by_name(db, name)
    if existing:
        return existing
    return await create_collection(db, name, category=category)


async def get_collection_items(
    db: AsyncSession,
    collection_id: str,
    search: str | None = None,
    page: int = 1,
    page_size: int = 50,
) -> dict:
    q = select(CollectionItem).where(
        CollectionItem.collection_id == collection_id
    ).order_by(CollectionItem.scraped_at.desc())

    # Count before pagination
    count_q = select(func.count(CollectionItem.id)).where(
        CollectionItem.collection_id == collection_id
    )

    if search:
        # JSON text search — works across all field values
        q = q.where(CollectionItem.data.cast(type_=None).ilike(f"%{search}%"))
        count_q = count_q.where(CollectionItem.data.cast(type_=None).ilike(f"%{search}%"))

    total = (await db.execute(count_q)).scalar_one()
    offset = (page - 1) * page_size
    result = await db.execute(q.limit(page_size).offset(offset))
    items = result.scalars().all()

    return {"items": items, "total": total, "page": page, "page_size": page_size}


async def get_all_collection_items(db: AsyncSession, collection_id: str) -> list[CollectionItem]:
    result = await db.execute(
        select(CollectionItem)
        .where(CollectionItem.collection_id == collection_id)
        .order_by(CollectionItem.scraped_at.desc())
    )
    return result.scalars().all()


async def delete_item(db: AsyncSession, item_id: str) -> None:
    """Delete a collection item by ID."""
    result = await db.execute(select(CollectionItem).where(CollectionItem.id == item_id))
    item = result.scalar_one_or_none()
    if item:
        await db.delete(item)
        await db.flush()


async def insert_collection_items(
    db: AsyncSession,
    collection_id: str,
    scrape_job_id: str | None,
    items: list[dict],
) -> tuple[int, int]:
    """Insert items, skip duplicates. Returns (new_count, deduped_count)."""
    new_count = 0
    deduped_count = 0

    for data in items:
        dedup_key = _make_item_dedup_key(data)
        existing = await db.execute(
            select(CollectionItem).where(CollectionItem.dedup_key == dedup_key)
        )
        if existing.scalar_one_or_none():
            deduped_count += 1
            continue

        item = CollectionItem(
            collection_id=collection_id,
            scrape_job_id=scrape_job_id,
            data=data,
            dedup_key=dedup_key,
            is_new=True,
        )
        db.add(item)
        new_count += 1

    if new_count:
        await db.flush()
        # Update collection item_count and updated_at
        await db.execute(
            update(Collection)
            .where(Collection.id == collection_id)
            .values(
                item_count=Collection.item_count + new_count,
                updated_at=datetime.utcnow(),
            )
        )

    return new_count, deduped_count
