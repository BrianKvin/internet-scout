"""Source health scoring using z-score anomaly detection.

From IMPROVEMENTS.md §14b:
  - Pull last N scrape run item counts for a source
  - Compute z-score of the latest run
  - Mark source as 'warning' (|z| > 2) or 'dead' (|z| > 3 or 3 consecutive fails)
  - Trigger Slack alert on transitions
"""

from __future__ import annotations

import numpy as np
from sqlalchemy.ext.asyncio import AsyncSession

from db.scrape_jobs import get_recent_run_counts
from db.sources import update_health
import structlog

log = structlog.get_logger(__name__)

# Number of past runs to use for baseline
BASELINE_N = 10

# Z-score thresholds
WARNING_Z = 2.0
DEAD_Z = 3.0

# Consecutive failure threshold → dead
CONSECUTIVE_FAIL_THRESHOLD = 3


async def compute_health(
    db: AsyncSession,
    source_id: str,
    latest_count: int,
    consecutive_fails: int = 0,
) -> str:
    """Compute and persist health status for a source.

    Args:
        db:               Async DB session.
        source_id:        ID of the source.
        latest_count:     Item count from the most recent scrape run.
        consecutive_fails: Number of consecutive failed runs (no items found).

    Returns:
        Health string: "ok" | "warning" | "dead"
    """
    # Dead if too many consecutive failures
    if consecutive_fails >= CONSECUTIVE_FAIL_THRESHOLD:
        health = "dead"
        log.warning("source_health_dead", source_id=source_id, consecutive_fails=consecutive_fails)
        await update_health(db, source_id, health)
        return health

    # Z-score check against recent baseline
    history = await get_recent_run_counts(db, source_id, n=BASELINE_N)
    if len(history) < 3:
        # Not enough history — assume ok
        health = "ok"
        await update_health(db, source_id, health)
        return health

    arr = np.array(history, dtype=float)
    mean = arr.mean()
    std = arr.std()

    if std == 0:
        health = "ok"
        await update_health(db, source_id, health)
        return health

    z = abs((latest_count - mean) / std)
    log.info("source_health_zscore", source_id=source_id, z=round(float(z), 3), mean=round(float(mean), 1))

    if z >= DEAD_Z:
        health = "dead"
    elif z >= WARNING_Z:
        health = "warning"
    else:
        health = "ok"

    await update_health(db, source_id, health)

    if health != "ok":
        log.warning(
            "source_health_degraded",
            source_id=source_id,
            health=health,
            z_score=round(float(z), 3),
            mean=round(float(mean), 1),
            latest=latest_count,
        )
        # Slack alert deferred to notifications layer to avoid circular imports

    return health
