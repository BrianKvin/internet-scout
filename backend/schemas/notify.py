"""Notification settings schemas."""

from pydantic import BaseModel


class NotificationSettings(BaseModel):
    digestEnabled: bool = False
    digestEmail: str = ""
    digestTime: str = "08:00"
    slackWebhookUrl: str | None = None
    slackEnabled: bool = False


class NotificationSettingsUpdate(BaseModel):
    digestEnabled: bool | None = None
    digestEmail: str | None = None
    digestTime: str | None = None
    slackWebhookUrl: str | None = None
    slackEnabled: bool | None = None
