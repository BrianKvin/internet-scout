"""Dashboard and performance stats schemas."""

from pydantic import BaseModel


class DashboardStats(BaseModel):
    items_collected: int
    active_sources: int
    collections: int
    scrape_runs: int


class SourcePerformanceOut(BaseModel):
    source_id: str
    source_name: str
    items_per_run: list[int]
    last_run_items: int
    health_history: list[str]
