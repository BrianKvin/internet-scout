"""Source request/response schemas."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict

from schemas.enums import SourceHealth, SourceStrategy, SourceType


class SourceCreate(BaseModel):
    name: str
    url: str
    type: SourceType = SourceType.CUSTOM
    strategy: SourceStrategy = SourceStrategy.GENERIC_LIST
    notes: str | None = None


class SourceOut(BaseModel):
    id: str
    name: str
    url: str
    type: str
    strategy: str
    enabled: bool
    last_scraped: datetime | None
    job_count: int
    health: str
    notes: str | None

    model_config = ConfigDict(from_attributes=True)
