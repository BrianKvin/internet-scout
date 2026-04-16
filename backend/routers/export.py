"""Export router — download collection data as CSV or JSON."""

import csv
import io
import json

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from db.session import get_db
from db.collections import get_collection_items
from dependencies import get_current_user

router = APIRouter(prefix="/export", tags=["export"], dependencies=[Depends(get_current_user)])


@router.get("/{collection_id}/csv")
async def export_csv(collection_id: str, db: AsyncSession = Depends(get_db)):
    result = await get_collection_items(db, collection_id, page=1, page_size=10_000)
    items = result.get("items", [])
    if not items:
        raise HTTPException(404, "Collection empty or not found")

    fieldnames = list(items[0]["data"].keys()) if items[0].get("data") else []
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=fieldnames, extrasaction="ignore")
    writer.writeheader()
    for item in items:
        writer.writerow(item.get("data", {}))

    output.seek(0)
    return StreamingResponse(
        output,
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename={collection_id}.csv"
        },
    )


@router.get("/{collection_id}/json")
async def export_json(collection_id: str, db: AsyncSession = Depends(get_db)):
    result = await get_collection_items(db, collection_id, page=1, page_size=10_000)
    items = result.get("items", [])
    if not items:
        raise HTTPException(404, "Collection empty or not found")

    data = [i.get("data", {}) for i in items]
    body = json.dumps(data, indent=2).encode()

    return StreamingResponse(
        io.BytesIO(body),
        media_type="application/json",
        headers={
            "Content-Disposition": f"attachment; filename={collection_id}.json"
        },
    )
