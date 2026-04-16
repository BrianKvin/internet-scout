"""Collections router."""

from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from db.session import get_db
from db import collections as col_db
from dependencies import get_current_user
from schemas.collection import CollectionCreate, CollectionOut

router = APIRouter(prefix="/collections", tags=["collections"], dependencies=[Depends(get_current_user)])


@router.get("/", response_model=list[CollectionOut])
async def list_collections(db: AsyncSession = Depends(get_db)):
    return await col_db.get_collections(db)


@router.post("/", status_code=201, response_model=CollectionOut)
async def create_collection(body: CollectionCreate, db: AsyncSession = Depends(get_db)):
    col = await col_db.create_collection(db, body.name, body.description, body.category)
    await db.commit()
    return col


@router.get("/{collection_id}", response_model=CollectionOut)
async def get_collection(collection_id: str, db: AsyncSession = Depends(get_db)):
    col = await col_db.get_collection(db, collection_id)
    if not col:
        raise HTTPException(404, "Collection not found")
    return col


@router.get("/{collection_id}/items")
async def get_items(
    collection_id: str,
    search: str | None = Query(None),
    page: int = Query(1),
    limit: int = Query(50, le=200),
    db: AsyncSession = Depends(get_db),
):
    return await col_db.get_collection_items(
        db, collection_id, search=search, page=page, page_size=limit
    )


@router.delete("/{collection_id}/items/{item_id}", status_code=204)
async def delete_item(collection_id: str, item_id: str, db: AsyncSession = Depends(get_db)):
    await col_db.delete_item(db, item_id)
    await db.commit()
