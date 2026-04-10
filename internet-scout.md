# Startscout

> General-purpose web scraping platform — add any source from the dashboard, run it on a schedule, and collect structured data into flexible collections. AI-powered features coming in a future release.

**GitHub:** `github.com/yourname/startscout`
**Deployment:** `startscout.vercel.app` (frontend) · `startscout-api.railway.app` (backend)

---

## Table of contents

1. [What it is](#what-it-is)
2. [Platform vision](#platform-vision)
3. [Why this approach wins](#why-this-approach-wins)
4. [Tech stack](#tech-stack)
5. [Architecture](#architecture)
6. [Full project structure](#full-project-structure)
7. [Database schema](#database-schema)
8. [Backend — FastAPI](#backend--fastapi)
9. [Dynamic source registry](#dynamic-source-registry)
10. [Scrape Studio — instruction-driven scraping](#scrape-studio--instruction-driven-scraping)
11. [Collections — universal data layer](#collections--universal-data-layer)
12. [Pipeline builder](#pipeline-builder)
13. [Scrapers](#scrapers)
14. [Enrichment layer](#enrichment-layer)
15. [AI layer](#ai-layer)
16. [Signal detection](#signal-detection)
17. [Notification system](#notification-system)
18. [Export layer](#export-layer)
19. [Cron scheduler](#cron-scheduler)
20. [Frontend — Next.js](#frontend--nextjs)
21. [Environment variables](#environment-variables)
22. [Installation](#installation)
23. [Deployment](#deployment)
24. [Roadmap](#roadmap)
25. [Future improvements — AI layer](#future-improvements--ai-layer)

---

## What it is

Startscout started as a startup job hunting tool. It is growing into a general-purpose web scraping platform.

The job and startup pipeline is the first built-in use case — but the underlying engine is designed to scrape, structure, enrich, and monitor *any* kind of web data you point it at. Business finance directories. Government procurement notices. Real estate listings. Grant databases. Investor directories. News mentions. Any page with information you want to track on a schedule.

You add sources and scrape jobs from the dashboard. No code required for standard targets. For sites that need a real browser (JS-rendered SPAs), Playwright kicks in automatically. Results land in **Collections** — flexible, schema-free data buckets — and flow into whatever pipeline steps you configure next: enrich, deduplicate, export to CSV, or fire a Slack alert.

AI-powered features — plain-English instruction interpretation, semantic fit scoring, cold email drafting, skill gap analysis, and interview prep — are designed and documented but require a paid Anthropic API key. They are flagged throughout this document and collected in the [Future improvements](#future-improvements--ai-layer) section at the bottom.

---

## Platform vision

```
You add:    Name: "Kenya Business Finance Directory"
            URL:  https://example-directory.com/finance/kenya
            Strategy: generic_list

Startscout: 1. Runs the scraper against the URL on your chosen schedule
            2. Extracts items using heuristic selector cascade
            3. Results land in Collection: "Kenya Finance Directory"
            4. Optional pipeline steps: enrich emails → deduplicate → export CSV → Slack alert
```

> **Future (AI layer):** You will be able to write plain-English instructions instead of picking a strategy. Claude will generate the selector config and field schema for you. See [Future improvements](#future-improvements--ai-layer).

This works for any domain. The jobs and startups pipeline is just the first pre-built template. Everything else is user-defined.

---

## Why this approach wins

| | LinkedIn / job boards | Startscout |
|---|---|---|
| Competition per role | 500–1,000+ applicants | 0–10 (pre-post) |
| Role discovery | Reactive — already public | Proactive — source level |
| Timing signal | None | Funding round detection |
| Contact info | None | Hiring manager email via Hunter.io |
| Fit scoring | None | CV embedding + Claude deep analysis |
| Personalisation | Manual, per application | AI-drafted, sequenced, tracked |
| Skill gaps | Unknown | Identified + resources suggested |
| Interview prep | DIY | Auto-generated on pipeline stage move |
| Tracking | Spreadsheet | Kanban pipeline with outcome learning |

---

## Tech stack

| Layer | Technology | Reason |
|---|---|---|
| Backend | FastAPI + Python | Best scraping ecosystem, long-lived process |
| Scraping (static) | httpx + BeautifulSoup | Async HTTP, fast HTML parsing |
| Scraping (JS sites) | Playwright | SPA/React portfolio pages need a real browser |
| Database | PostgreSQL + SQLAlchemy | Full control over upserts, batch inserts, deduplication |
| Migrations | Alembic | SQLAlchemy-native |
| Caching | Redis | Cache scrape results, avoid redundant external calls |
| Email enrichment | Pattern guessing only | `firstname@domain.com` — no paid API needed |
| Notifications | Resend (free tier) + Slack webhooks | Daily digest + real-time alerts |
| Scheduler | APScheduler | Long-lived cron, no 60s timeout like Vercel |
| Frontend | Next.js 15 (App Router, TypeScript) | React server components, easy Vercel deploy |
| Data fetching | SWR | Stale-while-revalidate + polling |
| Drag and drop | dnd-kit | Pipeline kanban |
| Frontend deploy | Vercel | Zero config, free tier |
| Backend deploy | Railway | Persistent Python process, no cold starts |

**Future paid additions (not required to run):**
- Anthropic Claude — instruction interpreter, fit scoring, email drafting, gap analysis, interview prep
- Voyage AI — CV and job description vector embeddings (has a generous free tier)
- Hunter.io — verified email lookup by domain ($49/mo starter)
- Crunchbase API — funding round signals ($29/mo basic)

---

## Architecture

```
┌──────────────────────────────────────────────────────┐
│                  Next.js Frontend                    │
│               startscout.vercel.app                  │
│                                                      │
│  Job feed · Companies · Pipeline · Sources · Studio  │
│              SWR polling → lib/api.ts                │
└────────────────────┬─────────────────────────────────┘
                     │ HTTP REST
                     ▼
┌──────────────────────────────────────────────────────┐
│                  FastAPI Backend                     │
│            startscout-api.railway.app                │
│                                                      │
│  /jobs  /companies  /pipeline  /sources              │
│  /scrape  /enrich  /studio  /collections  /export    │
└──────┬───────────────────────────┬───────────────────┘
       │                           │
       ▼                           ▼
┌─────────────────┐     ┌──────────────────────────┐
│   PostgreSQL    │     │      External targets     │
│   (Railway)     │     │  workatastartup.com       │
│                 │     │  sequoiacap.com           │
│  jobs           │     │  pear.vc                  │
│  companies      │     │  any URL you add          │
│  contacts       │     │                           │
│  pipeline       │     │  Resend (email digest)    │
│  sources        │     │  Slack webhooks           │
│  scrape_jobs    │     │  TechCrunch/HN RSS        │
│  collections    │     └──────────────────────────┘
│  pipeline_steps │
└─────────────────┘
       ▲
       │
┌──────────────────┐     ┌──────────────────┐
│   APScheduler    │     │      Redis        │
│   Daily 7am      │     │  Scrape result    │
│   scrape + notify│     │  cache (1hr TTL)  │
└──────────────────┘     └──────────────────┘
```

---

## Full project structure

```
startscout/
│
├── backend/
│   │
│   ├── main.py                              ← app entry point, router registration, CORS
│   │
│   ├── routers/
│   │   ├── jobs.py                          ← GET /jobs, GET /jobs/{id}, PATCH /jobs/{id}/save
│   │   ├── companies.py                     ← GET /companies, GET /companies/{id}
│   │   ├── pipeline.py                      ← GET /pipeline, PATCH /pipeline/{id}/stage
│   │   ├── sources.py                       ← CRUD + toggle for scraper source registry
│   │   ├── studio.py                        ← POST /studio, /studio/{id}/run, /studio/preview
│   │   ├── collections.py                   ← GET /collections, /collections/{id}/items
│   │   ├── export.py                        ← GET /export/{collection_id}/csv|json
│   │   ├── scrape.py                        ← POST /scrape/all, /scrape/{source_id}
│   │   ├── enrich.py                        ← POST /enrich/careers, /enrich/contacts
│   │   ├── signals.py                       ← GET /signals (RSS news only)
│   │   └── notify.py                        ← POST /notify/test, GET /notify/settings
│   │   # future: ai.py, profile.py (require paid Anthropic API)
│   │
│   ├── scrapers/
│   │   ├── base.py                          ← shared httpx session, retry, rate limiting
│   │   ├── registry.py                      ← dispatches by source.strategy
│   │   ├── executor.py                      ← runs any scrape config against any URL
│   │   └── strategies/
│   │       ├── yc.py
│   │       ├── generic_jobs.py
│   │       ├── generic_portfolio.py
│   │       ├── playwright_portfolio.py
│   │       └── hn_hiring.py
│   │
│   ├── pipeline/
│   │   ├── executor.py                      ← runs ordered step chain after each scrape
│   │   └── steps/
│   │       ├── enrich_step.py               ← probe careers pages, pattern-guess emails
│   │       ├── deduplicate_step.py          ← remove already-seen items
│   │       ├── export_step.py               ← write to CSV/JSON
│   │       ├── notify_step.py               ← Slack/email alert for new items
│   │       └── webhook_step.py              ← POST items to external URL
│   │   # future: ai_summarise_step.py, ai_score_step.py, ai_categorise_step.py
│   │
│   ├── enricher/
│   │   ├── careers_finder.py               ← probes /careers /jobs /join /join-us
│   │   ├── email_finder.py                 ← pattern guessing only (no paid API)
│   │   ├── contact_finder.py               ← LinkedIn lookups (use carefully)
│   │   └── deduplicator.py                ← cross-source hash deduplication
│   │
│   ├── signals/
│   │   └── news_monitor.py                 ← TechCrunch/HN RSS company mention scanner
│   │   # future: crunchbase.py ($29/mo), github_activity.py
│   │
│   ├── notifications/
│   │   ├── digest.py                       ← daily email digest via Resend (free tier)
│   │   └── slack.py                        ← Slack webhook alerts
│   │
│   ├── models/
│   │   ├── job.py
│   │   ├── company.py
│   │   ├── contact.py
│   │   ├── pipeline.py
│   │   ├── source.py
│   │   ├── signal.py
│   │   ├── scrape_job.py
│   │   ├── collection.py
│   │   └── pipeline_step.py
│   │   # future: outreach.py, cv_profile.py (require paid AI)
│   │
│   ├── db/
│   │   ├── session.py
│   │   ├── jobs.py
│   │   ├── companies.py
│   │   ├── contacts.py
│   │   ├── pipeline.py
│   │   ├── sources.py
│   │   ├── signals.py
│   │   ├── scrape_jobs.py
│   │   └── collections.py
│   │
│   ├── cache/
│   │   └── redis_client.py
│   │
│   ├── tasks/
│   │   └── scheduler.py
│   │
│   ├── utils/
│   │   ├── rate_limiter.py
│   │   ├── source_health.py
│   │   └── logger.py
│   │
│   ├── alembic/
│   │   ├── env.py
│   │   └── versions/
│   │
│   ├── .env
│   ├── alembic.ini
│   └── requirements.txt
│
└── frontend/
    │
    ├── app/
    │   ├── layout.tsx
    │   ├── page.tsx                         ← dashboard shell with tab router
    │   └── globals.css
    │
    ├── components/
    │   ├── tabs/
    │   │   ├── JobFeedTab.tsx
    │   │   ├── CompaniesTab.tsx
    │   │   ├── PipelineTab.tsx
    │   │   ├── SourcesTab.tsx
    │   │   ├── StudioTab.tsx                ← NEW: Scrape Studio UI
    │   │   ├── CollectionsTab.tsx           ← NEW: browse all collections + items
    │   │   └── StatsTab.tsx
    │   ├── studio/
    │   │   ├── InstructionForm.tsx          ← NEW: name + URL + instructions input
    │   │   ├── ConfigPreview.tsx            ← NEW: shows Claude-generated config, editable
    │   │   ├── ItemPreview.tsx              ← NEW: shows first 5 scraped items before saving
    │   │   ├── SchedulePicker.tsx           ← NEW: daily / weekly / manual
    │   │   └── PipelineBuilder.tsx          ← NEW: drag-and-drop step chain builder
    │   ├── collections/
    │   │   ├── CollectionCard.tsx           ← NEW
    │   │   ├── CollectionTable.tsx          ← NEW: paginated item table with search
    │   │   └── ExportButton.tsx             ← NEW: CSV / JSON / Excel download
    │   ├── JobCard.tsx
    │   ├── CompanyCard.tsx
    │   ├── SignalBadge.tsx
    │   └── ScrapeStatusBar.tsx
    │   # future: FitScoreBar.tsx, GapAnalysis.tsx, AIAnalysis.tsx,
    │   #         ColdEmailModal.tsx, InterviewPrepModal.tsx (require paid AI)
    │
    ├── hooks/
    │   ├── useJobs.ts
    │   ├── useCompanies.ts
    │   ├── usePipeline.ts
    │   ├── useSources.ts
    │   ├── useSignals.ts
    │   ├── useScrapeJobs.ts                 ← NEW
    │   └── useCollections.ts                ← NEW
    │
    ├── lib/
    │   └── api.ts
    │
    ├── types/
    │   ├── job.ts
    │   ├── company.ts
    │   ├── contact.ts
    │   ├── pipeline.ts
    │   ├── source.ts
    │   ├── signal.ts
    │   ├── scrapeJob.ts                     ← NEW
    │   └── collection.ts                    ← NEW
    │
    ├── .env.local
    └── package.json
```

---

## Database schema

```sql
-- scraper source registry (dynamic — managed from the Sources tab)
CREATE TABLE sources (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  url           TEXT NOT NULL,
  type          TEXT NOT NULL,         -- 'job_board' | 'vc_portfolio'
  strategy      TEXT NOT NULL,         -- key into STRATEGY_MAP in registry.py
  enabled       BOOLEAN DEFAULT TRUE,
  last_scraped  TIMESTAMP,
  job_count     INTEGER DEFAULT 0,
  health        TEXT DEFAULT 'ok',     -- 'ok' | 'warning' | 'dead'
  notes         TEXT
);

-- jobs
CREATE TABLE jobs (
  id            TEXT PRIMARY KEY,
  title         TEXT NOT NULL,
  company       TEXT NOT NULL,
  company_id    TEXT REFERENCES companies(id),
  source_id     TEXT REFERENCES sources(id),
  dedup_key     TEXT UNIQUE,           -- md5(normalised title+company) for cross-source dedup
  location      TEXT,
  salary        TEXT,
  description   TEXT,
  apply_url     TEXT NOT NULL,
  sector        TEXT,
  stage         TEXT,
  is_new        BOOLEAN DEFAULT TRUE,
  -- future: fit_score INTEGER, embedding vector(1024) — require paid AI
  is_remote     BOOLEAN DEFAULT FALSE,
  saved_at      TIMESTAMP,
  scraped_at    TIMESTAMP DEFAULT NOW()
);

-- companies
CREATE TABLE companies (
  id            TEXT PRIMARY KEY,
  name          TEXT UNIQUE NOT NULL,
  domain        TEXT,
  website       TEXT,
  careers_url   TEXT,
  source_id     TEXT REFERENCES sources(id),
  sector        TEXT,
  stage         TEXT,
  enriched      BOOLEAN DEFAULT FALSE,
  enriched_at   TIMESTAMP,
  created_at    TIMESTAMP DEFAULT NOW()
);

-- contacts (hiring managers)
CREATE TABLE contacts (
  id            TEXT PRIMARY KEY,
  company_id    TEXT REFERENCES companies(id),
  name          TEXT,
  role          TEXT,
  email         TEXT,
  confidence    INTEGER,               -- 0–100 from Hunter.io
  source        TEXT                   -- 'pattern' | 'linkedin' (hunter.io is future/paid)
);

-- pipeline
CREATE TABLE pipeline_items (
  id            TEXT PRIMARY KEY,
  job_id        TEXT REFERENCES jobs(id),
  stage         TEXT NOT NULL,         -- 'discovered' | 'researched' | 'applied'
                                       -- | 'interviewing' | 'offer' | 'rejected'
  notes         TEXT,
  applied_at    TIMESTAMP,
  updated_at    TIMESTAMP DEFAULT NOW()
);

-- future: outreach_steps table (3-step cold email sequences — requires paid Claude API)

-- news signals (free — RSS only)
CREATE TABLE signals (
  id            TEXT PRIMARY KEY,
  company_id    TEXT REFERENCES companies(id),
  type          TEXT NOT NULL,         -- 'funding_round' | 'news' | 'hiring_surge' | 'github_activity'
  title         TEXT,
  detail        TEXT,
  amount        TEXT,                  -- e.g. '$12M Series A'
  source_url    TEXT,
  detected_at   TIMESTAMP DEFAULT NOW()
);

-- future: cv_profile table (CV upload + vector embedding — requires paid Voyage AI + Claude)
```

---

## Backend — FastAPI

### Entry point (`backend/main.py`)

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import jobs, companies, pipeline, sources, scrape, enrich, ai, signals, notify, profile
from tasks.scheduler import start_scheduler

app = FastAPI(title="Startscout API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://startscout.vercel.app"],
    allow_methods=["*"],
    allow_headers=["*"],
)

for router, prefix in [
    (jobs.router,      "/jobs"),
    (companies.router, "/companies"),
    (pipeline.router,  "/pipeline"),
    (sources.router,   "/sources"),
    (scrape.router,    "/scrape"),
    (enrich.router,    "/enrich"),
    (ai.router,        "/ai"),
    (signals.router,   "/signals"),
    (notify.router,    "/notify"),
    (profile.router,   "/profile"),
]:
    app.include_router(router, prefix=prefix)

@app.on_event("startup")
async def startup():
    start_scheduler()
```

---

## Dynamic source registry

Sources are rows in the database, not hardcoded imports. The scraper engine reads the `sources` table at runtime and dispatches to the right strategy function.

### Scraper registry (`backend/scrapers/registry.py`)

```python
from scrapers.strategies.yc import scrape_yc
from scrapers.strategies.generic_jobs import scrape_generic_jobs
from scrapers.strategies.generic_portfolio import scrape_generic_portfolio
from scrapers.strategies.playwright_portfolio import scrape_playwright_portfolio
from scrapers.strategies.hn_hiring import scrape_hn_hiring

STRATEGY_MAP = {
    "yc":                   scrape_yc,
    "generic_jobs":         scrape_generic_jobs,
    "generic_portfolio":    scrape_generic_portfolio,
    "playwright_portfolio": scrape_playwright_portfolio,   # for JS-rendered SPAs
    "hn_hiring":            scrape_hn_hiring,
}

async def run_scraper(source: dict) -> list[dict]:
    fn = STRATEGY_MAP.get(source["strategy"])
    if not fn:
        raise ValueError(f"Unknown strategy: {source['strategy']}")
    return await fn(source["url"], source["id"])
```

### Default sources (seed data)

```sql
INSERT INTO sources (id, name, url, type, strategy, enabled) VALUES
  ('src_yc',    'Y Combinator',        'https://workatastartup.com/jobs',     'job_board',    'yc',                   true),
  ('src_seq',   'Sequoia Capital',     'https://sequoiacap.com/companies',    'vc_portfolio', 'generic_portfolio',    true),
  ('src_pear',  'Pear VC',             'https://pear.vc/portfolio',           'vc_portfolio', 'generic_portfolio',    true),
  ('src_wf',    'Wellfound',           'https://wellfound.com/jobs',          'job_board',    'generic_jobs',         false),
  ('src_a16z',  'Andreessen Horowitz', 'https://a16z.com/portfolio',          'vc_portfolio', 'playwright_portfolio', false),
  ('src_ls',    'Lightspeed Ventures', 'https://lsvp.com/portfolio',          'vc_portfolio', 'playwright_portfolio', false),
  ('src_accel', 'Accel',               'https://www.accel.com/companies',     'vc_portfolio', 'playwright_portfolio', false),
  ('src_gv',    'GV (Google Ventures)','https://www.gv.com/portfolio',        'vc_portfolio', 'playwright_portfolio', false),
  ('src_hn',    'HN Who is Hiring',    'https://news.ycombinator.com',        'job_board',    'hn_hiring',            false),
  ('src_remote','Remote OK',           'https://remoteok.com',                'job_board',    'generic_jobs',         false);
```

### Adding a new source from the dashboard

From the **Sources** tab: enter a name, paste a URL, pick a type and strategy, click **Add**. Then **Scrape now** to test it. If it returns 0 results the site is a JS SPA — switch strategy to `playwright_portfolio`. No code changes needed.

### Playwright fallback (`backend/scrapers/strategies/playwright_portfolio.py`)

```python
from playwright.async_api import async_playwright
from bs4 import BeautifulSoup

async def scrape_playwright_portfolio(url: str, source_id: str) -> list[dict]:
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page    = await browser.new_page()
        await page.goto(url, wait_until="networkidle")
        content = await page.content()
        await browser.close()

    soup = BeautifulSoup(content, "html.parser")
    for selector in [".company", ".portfolio-company", "[class*='company']", "article"]:
        found = soup.select(selector)
        if len(found) > 3:
            return [
                {
                    "name":      el.select_one("h2,h3,h4,.name").text.strip(),
                    "website":   el.select_one("a")["href"] if el.select_one("a") else None,
                    "source_id": source_id,
                }
                for el in found if el.select_one("h2,h3,h4,.name")
            ]
    return []
```

### Source health monitor (`backend/utils/source_health.py`)

Automatically flags broken scrapers when markup changes.

```python
from db.sources import update_health
from notifications.slack import send_slack_alert

async def check_source_health(db, source: dict, result_count: int):
    if result_count == 0:
        await update_health(db, source["id"], "warning")
        await send_slack_alert(
            f":warning: *{source['name']}* returned 0 results — selector may be broken.\n"
            f"URL: {source['url']}"
        )
    elif result_count > 5:
        await update_health(db, source["id"], "ok")
```

---

## Scrape Studio — instruction-driven scraping

The Scrape Studio is the dashboard tab where all scrape jobs are created and managed. No code required.

### How it works

**Step 1 — Add your target**

The user fills in four fields:

```
Name:      Kenya Business Finance Directory
URL:       https://example-directory.com/finance/kenya
Strategy:  generic_list          ← pick from available strategies
Schedule:  daily at 6am
```

**Step 2 — Preview before saving**

The studio runs the strategy against the live URL and shows the first 5 extracted items. The user can inspect the results before the job is saved.

> **Future (AI layer):** Instead of picking a strategy, you will be able to type plain-English instructions. Claude will read the page HTML and generate a precise selector config automatically. See [Future improvements](#future-improvements--ai-layer).

**Step 3 — Schedule and save**

```
Schedule:   daily at 6am  /  weekly on Monday  /  on-demand only
Collection: Kenya Finance Directory             ← creates or appends to a collection
On new item: notify via Slack                  ← optional trigger
```

The scrape job is saved and runs automatically.

### Scrape job router (`backend/routers/studio.py`)

```python
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from db.session import get_db
from db import scrape_jobs as jobs_db
from scrapers.executor import execute_scrape_job

router = APIRouter()

class ScrapeJobCreate(BaseModel):
    name:            str
    url:             str
    instructions:    str
    collection_name: str
    schedule:        str    # 'daily' | 'weekly' | 'manual'
    notify:          bool = False

@router.post("/preview")
async def preview(url: str, config: dict):
    items = await execute_scrape_job(url, config, limit=5)
    return { "items": items }

@router.post("/")
async def create_job(body: ScrapeJobCreate, db=Depends(get_db)):
    return await jobs_db.create_scrape_job(db, body.model_dump())

@router.get("/")
async def list_jobs(db=Depends(get_db)):
    return await jobs_db.get_all_scrape_jobs(db)

@router.post("/{job_id}/run")
async def run_job(job_id: str, db=Depends(get_db)):
    job = await jobs_db.get_scrape_job(db, job_id)
    items = await execute_scrape_job(job["url"], job["config"])
    await jobs_db.record_run(db, job_id, len(items))
    return { "scraped": len(items) }
```

### Scrape executor (`backend/scrapers/executor.py`)

The executor takes a config (generated by Claude or manually edited) and runs it against any URL:

```python
from bs4 import BeautifulSoup
from scrapers.base import get_client, safe_get

async def execute_scrape_job(url: str, config: dict, limit: int = None) -> list[dict]:
    items = []
    current_url = url

    while current_url:
        async with get_client() as client:
            res = await safe_get(client, current_url)
        soup = BeautifulSoup(res.text, "html.parser")

        for el in soup.select(config["list_selector"]):
            item = {}
            for field in config["fields"]:
                node = el.select_one(field["selector"])
                if not node:
                    item[field["name"]] = None
                    continue
                if field["type"] == "text":
                    item[field["name"]] = node.get_text(strip=True)
                elif field["type"] == "attr":
                    item[field["name"]] = node.get(field.get("attr", "href"))
                elif field["type"] == "html":
                    item[field["name"]] = str(node)
            items.append(item)

        if limit and len(items) >= limit:
            break

        # handle pagination
        pagination = config.get("pagination", {})
        if pagination.get("type") == "next_button":
            nxt = soup.select_one(pagination["selector"])
            current_url = nxt["href"] if nxt else None
        elif pagination.get("type") == "url_pattern":
            # increment page counter — implementation depends on pattern
            current_url = None
        else:
            current_url = None

    return items[:limit] if limit else items
```

---

## Collections — universal data layer

A Collection is a flexible, user-named bucket that holds scraped items. Unlike the fixed `jobs` and `companies` tables, a collection has no predefined schema — each item stores its fields as JSON.

```
Collection: "Kenya Business Finance Directory"
  Items: [
    { company_name: "Stanbic Bank Kenya", founded: "1992", services: "SME Lending", ... },
    { company_name: "Equity Group",       founded: "1984", services: "Microfinance", ... },
    ...
  ]

Collection: "East Africa VC Firms"
  Items: [
    { name: "TLcom Capital", focus: "Early stage tech", aum: "$71M", ... },
    ...
  ]

Collection: "Government Procurement Notices — Kenya"
  Items: [
    { tender_no: "KBC/001/2026", description: "IT Equipment Supply", deadline: "2026-05-01", ... },
    ...
  ]
```

### New database tables for the platform layer

```sql
-- user-defined scrape jobs (instruction-driven)
CREATE TABLE scrape_jobs (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  url             TEXT NOT NULL,
  instructions    TEXT NOT NULL,          -- original plain-English instructions
  config          JSONB NOT NULL,         -- Claude-generated selector config
  collection_id   TEXT REFERENCES collections(id),
  schedule        TEXT DEFAULT 'manual',  -- 'daily' | 'weekly' | 'manual'
  notify          BOOLEAN DEFAULT FALSE,
  last_run        TIMESTAMP,
  last_count      INTEGER DEFAULT 0,
  health          TEXT DEFAULT 'ok',      -- 'ok' | 'warning' | 'dead'
  created_at      TIMESTAMP DEFAULT NOW()
);

-- flexible data collections
CREATE TABLE collections (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  description     TEXT,
  category        TEXT,                   -- 'jobs' | 'finance' | 'real_estate' | 'custom' | ...
  item_count      INTEGER DEFAULT 0,
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
);

-- collection items (schema-free, all fields in JSON)
CREATE TABLE collection_items (
  id              TEXT PRIMARY KEY,
  collection_id   TEXT REFERENCES collections(id),
  scrape_job_id   TEXT REFERENCES scrape_jobs(id),
  data            JSONB NOT NULL,         -- all extracted fields stored here
  dedup_key       TEXT,                   -- md5 of key fields to prevent duplicates
  -- future: embedding vector(1024) — requires paid Voyage AI
  is_new          BOOLEAN DEFAULT TRUE,
  scraped_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX ON collection_items (collection_id);
CREATE INDEX ON collection_items (dedup_key);
CREATE INDEX ON collection_items USING gin (data);           -- fast JSONB search

-- pipeline steps attached to a scrape job
CREATE TABLE pipeline_steps (
  id              TEXT PRIMARY KEY,
  scrape_job_id   TEXT REFERENCES scrape_jobs(id),
  order_index     INTEGER NOT NULL,
  type            TEXT NOT NULL,          -- 'enrich' | 'ai_summarise' | 'export' | 'notify' | 'webhook'
  config          JSONB,                  -- step-specific config
  enabled         BOOLEAN DEFAULT TRUE
);
```

### Collections router (`backend/routers/collections.py`)

```python
from fastapi import APIRouter, Depends, Query
from db.session import get_db
from db import collections as col_db

router = APIRouter()

@router.get("/")
async def list_collections(db=Depends(get_db)):
    return await col_db.get_all(db)

@router.get("/{collection_id}/items")
async def get_items(
    collection_id: str,
    search: str = Query(None),
    page: int = Query(1),
    limit: int = Query(50),
    db=Depends(get_db)
):
    return await col_db.get_items(db, collection_id, search=search, page=page, limit=limit)

@router.get("/{collection_id}/export")
async def export_collection(
    collection_id: str,
    format: str = Query("csv"),          # 'csv' | 'json' | 'xlsx'
    db=Depends(get_db)
):
    items = await col_db.get_all_items(db, collection_id)
    return await export_items(items, format)

@router.delete("/{collection_id}/items/{item_id}")
async def delete_item(collection_id: str, item_id: str, db=Depends(get_db)):
    return await col_db.delete_item(db, item_id)
```

---

## Pipeline builder

Each scrape job can have a chain of pipeline steps that run automatically after every scrape. Steps are ordered and configured independently.

### Step types

| Type | What it does | Config |
|---|---|---|
| `enrich` | Probe careers pages, find emails, fetch extra details | `fields_to_enrich: ["email", "careers_url"]` |
| `ai_summarise` | Claude summarises each item into a single sentence | `prompt: "Summarise this company in one sentence"` |
| `ai_categorise` | Claude tags each item with a category label | `categories: ["lending", "VC", "insurance"]` |
| `ai_score` | Claude scores each item against a criterion (0–100) | `criterion: "relevance to early-stage tech startups"` |
| `deduplicate` | Remove items already in the collection | automatic |
| `export` | Write results to CSV, JSON, or webhook | `format`, `destination` |
| `notify` | Send Slack or email alert for new items | `channel`, `threshold` |
| `webhook` | POST items to an external URL | `url`, `headers` |

### Pipeline executor (`backend/pipeline/executor.py`)

```python
from pipeline.steps import enrich_step, deduplicate_step, export_step, notify_step, webhook_step

STEP_MAP = {
    "enrich":       enrich_step,
    "deduplicate":  deduplicate_step,
    "export":       export_step,
    "notify":       notify_step,
    "webhook":      webhook_step,
    # future: "ai_summarise", "ai_categorise", "ai_score" (require paid Claude API)
}

async def run_pipeline(items: list[dict], steps: list[dict]) -> list[dict]:
    for step in sorted(steps, key=lambda s: s["order_index"]):
        if not step["enabled"]:
            continue
        fn = STEP_MAP.get(step["type"])
        if fn:
            items = await fn(items, step["config"])
    return items
```

### Example pipeline config (stored in `pipeline_steps` table)

For the "Kenya Business Finance Directory" scrape job:

```json
[
  { "order_index": 1, "type": "enrich",      "config": { "fields": ["email", "careers_url"] } },
  { "order_index": 2, "type": "deduplicate", "config": {} },
  { "order_index": 3, "type": "notify",      "config": { "channel": "slack" } },
  { "order_index": 4, "type": "export",      "config": { "format": "csv" } }
]
```

> **Future:** Once AI is enabled, steps 2 and 3 would be: `ai_categorise` → `ai_score` → `notify` only items scoring above a threshold.

---

## Export layer

Any collection can be exported at any time in multiple formats. Exports can also be triggered automatically as a pipeline step.

### Export router (`backend/routers/export.py`)

```python
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
import csv, json, io
from db.session import get_db
from db.collections import get_all_items

router = APIRouter()

@router.get("/{collection_id}/csv")
async def export_csv(collection_id: str, db=Depends(get_db)):
    items = await get_all_items(db, collection_id)
    if not items:
        return {"error": "empty collection"}

    output  = io.StringIO()
    writer  = csv.DictWriter(output, fieldnames=items[0]["data"].keys())
    writer.writeheader()
    for item in items:
        writer.writerow(item["data"])

    output.seek(0)
    return StreamingResponse(
        output,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={collection_id}.csv"}
    )

@router.get("/{collection_id}/json")
async def export_json(collection_id: str, db=Depends(get_db)):
    items = await get_all_items(db, collection_id)
    return StreamingResponse(
        io.BytesIO(json.dumps([i["data"] for i in items], indent=2).encode()),
        media_type="application/json",
        headers={"Content-Disposition": f"attachment; filename={collection_id}.json"}
    )
```

### Webhook step (`backend/pipeline/steps/webhook_step.py`)

```python
import httpx

async def webhook_step(items: list[dict], config: dict) -> list[dict]:
    url     = config["url"]
    headers = config.get("headers", {})
    async with httpx.AsyncClient() as client:
        await client.post(url, json={"items": items}, headers=headers)
    return items
```

---



### Generic strategies

Two catch-all strategies cover ~80% of new sources with no custom code needed:

```python
# backend/scrapers/strategies/generic_jobs.py
from bs4 import BeautifulSoup
from scrapers.base import get_client, safe_get

JOB_SELECTORS = [
    "a[href*='/jobs/']", "a[href*='/careers/']",
    ".job-title a", ".position a", "h2 a", "h3 a"
]

async def scrape_generic_jobs(url: str, source_id: str) -> list[dict]:
    async with get_client() as client:
        res = await safe_get(client, url)
    soup = BeautifulSoup(res.text, "html.parser")

    for selector in JOB_SELECTORS:
        found = soup.select(selector)
        if len(found) > 3:
            return [
                {
                    "title":     el.text.strip(),
                    "apply_url": el["href"] if el["href"].startswith("http") else url + el["href"],
                    "source_id": source_id,
                }
                for el in found if el.text.strip() and el.get("href")
            ]
    return []
```

```python
# backend/scrapers/strategies/generic_portfolio.py
PORTFOLIO_SELECTORS = [
    ".company", ".portfolio-company", ".company-card",
    "[class*='portfolio']", "article"
]

async def scrape_generic_portfolio(url: str, source_id: str) -> list[dict]:
    async with get_client() as client:
        res = await safe_get(client, url)
    soup = BeautifulSoup(res.text, "html.parser")

    for selector in PORTFOLIO_SELECTORS:
        found = soup.select(selector)
        if len(found) > 3:
            return [
                {
                    "name":      el.select_one("h2,h3,h4,.name,[class*='name']").text.strip(),
                    "website":   el.select_one("a")["href"] if el.select_one("a") else None,
                    "source_id": source_id,
                }
                for el in found if el.select_one("h2,h3,h4,.name,[class*='name']")
            ]
    return []
```

---

## Enrichment layer

### Careers finder

```python
# backend/enricher/careers_finder.py
PATHS = ["/careers", "/jobs", "/join", "/join-us", "/work-with-us", "/about/careers", "/hiring"]

async def find_careers_page(domain: str) -> str | None:
    async with get_client() as client:
        for path in PATHS:
            try:
                res = await client.head(f"https://{domain}{path}", timeout=5)
                if res.status_code == 200:
                    return f"https://{domain}{path}"
            except Exception:
                continue
    return None
```

### Email finder — pattern guessing only

No paid API required. Common patterns cover ~60% of business email addresses.

```python
# backend/enricher/email_finder.py
def guess_patterns(first: str, last: str, domain: str) -> list[str]:
    f, l = first.lower(), last.lower()
    return [
        f"{f}@{domain}",
        f"{f}.{l}@{domain}",
        f"{f[0]}{l}@{domain}",
        f"{f}{l[0]}@{domain}",
    ]
```

> **Future:** Hunter.io API ($49/mo) provides verified emails with confidence scores. Add `HUNTER_API_KEY` to `.env` and uncomment the Hunter.io call in `email_finder.py`.

### Cross-source deduplication

The same job often appears on multiple sources. A normalised hash prevents double entries.

```python
# backend/enricher/deduplicator.py
import hashlib, re

def make_job_key(title: str, company: str) -> str:
    normalised = re.sub(r"[^a-z0-9]", "", f"{title}{company}".lower())
    return hashlib.md5(normalised.encode()).hexdigest()

async def is_duplicate(db, title: str, company: str) -> bool:
    key = make_job_key(title, company)
    result = await db.execute("SELECT id FROM jobs WHERE dedup_key = $1", key)
    return result.scalar() is not None
```

---

## AI layer

> This section describes features that require a paid Anthropic API key. They are fully designed and documented here as the intended implementation. All AI features are moved to [Future improvements](#future-improvements--ai-layer) and will not affect the free core build.

See [Future improvements — AI layer](#future-improvements--ai-layer) at the bottom of this document for the full implementation details of:

- CV embedding + semantic fit scoring (pgvector + Claude)
- Skill gap analysis
- Cold email sequence generator
- Interview prep automation
- Application outcome learning
- Instruction-driven scrape config generation

---

## Signal detection



Funding signals are the most powerful edge in this system. A company that just raised = right time to reach out.

> **Note:** Crunchbase API ($29/mo) is a future addition. The free signal detection currently uses RSS only.

### News monitor — free via RSS (`backend/signals/news_monitor.py`)

```python
import feedparser

FEEDS = [
    "https://techcrunch.com/feed/",
    "https://news.ycombinator.com/rss",
]

async def scan_news_for_company(company_name: str) -> list[dict]:
    hits = []
    for feed_url in FEEDS:
        feed = feedparser.parse(feed_url)
        for entry in feed.entries:
            if company_name.lower() in entry.title.lower():
                hits.append({
                    "type":       "news",
                    "title":      entry.title,
                    "source_url": entry.link,
                })
    return hits
```

---

## Notification system

### Daily digest (`backend/notifications/digest.py`)

```python
import resend
from os import environ

resend.api_key = environ["RESEND_API_KEY"]

async def send_daily_digest(new_jobs: list[dict], user_email: str):
    if not new_jobs:
        return
    lines = "\n".join(
        f"• {j['title']} at {j['company']} — {j['fit_score']}% fit"
        for j in new_jobs[:10]
    )
    resend.Emails.send({
        "from":    "startscout@yourdomain.com",
        "to":      user_email,
        "subject": f"Startscout: {len(new_jobs)} new roles today",
        "text":    f"New roles matching your profile:\n\n{lines}\n\nhttps://startscout.vercel.app"
    })
```

### Slack alerts (`backend/notifications/slack.py`)

Fires in real time when a high-fit job is scraped — no waiting for the daily digest.

```python
import httpx
from os import environ

async def send_slack_alert(message: str):
    webhook = environ.get("SLACK_WEBHOOK_URL")
    if not webhook:
        return
    await httpx.AsyncClient().post(webhook, json={"text": message})

# Usage in scraper pipeline:
# if job["fit_score"] >= 85:
#     await send_slack_alert(f":rocket: *{job['title']}* at *{job['company']}* — {job['fit_score']}% fit\n{job['apply_url']}")
```

---

## Cron scheduler

### Full daily pipeline (`backend/tasks/scheduler.py`)

```python
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from scrapers.registry import run_scraper
from enricher.careers_finder import find_careers_page
from signals.news_monitor import scan_news_for_company
from notifications.digest import send_daily_digest
from notifications.slack import send_slack_alert
from utils.source_health import check_source_health
from db.session import AsyncSessionLocal
from db import sources as src_db, jobs as jobs_db, companies as co_db, signals as sig_db
import asyncio
from os import environ

scheduler = AsyncIOScheduler()

@scheduler.scheduled_job("cron", hour=7, minute=0)
async def daily_pipeline():
    async with AsyncSessionLocal() as db:

        # 1. run all enabled scrapers
        sources  = await src_db.get_enabled_sources(db)
        new_jobs = []

        for source in sources:
            items = await run_scraper(source)
            await check_source_health(db, source, len(items))

            if source["type"] == "job_board":
                saved = await jobs_db.upsert_jobs(db, items)
                new_jobs.extend(saved)
            else:
                await co_db.upsert_companies(db, items)

            await asyncio.sleep(2)              # polite delay between sources

        # 2. enrich unenriched companies
        pending = await co_db.get_unenriched_companies(db)
        for company in pending:
            if company.domain:
                careers_url = await find_careers_page(company.domain)
                news        = await scan_news_for_company(company.name)
                await co_db.mark_enriched(db, company.id, careers_url=careers_url)
                for signal in news:
                    await sig_db.insert_signal(db, company.id, signal)
            await asyncio.sleep(1)

        # 3. send daily digest of new jobs
        if new_jobs:
            await send_daily_digest(new_jobs, environ["NOTIFY_EMAIL"])

        # future step 4: score new jobs against CV embedding (requires paid Voyage AI + Claude)

def start_scheduler():
    scheduler.start()
```

---

## Frontend — Next.js

### API client (`frontend/lib/api.ts`)

```typescript
const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${path}`);
  return res.json();
}

// Jobs
export const getJobs         = (params?: Record<string, string>) =>
  request<Job[]>(`/jobs${params ? "?" + new URLSearchParams(params) : ""}`);
export const saveJob         = (id: string) =>
  request(`/jobs/${id}/save`, { method: "PATCH" });

// Companies
export const getCompanies    = () => request<Company[]>("/companies");

// Pipeline
export const getPipeline     = () => request<PipelineItem[]>("/pipeline");
export const updateStage     = (id: string, stage: string) =>
  request(`/pipeline/${id}/stage`, { method: "PATCH", body: JSON.stringify({ stage }) });

// Sources
export const getSources      = () => request<Source[]>("/sources");
export const addSource       = (body: SourceCreate) =>
  request("/sources", { method: "POST", body: JSON.stringify(body) });
export const toggleSource    = (id: string) =>
  request(`/sources/${id}/toggle`, { method: "PATCH" });
export const deleteSource    = (id: string) =>
  request(`/sources/${id}`, { method: "DELETE" });
export const scrapeSource    = (id: string) =>
  request(`/scrape/${id}`, { method: "POST" });
export const scrapeAll       = () =>
  request("/scrape/all", { method: "POST" });

// Signals
export const getSignals      = (companyId: string) =>
  request<Signal[]>(`/signals?company_id=${companyId}`);

// AI
export const analyzeJob      = (job: Partial<Job>) =>
  request<{ analysis: string }>("/ai/analyze", { method: "POST", body: JSON.stringify(job) });
export const getGapAnalysis  = (jobId: string) =>
  request<GapAnalysis>(`/ai/gap-analysis/${jobId}`, { method: "POST" });
export const draftSequence   = (payload: EmailPayload) =>
  request<OutreachStep[]>("/ai/email-sequence", { method: "POST", body: JSON.stringify(payload) });
export const getInterviewPrep = (pipelineId: string) =>
  request<InterviewPrep>(`/ai/interview-prep/${pipelineId}`, { method: "POST" });

// Profile
export const uploadCV        = (text: string) =>
  request("/profile", { method: "POST", body: JSON.stringify({ raw_text: text }) });
```

### Example hook with polling (`frontend/hooks/useJobs.ts`)

```typescript
import useSWR from "swr";
import { getJobs } from "@/lib/api";

export function useJobs(filters?: Record<string, string>) {
  const { data, error, isLoading, mutate } = useSWR(
    ["/jobs", filters],
    () => getJobs(filters),
    { refreshInterval: 60_000 }    // poll every 60s for new scraped jobs
  );
  return { jobs: data ?? [], isLoading, error, mutate };
}
```

---

## Environment variables

### `backend/.env`
```bash
# Required
DATABASE_URL=postgresql+asyncpg://user:pass@localhost/startscout

# Notifications (Resend free tier: 3,000 emails/month)
RESEND_API_KEY=re_...
NOTIFY_EMAIL=you@yourdomain.com

# Slack alerts (optional — free)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...

# Cache (optional but recommended)
REDIS_URL=redis://localhost:6379

# ── Future paid additions ──────────────────────────────
# ANTHROPIC_API_KEY=sk-ant-...        # AI features (fit scoring, email drafting, etc.)
# VOYAGE_API_KEY=pa-...               # CV + job embeddings
# HUNTER_API_KEY=...                  # verified email lookup ($49/mo)
# CRUNCHBASE_API_KEY=...              # funding signal detection ($29/mo)
```

### `frontend/.env.local`
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## Installation

### Backend
```bash
cd backend
python -m venv venv && source venv/bin/activate   # Windows: venv\Scripts\activate

pip install -r requirements.txt

# install Playwright browser binaries (needed for JS-rendered sites)
playwright install chromium

# run migrations
alembic upgrade head

# start server
uvicorn main:app --reload --port 8000
```

### `backend/requirements.txt`
```
fastapi
uvicorn[standard]
httpx
beautifulsoup4
playwright
feedparser
sqlalchemy[asyncio]
asyncpg
alembic
redis
apscheduler
resend
structlog
pydantic
python-dotenv

# future (paid): anthropic, voyageai, pgvector
```

### Frontend
```bash
cd frontend
npm install
npm run dev                        # runs on :3000
```

### `frontend/package.json` key dependencies
```json
{
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "swr": "^2.0.0",
    "@dnd-kit/core": "^6.0.0",
    "@dnd-kit/sortable": "^8.0.0"
  }
}
```

---

## Deployment

### Backend → Railway
1. Push `backend/` to GitHub
2. New Railway project → Deploy from GitHub
3. Add a **PostgreSQL** service in Railway and copy the `DATABASE_URL` into env vars
4. Run `CREATE EXTENSION IF NOT EXISTS vector;` once in the Railway Postgres shell
5. Add a **Redis** service in Railway and copy `REDIS_URL` into env vars
6. Add all remaining env vars from `backend/.env` in Railway dashboard
7. Railway auto-detects Python → runs `uvicorn main:app --host 0.0.0.0 --port $PORT`
8. Note your public URL: `https://startscout-api.railway.app`

### Frontend → Vercel
1. Push `frontend/` to GitHub
2. Import into Vercel → framework preset: Next.js
3. Add `NEXT_PUBLIC_API_URL=https://startscout-api.railway.app`
4. Deploy → live at `https://startscout.vercel.app`

---

## Roadmap

### Phase 1 — Core scraping platform *(free, build this first)*
- [ ] Dynamic source registry (DB-driven, dashboard-managed)
- [ ] YC, Sequoia, Pear scrapers with generic fallback strategies
- [ ] Playwright fallback for JS-rendered portfolio sites
- [ ] Careers page enricher (probe 7 common paths)
- [ ] Email pattern guessing (no paid API)
- [ ] Cross-source job deduplication
- [ ] Job feed UI with search, source filters, tag filters
- [ ] Save jobs + pipeline kanban (6 stages)
- [ ] Daily cron with source health monitoring + Slack alert on breakage

### Phase 2 — Scrape Studio + Collections *(free)*
- [ ] Scrape Studio: add any URL with a strategy picker + live preview
- [ ] Collections: schema-free data buckets for any scrape target
- [ ] Pipeline builder: enrich → deduplicate → export → notify → webhook
- [ ] Export layer: CSV and JSON per collection
- [ ] Template library: pre-built configs for finance, tenders, real estate, grants
- [ ] Daily digest notifications via Resend (free tier)
- [ ] Slack webhook for new items in any collection

### Phase 3 — Signal detection *(free)*
- [ ] TechCrunch / HN RSS company mention scanner
- [ ] News signal badge on company cards
- [ ] Source performance analytics (items per run, health history)
- [ ] Application funnel stats (applied → interview → offer rates)
- [ ] Redis caching for scrape results (1hr TTL)

### Phase 4 — AI layer *(requires paid Anthropic API key)*
- [ ] Instruction interpreter: plain-English → Claude-generated scrape config
- [ ] CV upload + Voyage AI embedding stored in pgvector
- [ ] Semantic fit scoring: pgvector cosine pre-filter + Claude deep analysis
- [ ] Skill gap analysis for 60–80% fit roles
- [ ] 3-step cold email sequence generator with outcome tracking
- [ ] AI pipeline steps: summarise, categorise, score per collection item
- [ ] Application outcome learning → Claude refines future email drafts
- [ ] Interview prep auto-generated on pipeline stage move

### Phase 5 — Expansion
- [ ] Crunchbase funding round monitor (requires $29/mo API key)
- [ ] Hunter.io verified email enrichment (requires $49/mo)
- [ ] Browser extension — save any page to a collection in one click
- [ ] Multi-user support with shared collections
- [ ] Public API with key auth for external integrations
- [ ] Mobile app (React Native, shared TypeScript types)

---

## Future improvements — AI layer

The following features are fully designed and will be implemented once a paid **Anthropic API key** is available. They do not affect the free core build in any way.

### 1. Instruction interpreter
Write plain-English instructions for any URL. Claude reads the live page HTML and generates a precise selector config — field names, CSS selectors, pagination logic — automatically. No strategy picker needed.

*Requires:* `ANTHROPIC_API_KEY`

### 2. CV vector embeddings + semantic fit scoring
Upload your CV. It gets embedded via Voyage AI and stored in pgvector. New jobs are pre-ranked by cosine similarity at the database level before Claude does a deep analysis on only the top matches. Fit scoring becomes scalable at zero marginal cost per additional job.

*Requires:* `ANTHROPIC_API_KEY`, `VOYAGE_API_KEY`, pgvector Postgres extension

### 3. Skill gap analysis
For jobs scoring 60–80% fit, Claude identifies exactly which skills are missing and suggests one concrete resource to close each gap. Turns ambiguous partial-fit roles into actionable decisions.

*Requires:* `ANTHROPIC_API_KEY`

### 4. Cold email sequence generator
Generates a 3-step outreach sequence: initial email (day 0), follow-up (day 5), value-add (day 10). All three drafted by Claude, personalised to the company and contact. Outcome tracking (replied / no reply / meeting) feeds back to improve future drafts over time.

*Requires:* `ANTHROPIC_API_KEY`

### 5. Interview prep automation
Auto-triggered when a pipeline item moves to "interviewing." Claude generates likely interview questions from the job description, smart questions to ask the interviewer, key company research points, and red flags to watch for.

*Requires:* `ANTHROPIC_API_KEY`

### 6. AI pipeline steps
Three additional step types for the pipeline builder: `ai_summarise` (one-sentence summary per item), `ai_categorise` (tag items by category), and `ai_score` (score each item 0–100 against a custom criterion). These unlock much more powerful automated pipelines for any collection type.

*Requires:* `ANTHROPIC_API_KEY`

### 7. Funding signal detection (Crunchbase)
Per-company funding round monitoring. A company that just raised Series A = about to hire aggressively. Shows a "raised $12M · 3 weeks ago" badge on company cards.

*Requires:* Crunchbase Basic API key ($29/mo)

### 8. Verified email enrichment (Hunter.io)
Replaces pattern guessing with verified email addresses and confidence scores. Significantly increases cold outreach success rates.

*Requires:* Hunter.io API key ($49/mo)

---



The following improvements were identified as the highest-leverage additions to the original design. Each one addresses a real gap in how most job-hunting tools work.

### 1. Funding signal detection
Scrape Crunchbase and TechCrunch for recent funding rounds. A company that just raised is about to hire aggressively. Most people completely miss this signal — they wait for job postings instead of watching the money.

### 2. CV vector embeddings *(future — requires paid Voyage AI + Anthropic)*
Store your CV as a pgvector embedding. Pre-filter jobs by cosine similarity before sending anything to Claude, making fit scoring scalable instead of calling the API for every single job scraped. Keeps costs near-zero at volume.

### 3. Outreach sequence builder *(future — requires paid Anthropic API)*
Not one cold email but a 3-step tracked sequence: initial outreach → day 5 follow-up → day 10 value-add. Track open and reply status per step. Most people send one email and give up — a sequenced approach is measurably more effective.

### 4. Playwright fallback
Many modern VC portfolio sites are React or Next.js SPAs that return empty HTML when hit with a plain httpx request. A headless browser fallback per source means those sites get scraped correctly without needing a separate tool or manual intervention.

### 5. Redis caching
Cache scrape results and AI responses. Avoid hammering external sites on every cron run and burning API credits on jobs you have already scored. A 1-hour TTL on scrape results and a 24-hour TTL on fit scores covers the vast majority of cases.

### 6. Skill gap analysis *(future — requires paid Anthropic API)*
For jobs scoring 60–80% fit, Claude identifies exactly which skills are missing and suggests one concrete resource to close each gap. The 60–80% range is where most people either over-apply (waste of time) or under-apply (missed opportunity) — structured gap analysis makes the decision clear.

### 7. Interview prep mode *(future — requires paid Anthropic API)*
Once a job moves to "interviewing" in the pipeline, auto-generate likely questions based on the job description, smart questions to ask the interviewer, key company research points, and red flags to watch for. Triggered automatically on stage change — no manual step required.

### 8. Source health monitor
If a scraper starts returning 0 results, flag it immediately via Slack. Sites change their HTML markup silently. Without health monitoring you can go days thinking your pipeline is updating when it has actually been dead since the last site redesign.

### 9. Daily digest notifications
Email or Slack webhook with new high-fit roles every morning. A dashboard you have to remember to visit is weaker than one that comes to you. The digest covers roles ≥75% fit; real-time Slack alerts fire for anything ≥85%.

### 10. Application outcome learning *(future — requires paid Anthropic API)*
Track which outreach patterns — subject lines, timing, angle, company type — got responses versus silence. Feed outcomes back to Claude periodically to surface patterns and improve future drafts. Over 20–30 outreach attempts this produces meaningfully better email copy than starting from scratch each time.

---

*Built with FastAPI · Next.js · PostgreSQL · Redis · APScheduler*
*Last updated: April 2026*