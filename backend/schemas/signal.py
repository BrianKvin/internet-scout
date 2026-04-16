"""Signal response schemas."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict


class SignalOut(BaseModel):
    id: str
    company_id: str | None
    type: str
    title: str | None
    detail: str | None
    amount: str | None
    source_url: str | None
    detected_at: datetime

    model_config = ConfigDict(from_attributes=True)
