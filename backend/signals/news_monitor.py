"""News signal monitor.

Polls TechCrunch and HN RSS feeds for mentions of tracked companies.
From internet-scout.md — signals/news_monitor.py
"""

from __future__ import annotations

import asyncio
from datetime import datetime

import feedparser
from sqlalchemy.ext.asyncio import AsyncSession

from db.companies import get_companies
from db.signals import insert_signal
import structlog

log = structlog.get_logger(__name__)

FEEDS = [
    "https://techcrunch.com/feed/",
    "https://news.ycombinator.com/rss",
    "https://feeds.feedburner.com/venturebeat/SZYF",  # VentureBeat
]

# Keywords that suggest a funding signal
FUNDING_KEYWORDS = {"raises", "funding", "series a", "series b", "seed round", "million", "valuation"}


def _detect_type(title: str, summary: str) -> str:
    combined = (title + " " + summary).lower()
    if any(kw in combined for kw in FUNDING_KEYWORDS):
        return "funding_round"
    return "news"


async def _fetch_feed(url: str) -> list[dict]:
    """Fetch and parse an RSS feed (blocking call wrapped in executor)."""
    loop = asyncio.get_event_loop()
    parsed = await loop.run_in_executor(None, feedparser.parse, url)
    return parsed.entries


async def monitor_news(db: AsyncSession) -> int:
    """Scan RSS feeds and insert signals for companies we track.

    Returns number of signals inserted.
    """
    companies = await get_companies(db, limit=500)
    if not companies:
        return 0

    # Build lookup: normalised name → company id
    name_map: dict[str, str] = {}
    for co in companies:
        name_map[co.name.lower()] = co.id
        if co.domain:
            name_map[co.domain.lower().replace("www.", "")] = co.id

    inserted = 0
    for feed_url in FEEDS:
        try:
            entries = await _fetch_feed(feed_url)
        except Exception as exc:
            log.warning("feed_fetch_failed", url=feed_url, error=str(exc))
            continue

        for entry in entries:
            title: str = entry.get("title", "")
            summary: str = entry.get("summary", "")
            link: str = entry.get("link", "")

            # Check if any company name appears in the article
            for name, co_id in name_map.items():
                if name in (title + " " + summary).lower():
                    signal_type = _detect_type(title, summary)
                    await insert_signal(
                        db,
                        company_id=co_id,
                        data={
                            "type": signal_type,
                            "title": title[:255],
                            "detail": summary[:500],
                            "source_url": link,
                        },
                    )
                    inserted += 1
                    break  # one signal per article per feed

    log.info("news_monitor_done", signals_inserted=inserted)
    return inserted
