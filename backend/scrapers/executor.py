"""Config-driven scraper executor.

Runs list_selector + fields extraction against any URL with optional pagination.
Used by the Studio / ScrapeJob flow. Uses Parsel for extraction.
"""

from typing import Any
from urllib.parse import urljoin

from parsel import Selector
from scrapers.base import get_client, safe_get
import structlog

log = structlog.get_logger(__name__)

MAX_PAGES = 20


async def execute_scrape(
    url: str,
    config: dict[str, Any],
    source_id: str | None = None,
) -> list[dict]:
    """Run a config-driven scrape against `url`.

    Config keys:
        list_selector  (str)  -- CSS selector that selects each item row/card
        fields         (dict) -- mapping of output_key -> {"selector": ..., "attr": ...}
        next_selector  (str, optional) -- CSS selector for the "next page" link
        max_pages      (int, optional) -- override MAX_PAGES
    """
    list_sel: str = config.get("list_selector", "")
    fields: dict = config.get("fields", {})
    next_sel: str | None = config.get("next_selector")
    max_pages: int = config.get("max_pages", MAX_PAGES)

    if not list_sel or not fields:
        log.warning("executor_missing_config", url=url)
        return []

    results: list[dict] = []
    current_url: str | None = url
    pages_fetched = 0

    async with get_client() as client:
        while current_url and pages_fetched < max_pages:
            try:
                resp = await safe_get(client, current_url)
            except Exception as exc:
                log.error("executor_fetch_failed", url=current_url, error=str(exc))
                break

            sel = Selector(text=resp.text)
            items = sel.css(list_sel)

            for item in items:
                row: dict[str, Any] = {}
                if source_id:
                    row["source_id"] = source_id

                for key, field_config in fields.items():
                    field_sel: str = field_config.get("selector", "")
                    attr: str | None = field_config.get("attr")
                    if not field_sel:
                        row[key] = None
                        continue

                    if attr:
                        val = item.css(f"{field_sel}::attr({attr})").get()
                        if val and attr == "href" and val.startswith("/"):
                            val = urljoin(current_url, val)
                        row[key] = val
                    else:
                        row[key] = item.css(f"{field_sel}::text").get("").strip() or None

                results.append(row)

            pages_fetched += 1
            log.debug("executor_page", url=current_url, items=len(items), page=pages_fetched)

            if next_sel:
                next_href = sel.css(f"{next_sel}::attr(href)").get()
                if next_href:
                    current_url = urljoin(current_url, next_href)
                else:
                    break
            else:
                break

    log.info("executor_done", url=url, pages=pages_fetched, total=len(results))
    return results
