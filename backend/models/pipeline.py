"""Pipeline item model — job application tracking."""

import uuid
from datetime import datetime
from sqlalchemy import String, Text, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from db.session import Base


class PipelineItem(Base):
    __tablename__ = "pipeline_items"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: f"pip_{uuid.uuid4().hex[:8]}")
    job_id: Mapped[str] = mapped_column(String, ForeignKey("jobs.id"), nullable=False)
    stage: Mapped[str] = mapped_column(String, nullable=False, default="discovered")
    # 'discovered' | 'researched' | 'applied' | 'interviewing' | 'offer' | 'rejected'
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    applied_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
