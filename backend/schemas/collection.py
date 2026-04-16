"""Collection request/response schemas."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict


class CollectionCreate(BaseModel):
    name: str
    description: str | None = None
    category: str | None = None


class CollectionOut(BaseModel):
    id: str
    name: str
    description: str | None
    category: str | None
    item_count: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CollectionItemOut(BaseModel):
    id: str
    collection_id: str
    scrape_job_id: str | None
    data: dict
    is_new: bool
    scraped_at: datetime

    model_config = ConfigDict(from_attributes=True)
