"""Source model — scraper source registry."""

import uuid
from datetime import datetime
from sqlalchemy import String, Boolean, Integer, Text, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from db.session import Base


class Source(Base):
    __tablename__ = "sources"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: f"src_{uuid.uuid4().hex[:8]}")
    name: Mapped[str] = mapped_column(String, nullable=False)
    url: Mapped[str] = mapped_column(Text, nullable=False)
    type: Mapped[str] = mapped_column(String, nullable=False)       # 'job_board' | 'vc_portfolio' | 'news' | 'directory' | 'government' | 'custom'
    strategy: Mapped[str] = mapped_column(String, nullable=False)   # key into STRATEGY_MAP
    enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    last_scraped: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    job_count: Mapped[int] = mapped_column(Integer, default=0)
    health: Mapped[str] = mapped_column(String, default="ok")       # 'ok' | 'warning' | 'dead'
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
