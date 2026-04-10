# CLAUDE.md

## Project overview

Internet-Scout (formerly Startscout) is an AI-powered web intelligence and scraping platform. Users describe what they want to scrape in plain English, and the system builds pipelines, runs them on a schedule, and delivers structured data to a dashboard. Full technical spec in `internet-scout.md`.

## Tech stack

- **Backend**: FastAPI + Python 3.11+ (async throughout)
- **Scraping**: httpx + BeautifulSoup (static), Playwright (JS-rendered SPAs)
- **Database**: PostgreSQL + SQLAlchemy (async) + pgvector + Alembic migrations
- **Cache**: Redis (1-hour TTL on scrape results)
- **Scheduler**: APScheduler (cron-style)
- **AI**: Anthropic Claude (claude-opus-4-5) for scrape config generation, scoring, categorization
- **Embeddings**: Voyage AI (voyage-3) + pgvector for semantic similarity
- **Frontend**: Next.js 15 (App Router) + TypeScript + SWR + dnd-kit
- **Notifications**: Resend (email digests) + Slack webhooks
- **Deploy**: Railway (backend + Postgres + Redis), Vercel (frontend)

## Project structure

```
backend/
  main.py                  # FastAPI entry point
  routers/                 # One router per domain (jobs, companies, pipeline, sources, studio, collections, export, scrape, enrich, signals, notify)
  scrapers/
    base.py, registry.py, executor.py
    strategies/            # YC, generic_jobs, generic_portfolio, playwright_portfolio, hn_hiring
  pipeline/
    executor.py
    steps/                 # enrich, deduplicate, export, notify, webhook
  enricher/                # careers_finder, email_finder, contact_finder, deduplicator
  signals/                 # news_monitor.py (RSS-based)
  notifications/           # digest.py (Resend), slack.py
  models/                  # SQLAlchemy ORM models
  db/                      # Data access layer
  cache/                   # Redis client
  tasks/                   # APScheduler setup
  utils/                   # rate_limiter, source_health, logger
  alembic/                 # Database migrations

frontend/
  app/                     # Next.js App Router (layout.tsx, page.tsx, globals.css)
  components/
    tabs/                  # JobFeed, Companies, Pipeline, Sources, Studio, Collections, Stats
    studio/                # Scrape Studio UI
    collections/           # Collection browser & export
  hooks/                   # useJobs, useCompanies, usePipeline, useCollections, etc.
  lib/api.ts               # Centralized HTTP client
  types/                   # TypeScript interfaces for all models
```

## Commands

### Backend
```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
playwright install chromium
alembic upgrade head                    # run migrations
uvicorn main:app --reload --port 8000   # dev server
```

### Frontend
```bash
cd frontend
npm install
npm run dev       # dev server on :3000
npm run build     # production build
npm run lint      # ESLint
```

## Code conventions

### Backend (Python)
- Full async/await stack (httpx, SQLAlchemy async, Playwright async)
- FastAPI dependency injection with `Depends(get_db)` for database sessions
- Strategy pattern for scrapers: each source type has a strategy class registered in `scrapers/registry.py`
- Pipeline steps are ordered and pluggable via `pipeline/steps/`
- Snake_case for all Python code and database columns
- Pydantic models for request/response validation
- structlog for structured logging
- Rate limiting built into base scraper with polite delays
- Source health monitoring: auto-flag broken scrapers when markup changes

### Frontend (TypeScript)
- Next.js 15 App Router
- Custom SWR hooks per domain (60s polling interval)
- Tab-based dashboard navigation
- dnd-kit for pipeline kanban drag-and-drop
- camelCase for TypeScript/JSON (snake_case from API gets mapped)
- Centralized API client in `lib/api.ts`

### API
- RESTful JSON endpoints
- CORS enabled for localhost:3000 and *.vercel.app

## Environment variables

### Backend (`backend/.env`)
- `DATABASE_URL` (required) - PostgreSQL async connection string
- `ANTHROPIC_API_KEY` - for AI features (Scrape Studio, scoring, categorization)
- `VOYAGE_API_KEY` - for CV/job vector embeddings
- `HUNTER_API_KEY` - for email enrichment
- `RESEND_API_KEY` - for email digest notifications
- `NOTIFY_EMAIL` - recipient for digest emails
- `CRUNCHBASE_API_KEY` - for funding signal detection
- `SLACK_WEBHOOK_URL` - for Slack alerts
- `REDIS_URL` - defaults to redis://localhost:6379

### Frontend (`frontend/.env.local`)
- `NEXT_PUBLIC_API_URL` - backend URL (http://localhost:8000 for dev)

## Key design decisions

- Sources are database-driven (not hardcoded) - users add/toggle sources from the dashboard
- Collections are schema-free (JSONB) so any scrape target works without migrations
- AI features are optional - core scraping works without API keys
- Playwright is a fallback for JS-rendered sites, not the default (httpx+BS4 is faster/cheaper)
- Redis caches scrape results with 1-hour TTL to avoid hammering targets
- Pipeline steps are composable: enrich -> deduplicate -> export -> notify -> webhook
