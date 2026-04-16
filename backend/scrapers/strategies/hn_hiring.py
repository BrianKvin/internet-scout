"""Hacker News 'Who is Hiring?' scraper.

Parses the monthly HN thread for job postings.
Uses Parsel for HTML extraction.
"""

import re

from parsel import Selector
from scrapers.base import get_client, safe_get
from schemas.scraped import validate_jobs
import structlog

log = structlog.get_logger(__name__)

HN_SEARCH_URL = "https://hn.algolia.com/api/v1/search_by_date?query=who+is+hiring&tags=story,ask_hn&hitsPerPage=1"
HN_ITEM_URL = "https://news.ycombinator.com/item?id={}"


async def scrape_hn_hiring(url: str, source_id: str) -> list[dict]:
    """Find the latest 'Ask HN: Who is hiring?' thread and extract job posts."""
    async with get_client() as client:
        try:
            search_resp = await safe_get(client, HN_SEARCH_URL)
            data = search_resp.json()
            hits = data.get("hits", [])
            if not hits:
                log.warning("hn_no_hiring_thread_found")
                return []

            thread_id = hits[0]["objectID"]
            thread_url = HN_ITEM_URL.format(thread_id)
        except Exception as e:
            log.error("hn_search_failed", error=str(e))
            return []

        try:
            resp = await safe_get(client, thread_url)
        except Exception as e:
            log.error("hn_thread_fetch_failed", url=thread_url, error=str(e))
            return []

    sel = Selector(text=resp.text)
    jobs: list[dict] = []

    comment_els = sel.css(".comtr")
    for el in comment_els[:100]:
        indent = el.css("td.ind::attr(indent)").get("99")
        if indent != "0":
            continue

        text_el = el.css("span.commtext")
        if not text_el:
            continue

        text = text_el.css("::text").getall()
        text = " ".join(t.strip() for t in text if t.strip())
        if len(text) < 30:
            continue

        first_line = text[:200]
        parts = [p.strip() for p in re.split(r"\|", first_line)]

        company = parts[0] if parts else "Unknown"
        title = parts[1] if len(parts) > 1 else "Software Engineer"
        location = parts[2] if len(parts) > 2 else None
        is_remote = any(
            kw in text.lower()
            for kw in ["remote", "work from anywhere", "distributed"]
        )

        apply_url = text_el.css("a::attr(href)").get(thread_url)

        jobs.append({
            "title": title,
            "company": company,
            "apply_url": apply_url,
            "location": location,
            "description": text[:500],
            "is_remote": is_remote,
            "source_id": source_id,
        })

    log.info("hn_hiring_scraped", count=len(jobs), thread=thread_url)
    return validate_jobs(jobs)
