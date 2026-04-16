"""Validation schemas for scraped data.

Every scraper strategy validates its output through these before
passing to the deduplicator / DB layer. Invalid items are logged
and silently dropped.
"""

from pydantic import BaseModel, Field
import structlog

log = structlog.get_logger(__name__)


class ScrapedJob(BaseModel):
    title: str = Field(min_length=2)
    company: str = Field(min_length=1)
    apply_url: str | None = None
    location: str | None = None
    description: str | None = None
    salary: str | None = None
    sector: str | None = None
    stage: str | None = None
    is_remote: bool = False
    source_id: str | None = None


class ScrapedCompany(BaseModel):
    name: str = Field(min_length=2)
    website: str | None = None
    domain: str | None = None
    description: str | None = None
    source_id: str | None = None


def validate_jobs(raw_items: list[dict]) -> list[dict]:
    """Validate and filter scraped job dicts. Invalid items are dropped."""
    valid = []
    for item in raw_items:
        try:
            validated = ScrapedJob(**item)
            valid.append(validated.model_dump())
        except Exception:
            log.debug("invalid_scraped_job", raw=item)
    if len(valid) < len(raw_items):
        log.info("jobs_validated", valid=len(valid), dropped=len(raw_items) - len(valid))
    return valid


def validate_companies(raw_items: list[dict]) -> list[dict]:
    """Validate and filter scraped company dicts. Invalid items are dropped."""
    valid = []
    for item in raw_items:
        try:
            validated = ScrapedCompany(**item)
            valid.append(validated.model_dump())
        except Exception:
            log.debug("invalid_scraped_company", raw=item)
    if len(valid) < len(raw_items):
        log.info("companies_validated", valid=len(valid), dropped=len(raw_items) - len(valid))
    return valid
