"""Notifications router — trigger digest and manage notification settings."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from db.session import get_db
from dependencies import get_current_user
from notifications.digest import send_daily_digest
from notifications.slack import send_slack
from schemas.notify import NotificationSettings, NotificationSettingsUpdate

router = APIRouter(prefix="/notify", tags=["notify"], dependencies=[Depends(get_current_user)])

_settings = NotificationSettings()


@router.get("/settings", response_model=NotificationSettings)
async def get_settings():
    return _settings


@router.patch("/settings", response_model=NotificationSettings)
async def update_settings(body: NotificationSettingsUpdate):
    global _settings
    current = _settings.model_dump()
    updates = body.model_dump(exclude_unset=True)
    _settings = NotificationSettings(**{**current, **updates})
    return _settings


@router.post("/digest")
async def trigger_digest(db: AsyncSession = Depends(get_db)):
    """Manually trigger the daily digest."""
    await send_daily_digest(db)
    return {"sent": True}


@router.post("/test-slack")
async def test_slack():
    """Send a test Slack message."""
    sent = await send_slack(":wave: Internet Scout — Slack integration test")
    return {"sent": sent}
