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
