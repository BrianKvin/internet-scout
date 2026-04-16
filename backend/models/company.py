"""Company model."""

import uuid
from datetime import datetime
from sqlalchemy import String, Boolean, Text, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from db.session import Base


class Company(Base):
    __tablename__ = "companies"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: f"co_{uuid.uuid4().hex[:8]}")
    name: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    domain: Mapped[str | None] = mapped_column(String, nullable=True)
    website: Mapped[str | None] = mapped_column(Text, nullable=True)
    careers_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    source_id: Mapped[str | None] = mapped_column(String, ForeignKey("sources.id"), nullable=True)
    sector: Mapped[str | None] = mapped_column(String, nullable=True)
    stage: Mapped[str | None] = mapped_column(String, nullable=True)       # 'Seed' | 'Series A' | 'Series B' | ...
    headcount: Mapped[str | None] = mapped_column(String, nullable=True)   # '1-10' | '11-50' | '51-200' | ...
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    enriched: Mapped[bool] = mapped_column(Boolean, default=False)
    enriched_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
