"""Collection and CollectionItem models."""

import uuid
from datetime import datetime
from sqlalchemy import String, Text, DateTime, Boolean, Integer, JSON, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from db.session import Base


class Collection(Base):
    __tablename__ = "collections"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: f"col_{uuid.uuid4().hex[:8]}")
    name: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    category: Mapped[str | None] = mapped_column(String, nullable=True)    # 'jobs' | 'finance' | 'government' | 'custom' | ...
    item_count: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class CollectionItem(Base):
    __tablename__ = "collection_items"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: f"ci_{uuid.uuid4().hex[:8]}")
    collection_id: Mapped[str] = mapped_column(String, ForeignKey("collections.id"), nullable=False)
    scrape_job_id: Mapped[str | None] = mapped_column(String, ForeignKey("scrape_jobs.id"), nullable=True)
    data: Mapped[dict] = mapped_column(JSON, nullable=False)
    dedup_key: Mapped[str | None] = mapped_column(String, nullable=True, unique=True)
    is_new: Mapped[bool] = mapped_column(Boolean, default=True)
    scraped_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
