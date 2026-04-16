"""Generic VC portfolio scraper strategy (static HTML).

Cascade of portfolio-card selectors that works on most VC sites.
Uses Parsel for CSS + XPath extraction.
"""

from urllib.parse import urlparse

from parsel import Selector
from scrapers.base import get_client, safe_get
from schemas.scraped import validate_companies
import structlog

log = structlog.get_logger(__name__)

PORTFOLIO_SELECTORS = [
    ".company",
    ".portfolio-company",
    ".company-card",
    "[class*='portfolio']",
    "[class*='company-item']",
    "article",
    "li[class*='company']",
]

NAME_SELECTORS = ["h2", "h3", "h4", ".name", "[class*='name']", "strong"]


async def scrape_generic_portfolio(url: str, source_id: str) -> list[dict]:
    """Heuristic cascade for static VC portfolio pages. Returns validated company dicts."""
    async with get_client() as client:
        try:
            resp = await safe_get(client, url)
        except Exception as e:
            log.error("generic_portfolio_failed", url=url, error=str(e))
            return []

    sel = Selector(text=resp.text)
    companies: list[dict] = []

    for selector in PORTFOLIO_SELECTORS:
        found = sel.css(selector)
        if len(found) > 3:
            for el in found:
                # Try each name selector via XPath union for conciseness
                name = el.xpath(".//h2/text() | .//h3/text() | .//h4/text() | .//*[contains(@class,'name')]/text()").get("").strip()
                if not name or len(name) < 2:
                    continue

                website = el.css("a::attr(href)").get()
                domain = None
                if website and website.startswith("http"):
                    domain = urlparse(website).netloc.replace("www.", "")

                description = el.css("p::text, [class*='desc']::text, [class*='tagline']::text").get("").strip() or None

                companies.append({
                    "name": name,
                    "website": website,
                    "domain": domain,
                    "description": description,
                    "source_id": source_id,
                })
            break

    log.info("generic_portfolio_scraped", count=len(companies), url=url)
    return validate_companies(companies)
