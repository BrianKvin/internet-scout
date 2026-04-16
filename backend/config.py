"""Application settings loaded from environment variables."""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://user:password@localhost:5432/internet_scout"
    REDIS_URL: str = "redis://localhost:6379"
    CORS_ORIGINS: str = "http://localhost:3000"
    LOG_LEVEL: str = "info"
    ENV: str = "development"
    AUTH_SECRET: str = "dev-only-change-me"

    # Seed superuser (dev only — leave unset in production)
    SEED_USER_EMAIL: str | None = None
    SEED_USER_PASSWORD: str | None = None
    SEED_USER_NAME: str = "Admin"

    # Notifications (optional)
    RESEND_API_KEY: str | None = None
    NOTIFY_EMAIL: str | None = None
    SLACK_WEBHOOK_URL: str | None = None

    # Future paid additions
    ANTHROPIC_API_KEY: str | None = None
    VOYAGE_API_KEY: str | None = None
    HUNTER_API_KEY: str | None = None
    CRUNCHBASE_API_KEY: str | None = None

    @property
    def cors_origins_list(self) -> list[str]:
        origins = [o.strip().rstrip("/") for o in self.CORS_ORIGINS.split(",") if o.strip()]
        return origins or ["http://localhost:3000"]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"


settings = Settings()
