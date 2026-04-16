"""YC (workatastartup.com) scraper strategy.

Scrapes job listings from Y Combinator's Work at a Startup board.
The site is a JS-rendered React SPA — requires Playwright to render.
"""

from parsel import Selector
from scrapers.browser_pool import render_page
from schemas.scraped import validate_jobs
import structlog

log = structlog.get_logger(__name__)

YC_BASE = "https://workatastartup.com"

# Multiple selector variants — YC changes markup frequently
JOB_CARD_SELECTORS = [
    "[class*='job-listing']",
    "[class*='JobListing']",
    "[class*='company-job']",
    "div[class*='job'] a",
    "a[href*='/companies/']",
    "[class*='CompanyCard']",
    "[class*='company-card']",
    "div[class*='company']",
]


async def scrape_yc(url: str, source_id: str) -> list[dict]:
    """Scrape YC job listings via Playwright. Returns validated job dicts."""
    content = await render_page(url)
    if not content:
        log.error("yc_empty_page", url=url)
        return []

    sel = Selector(text=content)
    jobs: list[dict] = []

    for selector in JOB_CARD_SELECTORS:
        cards = sel.css(selector)
        if len(cards) < 3:
            continue

        for card in cards:
            # Try multiple title extraction patterns
            title = (
                card.xpath(".//h4/text() | .//h3/text() | .//a/text()").get("").strip()
                or card.css("[class*='title']::text, [class*='role']::text").get("").strip()
            )
            company = (
                card.css("[class*='company']::text, [class*='Company']::text").get("").strip()
                or card.xpath("./ancestor::div[contains(@class,'company')]//h2/text() | ./ancestor::div[contains(@class,'company')]//h3/text()").get("").strip()
            )
            apply_url = card.css("a::attr(href)").get()
            location = card.css("[class*='location']::text, [class*='Location']::text").get("").strip() or None

            if not title and not company:
                continue
            if not title:
                title = "Role at " + company
            if not company:
                company = "YC Company"

            if apply_url and not apply_url.startswith("http"):
                apply_url = YC_BASE + apply_url

            jobs.append({
                "title": title,
                "company": company,
                "apply_url": apply_url or url,
                "location": location,
                "source_id": source_id,
            })
        if jobs:
            break

    # If no structured cards found, try extracting from page text
    if not jobs:
        all_links = sel.css("a[href*='/companies/']")
        for link in all_links[:50]:
            text = link.css("::text").get("").strip()
            href = link.attrib.get("href", "")
            if text and len(text) > 2 and href:
                full_url = href if href.startswith("http") else YC_BASE + href
                jobs.append({
                    "title": text,
                    "company": text,
                    "apply_url": full_url,
                    "source_id": source_id,
                })

    log.info("yc_scraped", count=len(jobs), url=url)
    return validate_jobs(jobs)
