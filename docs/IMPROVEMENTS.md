# Internet Scout — Improvement Plan

Free-to-implement improvements to make the platform robust before AI features are added. Each item is grounded in the current codebase state as of April 2026.

---

## 1. Build the Backend Baseline (Non-AI Only)

**Current state:** Backend directory does not exist. All 10 routers, database schema, and scraper designs are fully documented in `internet-scout.md` but zero code has been written.

**What to build:**

### 1a. FastAPI Skeleton + Database

- Create `backend/` with FastAPI entry point, async SQLAlchemy models, Alembic migrations
- Implement the PostgreSQL schema already designed (sources, jobs, companies, pipeline_items, collections, collection_items, scrape_jobs, pipeline_steps, signals, contacts)
- Start with 5 priority routers that power the existing frontend tabs:
  - `GET/POST/PATCH/DELETE /sources` — Sources tab CRUD
  - `GET /jobs`, `PATCH /jobs/{id}/save` — Job Feed tab
  - `GET /pipeline`, `PATCH /pipeline/{id}/stage` — Pipeline Kanban tab
  - `GET /collections`, `GET /collections/{id}/items`, `GET /export/{id}/csv|json` — Collections tab + export
  - `POST /studio/preview`, `POST /studio`, `POST /studio/{id}/run` — Scrape Studio (heuristic mode, no AI)
- Redis cache layer with 1-hour TTL for scrape results

### 1b. Scrape Studio Heuristic Mode

The Studio currently calls `previewScrape()` which returns hardcoded dummy preview data (`studio.service.ts`). Before the AI instruction interpreter exists, implement a heuristic preview:

- User provides URL + CSS selectors manually (fields like `list_selector`, `title_selector`, etc. — already defined in `ScrapeJob.config` type in `scrape-job.ts`)
- Backend fetches the page with httpx + BeautifulSoup, applies selectors, returns first 5 items
- This makes Studio functional without Claude API — AI becomes a UX upgrade later, not a dependency

### 1c. Docker Compose for Local Dev

No Docker files exist. Create a `docker-compose.yml`:

```
services:
  postgres (pgvector/pgvector:pg16)
  redis (redis:7-alpine)
  backend (FastAPI, depends on both)
```

One-command local setup instead of manually installing Postgres and Redis.

---

## 2. Replace In-Memory Dummy Mutations with Persistence

**Current state:** 5 services mutate module-level arrays directly. Every mutation is lost on page refresh or server restart:

| Service | Mutation | What's lost |
|---------|----------|-------------|
| `sources.service.ts` | `DUMMY_SOURCES.push()`, `.splice()`, `.enabled = !enabled` | Added/deleted/toggled sources |
| `pipeline.service.ts` | `item.stage = stage` | Kanban drag-and-drop moves |
| `jobs.service.ts` | `job.savedAt = ...` | Saved/unsaved jobs |
| `studio.service.ts` | `DUMMY_SCRAPE_JOBS.push()`, `DUMMY_COLLECTIONS.push()` | Created scrape jobs and collections |
| `notifications.service.ts` | `settings = { ...settings, ...updates }` | Notification preferences |

**What to do:**

- Once the backend exists, swap each service from dummy data imports to `request()` calls via `api.ts` (which is already defined in `services/api.ts` but imported nowhere)
- The service layer was designed for exactly this swap — components and hooks need zero changes
- Until the backend is ready, an interim option is to use `localStorage` persistence in each service so mutations survive refresh (lightweight, no backend needed)

---

## 3. Real Authentication + Session Security

**Current state:** `auth-provider.tsx` is a localStorage mock:

- `signIn(email, password)` ignores the password entirely
- Stores only `{name, email}` in localStorage under key `"startscout_auth"`
- No token validation, no expiry, no backend verification
- Any email "works" — there is no user table

**What to build:**

- FastAPI `/auth` router: `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`
- Password hashing with `bcrypt` (via `passlib`)
- JWT access tokens (short-lived, 15min) + refresh tokens (httpOnly cookie, 7 days) using `python-jose`
- `users` table in PostgreSQL (id, name, email, hashed_password, created_at)
- Frontend: replace localStorage auth with httpOnly cookie flow, add token refresh interceptor in `api.ts`
- Protect all API routes with `Depends(get_current_user)` middleware
- This is entirely free — no third-party auth service needed

---

## 4. Scraper Reliability Controls

**Current state:** No scraper code exists yet. When building scrapers, bake in reliability from day one.

**What to implement:**

- **Retry with exponential backoff** — `tenacity` library, 3 retries with jitter per request
- **Timeout budgets** — 30s default per request, 5min max per scrape job, kill and flag if exceeded
- **Per-domain rate limits** — polite 2-second delay between requests to the same domain, configurable per source
- **robots.txt compliance** — parse and respect `Crawl-delay` and `Disallow` rules before scraping. Ethical and prevents IP bans
- **User-Agent rotation** — pool of 10-15 common browser user-agents to avoid fingerprinting blocks
- **Source health scoring** — track success/failure ratio per source over last 10 runs. Auto-flag sources that drop below 70% success as `health: "warning"`, below 30% as `health: "dead"` (the `SourceHealth` type already supports `'ok' | 'warning' | 'dead'`)
- **Failure alerts** — when a previously healthy source starts failing, trigger a notification (Slack webhook or dashboard alert)
- **HTML snapshot diffing** — when a scrape returns 0 items but previously worked, save the raw HTML for debugging. The site likely changed its markup

---

## 5. Observability + Audit Trail

**Current state:** No run history exists. The `Source` type tracks `lastScraped` and `jobCount` but there's no record of individual runs, errors, or performance over time.

**What to build:**

- **`scrape_runs` table** — id, source_id/scrape_job_id, started_at, finished_at, duration_ms, status (success/partial/failed), items_found, items_new, items_deduped, error_message, error_traceback
- **Per-run item counts** — how many items scraped, how many were new vs duplicates
- **Run history API** — `GET /sources/{id}/runs` and `GET /studio/{id}/runs` with pagination
- **Frontend: Run History panel** — accessible from the Sources tab and Studio tab, showing a table of past runs with status badges, duration, item counts, and expandable error details
- **Downloadable logs** — `GET /runs/{id}/log` returns the structured log for a specific run as JSON, useful for debugging scraper failures
- **Dashboard stats integration** — the Stats tab (`stats-dashboard.tsx`) already has chart infrastructure (Recharts). Add a "scrape activity over time" chart showing runs/day and success rate

---

## 6. Test Coverage Before AI

**Current state:** Zero tests. No test framework installed. No `vitest.config`, no `jest.config`, no `*.test.*` or `*.spec.*` files anywhere in the project.

**What to build:**

### Frontend Tests

- Install `vitest` + `@testing-library/react` + `@testing-library/jest-dom`
- **Service layer tests** — test every function in `services/` against expected dummy data transformations. These tests become the contract that validates the backend swap later
- **Hook tests** — test TanStack Query hooks with `@tanstack/react-query` test utilities (renderHook, QueryClient wrapper)
- **Component smoke tests** — render each tab component, verify it doesn't crash and shows expected content

### Backend Tests (when backend exists)

- `pytest` + `httpx` (AsyncClient) for API route integration tests
- **Scraper snapshot tests** — save HTML snapshots of target sites. Run scrapers against snapshots, not live sites. Tests are fast, deterministic, and they fail exactly when a site changes its markup (which is the whole point of source health monitoring)
- **Database tests** — use a test PostgreSQL instance, run migrations, verify CRUD operations

### End-to-End Flow

At minimum, one full flow test: create source -> trigger scrape -> verify items land in collection -> export CSV. This validates the entire pipeline works end-to-end.

---

## 7. Data Quality Layer

**Current state:** No deduplication logic. The `Job` type has a `dedupKey` field and collection items have a `dedupKey` field, but nothing uses them. Dummy data has manually assigned dedup keys.

**What to implement:**

- **Idempotent dedup keys** — auto-generate dedup keys from content hashes: for jobs, hash `(title + company + source)`. For collection items, hash the `data` JSONB blob. Insert-or-skip on duplicate key
- **Normalized company metadata** — when the same company appears from multiple sources (e.g., "Linear" from YC and from Wellfound), link them by domain. The `Company.domain` field exists for this purpose but no matching logic is implemented
- **Schema validation for collection items** — collections are schema-free (JSONB), which is flexible but fragile. Add optional per-collection schema definition: when a collection has a schema, validate incoming items and flag/reject mismatches. This prevents silent data corruption when a site changes its markup
- **Stale data expiry** — jobs and collection items should have a `stale_after` policy. Items older than N days (configurable per source/collection) get flagged or archived, not shown as current results

---

## 8. Docs / Code Alignment

**Current state:** Multiple misalignments between documentation and actual code:

| Doc says | Code actually uses | File |
|----------|--------------------|------|
| SWR for data fetching | TanStack Query v5 (`@tanstack/react-query`) | CLAUDE.md line 89, README.md line 88 |
| Next.js 15 | Next.js 16.2.3 | CLAUDE.md line 18, package.json |
| Project name "Startscout" | "Internet-Scout" everywhere else | internet-scout.md title, README.md line 1 |
| `hooks/` use SWR with 60s polling | hooks use `useQuery`/`useMutation` from TanStack | CLAUDE.md line 89 |

**What to fix:**

- Update CLAUDE.md: change "SWR" references to "TanStack Query v5", update Next.js version to 16
- Update README.md: same SWR -> TanStack Query fix, update stack table
- Update internet-scout.md: rename title from "Startscout" to "Internet Scout"
- Add a "Last updated" date to each doc so staleness is visible
- Consider a CI check (simple grep script) that flags known version strings in docs vs package.json

---

## 9. Frontend Robustness

**Current state:** No error boundaries, no URL-synced tab state, no keyboard shortcuts, no dark mode.

### 9a. Error Boundaries

If any tab component throws, the entire dashboard crashes. Wrap each tab in a React error boundary with:
- Error message + stack trace (dev only)
- "Retry" button that resets the boundary
- Fallback UI so other tabs remain usable

### 9b. URL-Synced Tab State

Currently the dashboard (`dashboard/page.tsx`) uses `<Tabs defaultValue="jobs">` — tab state is ephemeral. If a user navigates away and back, they always land on "jobs".

- Use `searchParams` (`?tab=pipeline`) to persist tab state in the URL
- Users can bookmark and share direct links to specific tabs
- Browser back/forward navigates between tabs naturally

### 9c. Keyboard Shortcuts

Power user acceleration — zero cost to implement:
- `1-8` to switch between tabs
- `j/k` to navigate job list up/down
- `s` to save/unsave the focused job
- `/` to focus the search input
- `Escape` to close dialogs

### 9d. Dark Mode

shadcn/ui + Tailwind supports dark mode out of the box. The setup is:
- Add `darkMode: "class"` to Tailwind config (or use the CSS-based approach in v4)
- Add a theme toggle button in the header
- shadcn components already have dark variants — they just need the class applied

### 9e. Optimistic Update Rollbacks

Pipeline drag-and-drop (`use-pipeline.ts`) does optimistic updates via TanStack Query's `onMutate`, but verify that `onError` properly rolls back to the previous state if the server rejects the move. Currently with dummy data it never fails, but with a real backend it will.

---

## 10. Export + Webhook Layer

**Current state:** The Collections tab has an export button in the UI (`export-button.tsx`), and collection items have data. But export currently works client-side from dummy data only.

**What to build:**

- **Server-side CSV/JSON export** — `GET /export/{collection_id}/csv` and `/json` endpoints. Python's `csv` module + `json.dumps` — zero external dependencies
- **Webhook pipeline step** — `httpx.post(url, json=payload)` after scrape completion. Lets users pipe data to Zapier, Make, n8n, or any automation tool (all have free tiers)
- **Slack notification step** — POST to a Slack webhook URL with formatted message. Completely free on Slack's side for incoming webhooks
- **Email digest** — daily summary via Resend (free tier: 100 emails/day, more than enough for a single user)

---

## 11. Rate Limiting + Abuse Prevention

**What to implement:**

- **API rate limiting** — `slowapi` middleware on FastAPI. Prevents runaway clients and protects scrape targets from accidental DDoS
- **Scrape queue** — instead of running scrapes inline with API requests (which can timeout), push to a Redis-backed queue. Process scrapes asynchronously with configurable concurrency (e.g., max 3 concurrent scrapes). Return a job ID immediately, client polls for status
- **Request fingerprint caching** — hash `(URL + config + selectors)` as a cache key. If the same scrape was run within the Redis TTL window (1 hour), return cached results instead of re-scraping

---

## 12. Scrape Queue + Async Job Processing

**Current state:** The Studio's `previewScrape()` and Sources' `scrapeSource()` are synchronous service calls. With real scraping, these can take 5-60+ seconds.

**What to build:**

- **Job queue** using Redis lists (or `arq` / `rq` — both free, lightweight Python task queues)
- **Status polling** — `GET /scrape-jobs/{id}/status` returns `queued | running | completed | failed`
- **Frontend integration** — when user clicks "Run" in Studio or "Scrape" in Sources, show a progress indicator that polls status. The Sonner toast library (already installed) can show real-time status updates
- **Concurrency control** — configurable max concurrent scrapes (default 3) to avoid overwhelming targets or your own server

---

## 13. Source Health Dashboard

**Current state:** The `Source` type has a `health` field (`'ok' | 'warning' | 'dead'`) and `health-indicator.tsx` renders a colored dot. But health is static dummy data — nothing computes or updates it.

**What to build:**

- **Health computation** — after each scrape run, recalculate health based on recent run history (last 10 runs: >70% success = ok, 30-70% = warning, <30% = dead)
- **Health timeline** — show health transitions over time in the Sources tab (when did a source go from ok to warning?)
- **Auto-disable** — optionally auto-disable sources that reach "dead" status to stop wasting scrape cycles
- **Health alerts** — when a source transitions from ok to warning or dead, fire a notification (complements the notification system in item 10)

---

## 14. DS/ML Integrations (Free, Local, No API Keys)

**Current state:** Zero DS/ML in the project. All planned AI features (Claude instruction parsing, Voyage AI embeddings) require paid API keys. The concepts below run locally with free Python libraries and plug directly into backend modules being built.

**Dependencies:** `scikit-learn`, `spacy` (small model), `rake-nltk`, `numpy` — all free, all pip-installable.

### 14a. TF-IDF + Cosine Similarity — Deduplication & Search

**Problem:** The `dedupKey` field exists on `Job` and `CollectionItem` types but nothing uses it. Exact string matching misses near-duplicates like "Senior Frontend Engineer" vs "Sr. Frontend Dev" from different sources. Collection search is basic substring matching.

**Implementation:**
- `scikit-learn`'s `TfidfVectorizer` + `cosine_similarity`
- Vectorize job titles + descriptions on ingest
- Flag pairs above 0.85 similarity as duplicates — merge or skip on insert
- Power ranked search in Collections — return results sorted by TF-IDF relevance instead of substring position
- ~50 lines of Python, runs in milliseconds for thousands of items

**Where it plugs in:** Data quality layer (item 7) and the `/collections/{id}/items?search=` endpoint.

### 14b. Z-Score Anomaly Detection — Intelligent Source Health

**Problem:** Source health (item 13) is currently planned as a simple success/failure threshold. But a source that normally returns 500 items suddenly returning 50 is broken even if it "succeeds" with HTTP 200.

**Implementation:**
- Track `items_found` per source per run as a time series in the `scrape_runs` table (item 5)
- Compute rolling mean and standard deviation over the last 30 runs
- If today's count is >2 standard deviations below the mean, flag as anomaly
- Integrate into health scoring: anomaly + success = `warning` (markup may have changed), anomaly + failure = `dead`
- ~20 lines of numpy, no ML model to train

**Where it plugs in:** Source health dashboard (item 13) and scraper reliability alerts (item 4).

### 14c. Naive Bayes / Logistic Regression — Job Auto-Classification

**Problem:** Jobs must be manually tagged by sector, role type, or seniority. Source metadata is often missing or inconsistent across different sites.

**Implementation:**
- `scikit-learn`'s `Pipeline(TfidfVectorizer(), LogisticRegression())`
- Train on your accumulated scraped job data — even 100-200 labeled examples give a usable model
- Auto-assign sector (Developer Tools, AI/ML, Fintech, etc.) and seniority (Junior, Mid, Senior, Lead) on ingest
- Retrain periodically as more labeled data accumulates
- ~10 lines of code, model trains in seconds

**Where it plugs in:** `/jobs` ingest pipeline, powers better filtering in the Job Feed tab.

### 14d. Named Entity Recognition — Structured Data Extraction from Raw Text

**Problem:** The enricher module is designed to find careers pages and guess emails. Scraped pages contain company names, person names, locations, and monetary amounts buried in unstructured text that currently gets ignored.

**Implementation:**
- `spaCy`'s small English model (`en_core_web_sm`, 12MB download)
- Extracts ORG, PERSON, GPE (locations), MONEY entities out of the box
- Feed it a scraped page → get structured entities back
- Particularly useful for the signals module — auto-extract funding amounts and company names from TechCrunch/HN articles instead of regex patterns
- Zero training required, works immediately

**Where it plugs in:** Enricher module, signals/news_monitor, and collection item enrichment.

### 14e. DBSCAN Clustering — Company Grouping

**Problem:** Companies scraped from 10+ sources have no automatic grouping. Users can't easily see patterns like "these 12 companies are all Series A fintech in East Africa."

**Implementation:**
- TF-IDF on company descriptions → DBSCAN clustering (scikit-learn)
- DBSCAN over K-Means because you don't know the number of clusters upfront
- Auto-label clusters by most common terms in each group
- Surface as a "Similar Companies" section on the Companies tab

**Where it plugs in:** Companies tab, potential new `/companies/clusters` endpoint.

### 14f. RAKE — Auto-Tagging via Keyword Extraction

**Problem:** Jobs and collection items have no auto-generated tags. The Job Feed filters are limited to pre-set toggles (remote/new/hot). Users can't filter by technology, skill, or domain.

**Implementation:**
- RAKE (Rapid Automatic Keyword Extraction) via `rake-nltk`
- Extract 3-5 most distinctive keywords from each job description or collection item
- Store as a `tags` array on the item
- Power dynamic tag filters in Job Feed and Collection detail views
- Tiny library, no model training, runs in milliseconds

**Where it plugs in:** Job ingest pipeline, collection item ingest, tag filter UI components.

---

### DS/ML Priority

| Priority | Item | Effort | Impact |
|----------|------|--------|--------|
| P1 | 14a. TF-IDF dedup + search | ~50 lines | Solves the empty `dedupKey` problem, better search |
| P1 | 14b. Z-score source health | ~20 lines | Makes health monitoring actually intelligent |
| P2 | 14f. RAKE auto-tagging | ~30 lines | Unlocks dynamic filtering across all tabs |
| P2 | 14c. Job classification | ~40 lines | Auto-categorization, needs some labeled data first |
| P3 | 14d. NER extraction | ~30 lines | Enriches signals + scraped content automatically |
| P3 | 14e. DBSCAN clustering | ~40 lines | Nice-to-have for company discovery |

---

## Priority Order

Roughly ordered by impact and dependency:

| Priority | Item | Why first |
|----------|------|-----------|
| P0 | 8. Docs alignment | 30 minutes, removes confusion for all other work |
| P0 | 1. Backend baseline | Everything else depends on this existing |
| P1 | 2. Replace dummy mutations | Makes the frontend actually functional |
| P1 | 3. Real auth | Security baseline before any deployment |
| P1 | 7. Data quality layer | Build dedup into the schema from day one, not retrofitted |
| P2 | 4. Scraper reliability | Bake into scraper code as you write it |
| P2 | 12. Scrape queue | Scraping without async processing will timeout |
| P2 | 5. Observability | Add run history table alongside scraper code |
| P2 | 11. Rate limiting | Add with backend, not after |
| P3 | 9. Frontend robustness | Polish that compounds over time |
| P3 | 10. Export + webhooks | Straightforward once backend + collections work |
| P3 | 13. Source health dashboard | Needs run history data (item 5) first |
| P3 | 6. Test coverage | Write tests as you build each backend module |
| P3 | 14a. TF-IDF dedup | Build into data quality layer (item 7) from day one |
| P3 | 14b. Z-score health | Build into source health (item 13) when run history exists |
| P4 | 14f. RAKE auto-tagging | After jobs/collections are flowing with real data |
| P4 | 14c. Job classification | Needs ~100+ labeled jobs to train on |
| P4 | 14d. NER extraction | After enricher/signals modules exist |
| P4 | 14e. DBSCAN clustering | After enough companies are scraped |
