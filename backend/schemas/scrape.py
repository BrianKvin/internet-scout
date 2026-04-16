"""Scrape trigger response schemas."""

from pydantic import BaseModel


class ScrapeResult(BaseModel):
    source_id: str
    found: int
    new: int
    dupes: int


class ScrapeError(BaseModel):
    source_id: str
    error: str


class ScrapeAllResponse(BaseModel):
    results: list[ScrapeResult | ScrapeError]
