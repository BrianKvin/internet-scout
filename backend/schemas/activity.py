"""Activity and scrape run schemas."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ScrapeRunOut(BaseModel):
    id: str
    source_id: str | None
    source_name: str | None = None
    scrape_job_id: str | None = None
    status: str
    items_found: int
    items_new: int
    items_deduped: int
    duration_ms: int
    error_message: str | None
    started_at: datetime
    finished_at: datetime | None

    model_config = ConfigDict(from_attributes=True)


class ActivityStats(BaseModel):
    total_runs: int
    success_rate: int
    items_collected_today: int
    active_source_count: int
