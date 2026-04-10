# Startscout

**AI-powered web intelligence platform.** Describe what you want to scrape in plain English — Startscout builds the pipeline, runs it on a schedule, and delivers structured data to your dashboard.

Started as a startup job hunting tool. Grew into a general-purpose scraping platform you can point at anything: business finance directories, government tenders, VC portfolios, real estate listings, grant databases, competitor pricing — any page with information you want to track.

---

## How it works

```
You type:     "Scrape all business finance companies in Kenya from this directory.
               Get company name, founding year, services offered, and contact email."

Startscout:   → Sends the live page HTML + your instructions to Claude
              → Claude generates a scrape config (selectors, fields, pagination)
              → Shows you a live preview of the first 5 extracted items
              → You approve — saved as a scheduled Scrape Job
              → Results land in a Collection: "Kenya Finance Directory"
              → Optional next steps: enrich → AI score → export CSV → Slack alert
```

No code. No CSS selectors. No YAML config files.

---

## Features

**Scrape Studio**
Write instructions in plain English. Claude interprets them, generates a scrape configuration, and lets you preview results before the job runs. Supports static sites (httpx) and JS-rendered SPAs (Playwright) with automatic fallback.

**Collections**
Schema-free data buckets. Every scrape job writes into a named collection — "East Africa VC Firms", "Kenya Procurement Notices", "YC Batch W25 Jobs". Browse, search, and export any collection from the dashboard.

**Pipeline builder**
Chain actions after every scrape: enrich missing fields → Claude categorises items → score against a criterion → deduplicate → export to CSV → fire a webhook → send a Slack alert. Each step is configurable per job.

**Dynamic source registry**
All scrape sources live in the database, not in code. Add, toggle, and trigger any source from the Sources tab. Sites that need a real browser get Playwright automatically — no manual intervention.

**AI fit scoring**
Your CV is stored as a vector embedding (pgvector). New jobs are pre-ranked by cosine similarity before Claude does a deep analysis on the top matches. Keeps AI costs near-zero at volume.

**Funding signal detection**
Monitors Crunchbase and TechCrunch RSS for recent funding rounds. A company that just raised is about to hire. Most people miss this signal entirely.

**Outreach sequences**
3-step tracked cold email sequences — initial outreach, day-5 follow-up, day-10 value-add. Claude drafts all three. Outcome tracking feeds back to improve future drafts over time.

**Notifications**
Daily email digest via Resend for new high-fit roles. Real-time Slack alerts for anything scoring ≥85%. Source health monitoring fires an alert if a scraper silently breaks.

---

## Built-in templates

Pre-configured with zero setup required:

| Category | Examples |
|---|---|
| Startup jobs | Y Combinator, Wellfound, Hacker News Who's Hiring |
| VC portfolios | Sequoia, Pear VC, a16z, Lightspeed, Accel, GV |
| Business finance | Regional investor and lender directories |
| Government | Procurement notices, tender portals |
| Real estate | Listing aggregators |
| Grants | Funding databases by region and sector |
| News | Company mention monitoring via RSS |
| Events | Conference and meetup listings |

Any URL not covered by a template can be added as a custom scrape job from the Scrape Studio.

---

## Stack

| Layer | Technology |
|---|---|
| Backend | FastAPI + Python |
| Scraping | httpx + BeautifulSoup · Playwright (JS fallback) |
| Database | PostgreSQL + SQLAlchemy + pgvector |
| Caching | Redis |
| Migrations | Alembic |
| AI | Anthropic Claude (claude-opus-4-5) |
| Embeddings | Voyage AI (voyage-3) |
| Email enrichment | Hunter.io |
| Notifications | Resend + Slack webhooks |
| Scheduler | APScheduler |
| Frontend | Next.js 15 · TypeScript · SWR · dnd-kit |
| Backend deploy | Railway |
| Frontend deploy | Vercel |

---

## Quick start

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL with the `vector` extension (`CREATE EXTENSION vector`)
- Redis

### Backend

```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
playwright install chromium

cp .env.example .env
# fill in DATABASE_URL, ANTHROPIC_API_KEY, and any optional keys

alembic upgrade head
uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install

cp .env.local.example .env.local
# set NEXT_PUBLIC_API_URL=http://localhost:8000

npm run dev
```

Open `http://localhost:3000`.

---

## Environment variables

### `backend/.env`

```bash
# Required
DATABASE_URL=postgresql+asyncpg://user:pass@localhost/internet-scout
ANTHROPIC_API_KEY=sk-ant-...

# Recommended
VOYAGE_API_KEY=pa-...           # CV + job embeddings
HUNTER_API_KEY=...              # email enrichment
RESEND_API_KEY=re_...           # daily digest emails
NOTIFY_EMAIL=you@yourdomain.com

# Optional
CRUNCHBASE_API_KEY=...          # funding signal detection
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
REDIS_URL=redis://localhost:6379
```

### `frontend/.env.local`

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## Deployment

**Backend → Railway**
Push `backend/` to GitHub, create a Railway project, add a PostgreSQL and Redis service, paste in your env vars. Railway detects Python and runs uvicorn automatically. Enable the pgvector extension once via the Postgres shell.

**Frontend → Vercel**
Import `frontend/` from GitHub, set `NEXT_PUBLIC_API_URL` to your Railway backend URL, deploy. Live at `internet-scout.vercel.app`.

---

## Roadmap

- [x] YC, Sequoia, Pear VC scrapers
- [x] Dynamic source registry (add any source from the dashboard)
- [x] Playwright fallback for JS-rendered sites
- [x] Job feed with filters, fit scores, and pipeline kanban
- [ ] Scrape Studio — instruction-driven scrape job builder
- [ ] Collections — schema-free data layer for any scrape target
- [ ] Pipeline builder — chainable post-scrape actions
- [ ] CV vector embedding + semantic fit scoring (pgvector)
- [ ] Skill gap analysis for partial-fit roles
- [ ] 3-step cold email sequences with outcome tracking
- [ ] Funding signal detection (Crunchbase + RSS)
- [ ] Export layer — CSV, JSON, Excel per collection
- [ ] Template library (finance, tenders, real estate, grants)
- [ ] Browser extension — save any page to a collection in one click
- [ ] Multi-user support + public API

Full technical reference in [`internet-scout.md`](./internet-scout.md).

---

## Project structure

```
startscout/
├── backend/          ← FastAPI · scrapers · AI · pipeline · scheduler
└── frontend/         ← Next.js · dashboard · Scrape Studio · collections
```

See [`internet-scout.md`](./internet-scout.md) for the complete file-by-file breakdown, all database schemas, and every code sample.

---
