"""Enrich pipeline step.

Probes each company's website for a careers URL and marks them enriched.
"""

from sqlalchemy.ext.asyncio import AsyncSession
from db.companies import get_unenriched_companies, mark_enriched
from enricher.careers_finder import find_careers_url
import structlog

log = structlog.get_logger(__name__)


async def run(db: AsyncSession, config: dict, **kwargs) -> dict:
    """Find careers URLs for all un-enriched companies.

    Returns: {"enriched": int}
    """
    companies = await get_unenriched_companies(db, limit=config.get("batch_size", 50))
    enriched = 0
    for co in companies:
        if not co.website:
            continue
        careers_url = await find_careers_url(co.website)
        await mark_enriched(db, co.id, careers_url=careers_url)
        enriched += 1

    log.info("enrich_step_done", enriched=enriched)
    return {"enriched": enriched}
