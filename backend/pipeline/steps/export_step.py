"""Export pipeline step.

Writes jobs/items to a JSON or CSV file on disk.
"""

from __future__ import annotations

import csv
import json
import os
from datetime import datetime, timezone
from pathlib import Path

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from models.job import Job
import structlog

log = structlog.get_logger(__name__)

EXPORT_DIR = Path(os.getenv("EXPORT_DIR", "/tmp/internet-scout-exports"))


async def run(db: AsyncSession, config: dict, **kwargs) -> dict:
    """Export recent jobs to JSON or CSV.

    Config keys:
        format      (str)  – "json" | "csv"  (default "json")
        limit       (int)  – max records (default 1000)
        output_path (str)  – override default export dir

    Returns: {"path": str, "count": int}
    """
    fmt: str = config.get("format", "json")
    limit: int = config.get("limit", 1000)
    output_dir = Path(config.get("output_path", str(EXPORT_DIR)))
    output_dir.mkdir(parents=True, exist_ok=True)

    result = await db.execute(
        select(Job).order_by(Job.scraped_at.desc()).limit(limit)
    )
    jobs = result.scalars().all()
    rows = [
        {
            "id": j.id,
            "title": j.title,
            "company": j.company,
            "location": j.location,
            "salary": j.salary,
            "apply_url": j.apply_url,
            "is_remote": j.is_remote,
            "sector": j.sector,
            "tags": j.tags,
            "scraped_at": j.scraped_at.isoformat() if j.scraped_at else None,
        }
        for j in jobs
    ]

    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    if fmt == "csv":
        path = output_dir / f"jobs_{timestamp}.csv"
        with open(path, "w", newline="") as f:
            writer = csv.DictWriter(f, fieldnames=rows[0].keys() if rows else [])
            writer.writeheader()
            writer.writerows(rows)
    else:
        path = output_dir / f"jobs_{timestamp}.json"
        with open(path, "w") as f:
            json.dump(rows, f, indent=2)

    log.info("export_step_done", path=str(path), count=len(rows))
    return {"path": str(path), "count": len(rows)}
