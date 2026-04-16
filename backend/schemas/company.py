"""Company response schemas."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict


class CompanyOut(BaseModel):
    id: str
    name: str
    domain: str | None
    website: str | None
    careers_url: str | None
    source_id: str | None
    sector: str | None
    stage: str | None
    headcount: str | None
    description: str | None
    enriched: bool
    enriched_at: datetime | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
