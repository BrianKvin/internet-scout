"""Pipeline request/response schemas."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict

from schemas.enums import PipelineStage


class StageUpdate(BaseModel):
    stage: PipelineStage


class PipelineItemOut(BaseModel):
    id: str
    job_id: str
    stage: str
    notes: str | None
    applied_at: datetime | None
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
