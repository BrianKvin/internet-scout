"""Job response schemas."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict


class JobOut(BaseModel):
    id: str
    title: str
    company: str
    company_id: str | None
    source_id: str | None
    location: str | None
    salary: str | None
    description: str | None
    apply_url: str | None
    sector: str | None
    stage: str | None
    tags: str | None
    is_new: bool
    is_remote: bool
    saved_at: datetime | None
    scraped_at: datetime

    model_config = ConfigDict(from_attributes=True)


class JobCountOut(BaseModel):
    count: int
