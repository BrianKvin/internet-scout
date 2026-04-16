"""Playwright-based portfolio scraper for JS-rendered SPAs.

Used for a16z, Lightspeed, Accel, GV etc. that return empty HTML
without a real browser. Uses the shared browser pool with stealth
and resource blocking.
"""

from urllib.parse import urlparse

from parsel import Selector
from scrapers.browser_pool import render_page
from schemas.scraped import validate_companies
import structlog

log = structlog.get_logger(__name__)

PORTFOLIO_SELECTORS = [
    ".company",
    ".portfolio-company",
    "[class*='company']",
    "article",
    "li[class*='portfolio']",
    "[class*='card']",
]

NAME_SELECTORS = ["h2", "h3", "h4", ".name", "[class*='name']"]


async def scrape_playwright_portfolio(url: str, source_id: str) -> list[dict]:
    """Use Playwright to render JS SPA and extract companies."""
    content = await render_page(url)
    if not content:
        return []

    sel = Selector(text=content)
    companies: list[dict] = []

    for selector in PORTFOLIO_SELECTORS:
        found = sel.css(selector)
        if len(found) > 3:
            for el in found:
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

    log.info("playwright_portfolio_scraped", count=len(companies), url=url)
    return validate_companies(companies)
