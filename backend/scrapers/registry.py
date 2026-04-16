"""Scraper strategy registry.

Maps source.strategy → scraper function.
"""

from models.source import Source
from scrapers.strategies.yc import scrape_yc
from scrapers.strategies.generic_jobs import scrape_generic_jobs
from scrapers.strategies.generic_portfolio import scrape_generic_portfolio
from scrapers.strategies.playwright_portfolio import scrape_playwright_portfolio
from scrapers.strategies.hn_hiring import scrape_hn_hiring
import structlog

log = structlog.get_logger(__name__)

# Maps the source.strategy field → async scraper function
# Each function signature: (url: str, source_id: str) -> list[dict]
STRATEGY_MAP: dict = {
    "yc": scrape_yc,
    "generic_jobs": scrape_generic_jobs,
    "generic_portfolio": scrape_generic_portfolio,
    "playwright_portfolio": scrape_playwright_portfolio,
    "hn_hiring": scrape_hn_hiring,
}


async def run_scraper(source: Source) -> list[dict]:
    """Dispatch to the correct scraper based on source.strategy.

    Returns a list of raw dicts (jobs or companies depending on strategy).
    """
    strategy_fn = STRATEGY_MAP.get(source.strategy)
    if strategy_fn is None:
        log.warning(
            "unknown_strategy",
            source_id=source.id,
            strategy=source.strategy,
        )
        return []

    log.info(
        "running_scraper",
        source_id=source.id,
        strategy=source.strategy,
        url=source.url,
    )
    try:
        results = await strategy_fn(source.url, source.id)
        log.info(
            "scraper_complete",
            source_id=source.id,
            strategy=source.strategy,
            count=len(results),
        )
        return results
    except Exception as exc:
        log.error(
            "scraper_failed",
            source_id=source.id,
            strategy=source.strategy,
            error=str(exc),
        )
        return []
