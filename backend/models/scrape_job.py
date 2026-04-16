"""ScrapeJob and PipelineStep models."""

import uuid
from datetime import datetime
from sqlalchemy import String, Text, DateTime, Boolean, Integer, JSON, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from db.session import Base


class ScrapeJob(Base):
    __tablename__ = "scrape_jobs"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: f"sj_{uuid.uuid4().hex[:8]}")
    name: Mapped[str] = mapped_column(String, nullable=False)
    source_id: Mapped[str | None] = mapped_column(String, ForeignKey("sources.id"), nullable=True)
    url: Mapped[str] = mapped_column(Text, nullable=False)
    instructions: Mapped[str] = mapped_column(Text, nullable=False)
    keywords: Mapped[list | None] = mapped_column(JSON, nullable=True)   # e.g. ["data science", "python", "ML"]
    config: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    collection_id: Mapped[str | None] = mapped_column(String, ForeignKey("collections.id"), nullable=True)
    schedule: Mapped[str] = mapped_column(String, default="manual")    # 'daily' | 'weekly' | 'manual'
    notify: Mapped[bool] = mapped_column(Boolean, default=False)
    last_run: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    last_count: Mapped[int] = mapped_column(Integer, default=0)
    health: Mapped[str] = mapped_column(String, default="ok")           # 'ok' | 'warning' | 'dead'
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class PipelineStep(Base):
    __tablename__ = "pipeline_steps"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: f"ps_{uuid.uuid4().hex[:8]}")
    scrape_job_id: Mapped[str] = mapped_column(String, ForeignKey("scrape_jobs.id"), nullable=False)
    order_index: Mapped[int] = mapped_column(Integer, nullable=False)
    type: Mapped[str] = mapped_column(String, nullable=False)          # 'enrich' | 'deduplicate' | 'export' | 'notify' | 'webhook'
    config: Mapped[dict] = mapped_column(JSON, nullable=True, default=dict)
    enabled: Mapped[bool] = mapped_column(Boolean, default=True)
