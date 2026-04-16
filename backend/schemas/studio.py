"""Scrape Studio request/response schemas."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict

from schemas.enums import Schedule, SourceStrategy


class ScrapeJobCreate(BaseModel):
    name: str
    source_id: str | None = None
    url: str = ""
    instructions: str = ""
    keywords: list[str] = []
    collection_id: str | None = None
    collection_name: str | None = None
    schedule: Schedule = Schedule.MANUAL
    notify: bool = False
    strategy: SourceStrategy | None = None
    config: dict = {}


class ScrapeJobOut(BaseModel):
    id: str
    name: str
    source_id: str | None
    url: str
    instructions: str
    keywords: list[str] | None
    config: dict
    collection_id: str | None
    schedule: str
    notify: bool
    last_run: datetime | None
    last_count: int
    health: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PreviewResponse(BaseModel):
    items: list[dict]
    filtered: int = 0
    total: int = 0


class RunResponse(BaseModel):
    scraped: int
    items: list[dict]
    collection_id: str | None = None
    companies_added: int = 0
