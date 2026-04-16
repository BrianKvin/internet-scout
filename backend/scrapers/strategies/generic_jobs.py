"""Generic job board scraper strategy.

Cascade of common CSS selectors that covers ~80% of job boards.
Uses Parsel for CSS + XPath extraction.
"""

from urllib.parse import urlparse

from parsel import Selector
from scrapers.base import get_client, safe_get
from schemas.scraped import validate_jobs
import structlog

log = structlog.get_logger(__name__)

JOB_SELECTORS = [
    "a[href*='/jobs/']",
    "a[href*='/careers/']",
    "a[href*='/job/']",
    "a[href*='/position/']",
    ".job-title a",
    ".position a",
    "h2 a",
    "h3 a",
    "li[class*='job'] a",
    "li[class*='position'] a",
]


async def scrape_generic_jobs(url: str, source_id: str) -> list[dict]:
    """Heuristic cascade for generic job boards. Returns validated job dicts."""
    async with get_client() as client:
        try:
            resp = await safe_get(client, url)
        except Exception as e:
            log.error("generic_jobs_failed", url=url, error=str(e))
            return []

    sel = Selector(text=resp.text)
    company = _infer_company(url, sel)
    jobs: list[dict] = []

    for selector in JOB_SELECTORS:
        found = sel.css(selector)
        if len(found) > 3:
            for el in found:
                title = el.css("::text").get("").strip()
                href = el.attrib.get("href", "")
                if not title or not href:
                    continue
                apply_url = href if href.startswith("http") else url.rstrip("/") + "/" + href.lstrip("/")
                jobs.append({
                    "title": title,
                    "company": company,
                    "apply_url": apply_url,
                    "source_id": source_id,
                })
            break

    log.info("generic_jobs_scraped", count=len(jobs), url=url)
    return validate_jobs(jobs)


def _infer_company(url: str, sel: Selector) -> str:
    """Try to extract company name from page metadata or title."""
    og = sel.css('meta[property="og:site_name"]::attr(content)').get()
    if og:
        return og.strip()
    title = sel.css("title::text").get()
    if title:
        return title.split("|")[0].split("-")[0].strip()
    return urlparse(url).netloc.replace("www.", "")
