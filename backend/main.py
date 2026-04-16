"""FastAPI application entrypoint for Internet Scout."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text

from cache.redis_client import close_redis
from scrapers.browser_pool import close_browser
from config import settings
from db import auth as auth_db
from db.session import async_session_factory
from routers import activity, auth, collections, companies, export, jobs, notify, pipeline, scrape, signals, sources, stats, studio
from tasks.scheduler import start_scheduler, stop_scheduler
from utils.auth_security import hash_password
from utils.logger import configure_logging


async def _seed_default_superuser() -> None:
    """Create the seed user if SEED_USER_EMAIL and SEED_USER_PASSWORD are set."""
    email = settings.SEED_USER_EMAIL
    password = settings.SEED_USER_PASSWORD
    if not email or not password:
        return

    async with async_session_factory() as db:
        await auth_db.ensure_user(
            db,
            name=settings.SEED_USER_NAME,
            email=email,
            password_hash=hash_password(password),
        )
        await db.commit()


@asynccontextmanager
async def lifespan(app: FastAPI):
    configure_logging(settings.LOG_LEVEL)

    if settings.ENV == "production" and settings.AUTH_SECRET == "dev-only-change-me":
        raise RuntimeError("AUTH_SECRET must be set in production — refusing to start")

    await _seed_default_superuser()
    if settings.ENV != "test":
        start_scheduler()
    try:
        yield
    finally:
        stop_scheduler()
        await close_browser()
        await close_redis()


app = FastAPI(
    title="Internet Scout API",
    version="0.1.0",
    lifespan=lifespan,
)

localhost_origin_regex = r"https?://(localhost|127\.0\.0\.1)(:\d+)?$"

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_origin_regex=localhost_origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(sources.router)
app.include_router(jobs.router)
app.include_router(companies.router)
app.include_router(pipeline.router)
app.include_router(scrape.router)
app.include_router(activity.router)
app.include_router(stats.router)
app.include_router(studio.router)
app.include_router(collections.router)
app.include_router(export.router)
app.include_router(signals.router)
app.include_router(notify.router)


@app.get("/")
async def root():
    return {
        "name": "internet-scout-api",
        "status": "ok",
        "docs": "/docs",
    }


@app.get("/health")
async def health():
    """Deep health check — verifies database and Redis connectivity."""
    checks: dict[str, str] = {}

    # Check database
    try:
        async with async_session_factory() as db:
            await db.execute(text("SELECT 1"))
        checks["database"] = "ok"
    except Exception:
        checks["database"] = "failed"

    # Check Redis
    try:
        from cache.redis_client import get_redis
        r = get_redis()
        await r.ping()
        checks["redis"] = "ok"
    except Exception:
        checks["redis"] = "unavailable"

    healthy = checks["database"] == "ok"
    status = "healthy" if healthy else "degraded"
    status_code = 200 if healthy else 503

    return JSONResponse(
        {"status": status, **checks},
        status_code=status_code,
    )
