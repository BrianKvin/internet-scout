# Backend Review & Upgrade Plan

Senior-level review of the Internet Scout backend. Every issue is categorized by severity, with exact file paths, what's wrong, and what the fix looks like. The upgrade plan at the bottom is ordered by priority.

---

## Blocking Bugs

### BUG-1: Playwright import typo — crashes at runtime

**File:** `backend/scrapers/strategies/playwright_portfolio.py:28`

```python
# BROKEN
from playwroplaywright.async_api import async_playwright

# FIX
from playwright.async_api import async_playwright
```

### BUG-2: `scrape_source` injects `BackgroundTasks` but runs synchronously

**File:** `backend/routers/scrape.py:51`

The `background_tasks` parameter is accepted but never used. The scrape blocks the HTTP response for 30+ seconds on slow sites.

**Fix:** Either use `background_tasks.add_task(_run_source, source, db)` and return a task ID, or remove the parameter and document that it's synchronous.

### BUG-3: Double-commit on every request

**File:** `backend/db/session.py:27-37` (auto-commits) + `backend/routers/scrape.py:45`, `backend/routers/studio.py:97` (manual commits)

`get_db()` auto-commits on success, but multiple routers also call `db.commit()` manually. Pick one pattern: remove auto-commit from `get_db()` and let routers own their transactions.

### BUG-4: Studio preview endpoint has wrong parameter binding

**File:** `backend/routers/studio.py:69-73`

```python
# BROKEN — config: dict can't be parsed from query string
async def preview(url: str, config: dict, limit: int = Query(5)):

# FIX
from fastapi import Body
async def preview(url: str = Query(...), limit: int = Query(5), config: dict = Body(default={})):
```

### BUG-5: Source type mismatch between frontend and backend

Frontend sends `"job_board"`, `"vc_portfolio"`, `"government"`, etc. Backend defaults to `"jobs"` in `routers/sources.py:15` and checks `source.type in ("jobs", "hn")` in `routers/scrape.py:23`. These never match. Align to the frontend enum values.

### BUG-6: Retry logic retries client errors (403, 404)

**File:** `backend/scrapers/base.py:107-113`

```python
# BROKEN — retries 400, 401, 403, 404 which just gets you banned faster
retry=retry_if_exception_type((httpx.TimeoutException, httpx.ConnectError, httpx.HTTPStatusError))

# FIX — only retry transient errors
def _is_retryable(exc):
    if isinstance(exc, (httpx.TimeoutException, httpx.ConnectError)):
        return True
    if isinstance(exc, httpx.HTTPStatusError):
        return exc.response.status_code in (429, 500, 502, 503, 504)
    return False

retry=retry_if_exception(_is_retryable)
```

---

## Security Issues

### SEC-1: No authentication on any endpoint except `/auth/me`

**Severity:** Critical

Every router (sources, scrape, studio, collections, export, stats) is fully public. Anyone can create/delete sources, trigger scrapes, export data.

**Fix:** Create a `get_current_user` dependency and apply it to all protected routers.

```python
# backend/dependencies.py
from fastapi import Depends, Header, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from db.session import get_db
from db import auth as auth_db
from utils.auth_security import verify_token
from models.user import User

async def get_current_user(
    authorization: str | None = Header(default=None),
    db: AsyncSession = Depends(get_db),
) -> User:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "Missing or invalid authorization header")
    token = authorization.removeprefix("Bearer ").strip()
    payload = verify_token(token)
    if not payload:
        raise HTTPException(401, "Invalid or expired token")
    user = await auth_db.get_user_by_id(db, payload["sub"])
    if not user:
        raise HTTPException(401, "User not found")
    return user
```

Then on each router:
```python
router = APIRouter(prefix="/sources", tags=["sources"], dependencies=[Depends(get_current_user)])
```

### SEC-2: Hardcoded superuser credentials in source code

**File:** `backend/main.py:18-20`

```python
DEFAULT_SUPERUSER_EMAIL = "vistracraft@gmail.com"
DEFAULT_SUPERUSER_PASSWORD = "Somepass123!"
```

Real email + guessable password committed to git. Move to env vars. Don't seed in production.

### SEC-3: AUTH_SECRET defaults to a known string

**File:** `backend/config.py:11`

`AUTH_SECRET: str = "dev-only-change-me"` — if deployed without setting this env var, all tokens are signed with a publicly known secret. Add a startup guard:

```python
if settings.ENV == "production" and settings.AUTH_SECRET == "dev-only-change-me":
    raise RuntimeError("AUTH_SECRET must be set in production")
```

### SEC-4: No SSRF protection on user-provided URLs

**File:** `backend/routers/scrape.py:50-57`

User-submitted URLs are passed directly to httpx/Playwright. An attacker could scrape internal services (`http://169.254.169.254/latest/meta-data/`, `http://localhost:5432`).

**Fix:** Validate URLs against private IP ranges and internal hostnames before scraping.

### SEC-5: `/sources/seed` endpoint is unauthenticated

**File:** `backend/routers/sources.py:42-46`

Anyone can call `POST /sources/seed` to inject default sources.

### SEC-6: Raw exception strings leaked to client

**File:** `backend/routers/scrape.py:70`

`str(exc)` can expose file paths, database connection strings, internal state. Log full errors server-side, return generic messages to client.

---

## Architecture & Design Issues

### ARCH-1: No response models — raw SQLAlchemy objects returned

No router uses `response_model`. This means: no OpenAPI schema for responses, risk of leaking internal fields, no API contract enforcement.

**Fix:** Create Pydantic `Out` schemas in `backend/schemas/` for every model:

```python
# schemas/source.py
class SourceOut(BaseModel):
    id: str
    name: str
    url: str
    type: str
    strategy: str
    enabled: bool
    last_scraped: datetime | None
    item_count: int
    health: str

    model_config = ConfigDict(from_attributes=True)
```

```python
@router.get("/", response_model=list[SourceOut])
async def list_sources(db: AsyncSession = Depends(get_db)):
```

### ARCH-2: No multi-tenancy — all data is shared globally

Models have no `user_id` foreign key. Every source, job, collection is visible to every user. Retrofitting multi-tenancy later is painful.

**Fix:** Add `user_id: Mapped[str] = mapped_column(ForeignKey("users.id"))` to Source, ScrapeJob, Collection, PipelineItem. Filter all queries by `user_id`.

### ARCH-3: Pydantic schemas defined inline in routers

Request models like `SourceCreate`, `ScrapeJobCreate`, `SignUpRequest` are defined inside router files. This mixes HTTP concerns with data validation.

**Fix:** Move all schemas to `backend/schemas/`:
```
schemas/
  auth.py       # SignUpRequest, SignInRequest, UserOut, TokenResponse
  source.py     # SourceCreate, SourceOut
  studio.py     # ScrapeJobCreate, ScrapeJobOut, PreviewRequest
  collection.py # CollectionCreate, CollectionOut, CollectionItemOut
  activity.py   # ScrapeRunOut, ActivityStats
```

### ARCH-4: Magic strings everywhere — no enums

Source types, strategies, health status, pipeline stages, schedule types are all bare strings. Invalid values are silently accepted.

**Fix:** Define enums in `backend/schemas/enums.py`:
```python
from enum import Enum

class SourceType(str, Enum):
    JOB_BOARD = "job_board"
    VC_PORTFOLIO = "vc_portfolio"
    GOVERNMENT = "government"
    NEWS = "news"
    DIRECTORY = "directory"
    REGULATORY = "regulatory"
    ENVIRONMENT = "environment"
    RESEARCH = "research"
    CUSTOM = "custom"

class SourceStrategy(str, Enum):
    YC = "yc"
    GENERIC_JOBS = "generic_jobs"
    GENERIC_TABLE = "generic_table"
    # ...

class SourceHealth(str, Enum):
    OK = "ok"
    WARNING = "warning"
    DEAD = "dead"
```

Use them in Pydantic schemas so invalid values are rejected at the API boundary.

### ARCH-5: Scrapes run synchronously in HTTP request cycle

**File:** `backend/routers/scrape.py:60-71`

`scrape_all` iterates all enabled sources sequentially inside the HTTP request. 20 sources at 30s timeout = 10-minute HTTP request.

**Fix:** Use FastAPI `BackgroundTasks` for single scrapes, and a task queue (ARQ or Celery) for `scrape_all`. Return a task ID and let the client poll for results.

### ARCH-6: Notification settings are in-memory

**File:** `backend/routers/notify.py:29`

`_settings = NotificationSettings()` resets on every restart and isn't user-scoped. Should be a database table linked to `user_id`.

### ARCH-7: Untyped dependencies in routers

All routers use `db=Depends(get_db)` without type annotations. Should be `db: AsyncSession = Depends(get_db)` for IDE support and type safety.

### ARCH-8: Health endpoint doesn't check dependencies

**File:** `backend/main.py:88-90`

`/health` returns `{"status": "healthy"}` without checking database or Redis connectivity.

**Fix:** Check DB (`SELECT 1`), Redis (`PING`), return 503 if any dependency is down.

### ARCH-9: Custom JWT instead of standard library

`python-jose` is in requirements.txt but unused. `auth_security.py` implements a 2-part token (`payload.signature`) instead of standard 3-part JWT (`header.payload.signature`). No JWT tooling (jwt.io, Postman, client libraries) can decode it.

**Fix:** Either use `python-jose` properly, or drop it from requirements and document that you use a custom signed token format.

### ARCH-10: No tests

Zero test files in the backend. Not even a `conftest.py`. Before this is portfolio-worthy, you need at minimum:

- Auth flow tests (sign up, sign in, token validation, expired token)
- CRUD tests (sources, collections, scrape jobs)
- Scraper tests (mock HTTP responses, verify parsing)
- Deduplicator tests (exact match, near-duplicate, edge cases)

---

## Scraping Library Issues

### SCRAPE-1: BeautifulSoup4 should be replaced with Parsel

BS4 is the introductory-level HTML parser. Parsel (Scrapy's parsing engine) is the industry standard for scraping:

- CSS selectors + XPath + regex in one API
- XPath can traverse up the DOM, filter by text content, chain conditions — things CSS cannot do
- Built specifically for scraping

**Every file affected:**
- `backend/scrapers/strategies/yc.py`
- `backend/scrapers/strategies/generic_jobs.py`
- `backend/scrapers/strategies/generic_portfolio.py`
- `backend/scrapers/strategies/playwright_portfolio.py`
- `backend/scrapers/strategies/hn_hiring.py`
- `backend/scrapers/executor.py`

### SCRAPE-2: Playwright launches a new browser per scrape

**File:** `backend/scrapers/strategies/playwright_portfolio.py:34-44`

Every call does `launch() → scrape → close()`. Browser cold start is 1-3 seconds.

**Fix:** Use a persistent browser with fresh contexts per scrape:

```python
_browser: Browser | None = None

async def _get_browser() -> Browser:
    global _browser
    if _browser is None or not _browser.is_connected():
        p = await async_playwright().start()
        _browser = await p.chromium.launch(headless=True)
    return _browser

async def scrape(url):
    browser = await _get_browser()
    context = await browser.new_context()
    page = await context.new_page()
    try:
        # scrape
    finally:
        await context.close()  # clean up context, keep browser alive
```

### SCRAPE-3: Playwright loads unnecessary resources

Every scrape downloads images, fonts, CSS, analytics, ads.

**Fix:** Block non-essential resources:

```python
async def _block_resources(route):
    if route.request.resource_type in ("image", "font", "stylesheet", "media"):
        await route.abort()
    else:
        await route.continue_()

await page.route("**/*", _block_resources)
```

Cuts page load time by 40-60%.

### SCRAPE-4: No stealth measures for Playwright

Sites with Cloudflare, DataDome, or basic bot detection will block vanilla Playwright instantly.

**Fix:** Add `playwright-stealth`:

```python
from playwright_stealth import stealth_async
page = await context.new_page()
await stealth_async(page)
```

### SCRAPE-5: No proxy support

15 rotating user agents but zero proxy rotation. After 10-20 requests from the same IP, most sites will rate-limit or block.

**Fix:** Add proxy configuration to `config.py` and pass to httpx/Playwright:

```python
# httpx
async with httpx.AsyncClient(proxy=settings.PROXY_URL) as client: ...

# Playwright
context = await browser.new_context(proxy={"server": settings.PROXY_URL})
```

### SCRAPE-6: No validation of scraped data

Raw dicts flow from scrapers → deduplicator → database unchecked. A scraper can return `{"title": None, "company": ""}` and it gets stored.

**Fix:** Validate with Pydantic before storing:

```python
class ScrapedJob(BaseModel):
    title: str = Field(min_length=2)
    company: str = Field(min_length=1)
    apply_url: str | None = None
    location: str | None = None

for raw in scraped_items:
    try:
        validated = ScrapedJob(**raw)
        results.append(validated.model_dump())
    except ValidationError:
        log.warning("invalid_scraped_item", raw=raw)
```

---

## Dependency Cleanup

### DEPS-1: Remove unused heavy dependencies

| Package | Size | Status |
|---------|------|--------|
| `spacy>=3.7.0` | ~500MB with models | Never imported |
| `rake-nltk>=1.0.6` | ~50MB | Never imported |
| `passlib[bcrypt]>=1.7.4` | ~5MB | Unused — custom PBKDF2 in auth_security.py |
| `python-jose[cryptography]>=3.3.0` | ~10MB | Unused — custom JWT in auth_security.py |
| `scikit-learn>=1.5.0` | ~30MB | Only used for TF-IDF dedup |
| `numpy>=1.26.0` | ~20MB | Only needed because of sklearn |

**Fix:** Remove spacy, rake-nltk, passlib, python-jose. Keep sklearn/numpy only if TF-IDF dedup stays. If hash-based dedup is sufficient, remove those too.

### DEPS-2: Add missing dependencies

```
parsel>=1.9.0                  # replaces beautifulsoup4
playwright-stealth>=1.0.6      # anti-detection for Playwright
```

---

## Upgrade Plan

Ordered by priority. Each phase is independently deployable.

### Phase 1: Fix Blocking Bugs (Day 1)

| ID | Task | Files |
|----|------|-------|
| BUG-1 | Fix Playwright import typo | `scrapers/strategies/playwright_portfolio.py` |
| BUG-3 | Remove auto-commit from `get_db`, let routers own transactions | `db/session.py`, all routers |
| BUG-4 | Fix studio preview parameter binding | `routers/studio.py` |
| BUG-5 | Align source types with frontend enum values | `routers/sources.py`, `routers/scrape.py`, `models/source.py` |
| BUG-6 | Fix retry to skip client errors (403, 404) | `scrapers/base.py` |
| DEPS-1 | Remove unused deps (spacy, rake-nltk, passlib, python-jose) | `requirements.txt` |

### Phase 2: Security Hardening (Day 2-3)

| ID | Task | Files |
|----|------|-------|
| SEC-1 | Create `get_current_user` dependency, protect all routes | New: `dependencies.py`. Update: all 13 routers |
| SEC-2 | Move superuser credentials to env vars | `main.py`, `config.py` |
| SEC-3 | Add AUTH_SECRET startup guard for production | `main.py` |
| SEC-4 | Add SSRF protection (validate URLs before scraping) | New: `utils/url_validator.py`. Update: `routers/scrape.py`, `routers/studio.py` |
| SEC-5 | Require auth on `/sources/seed` | `routers/sources.py` |
| SEC-6 | Sanitize error messages returned to client | `routers/scrape.py`, `routers/studio.py` |

### Phase 3: Type Safety & API Contracts (Day 4-5)

| ID | Task | Files |
|----|------|-------|
| ARCH-1 | Create Pydantic Out schemas, add `response_model` to all endpoints | New: `schemas/` directory (auth, source, studio, collection, activity, signal) |
| ARCH-3 | Move inline Pydantic models from routers to schemas | All routers → `schemas/` |
| ARCH-4 | Define enums for source types, strategies, health, stages | New: `schemas/enums.py`. Update: all schemas |
| ARCH-7 | Add `AsyncSession` type annotations to all router dependencies | All routers |

### Phase 4: Scraping Library Upgrade (Day 6-8)

| ID | Task | Files |
|----|------|-------|
| SCRAPE-1 | Replace BS4 with Parsel across all strategies | All files in `scrapers/strategies/`, `scrapers/executor.py`, `requirements.txt` |
| SCRAPE-2 | Implement persistent browser pool for Playwright | `scrapers/strategies/playwright_portfolio.py`, new: `scrapers/browser_pool.py` |
| SCRAPE-3 | Add resource blocking to Playwright scrapes | `scrapers/browser_pool.py` |
| SCRAPE-4 | Add playwright-stealth | `scrapers/browser_pool.py`, `requirements.txt` |
| SCRAPE-6 | Add Pydantic validation for scraped data | New: `schemas/scraped.py`. Update: all strategies |
| DEPS-2 | Add parsel, playwright-stealth to requirements | `requirements.txt` |
| BUG-2 | Make scrapes async with BackgroundTasks | `routers/scrape.py` |

### Phase 5: Architecture Improvements (Day 9-11)

| ID | Task | Files |
|----|------|-------|
| ARCH-2 | Add `user_id` to Source, ScrapeJob, Collection, PipelineItem. Filter all queries by user | All models, all db/ files, new Alembic migration |
| ARCH-5 | Move `scrape_all` to background task queue | `routers/scrape.py`, `tasks/scheduler.py` |
| ARCH-6 | Persist notification settings to database | New: `models/notification_settings.py`, `db/notifications.py`. Update: `routers/notify.py`, new migration |
| ARCH-8 | Health endpoint checks DB + Redis | `main.py` |
| ARCH-9 | Decide: use python-jose for standard JWT, or remove the dep and document custom format | `utils/auth_security.py`, `requirements.txt` |

### Phase 6: Testing (Day 12-15)

| Area | What to test | Target coverage |
|------|-------------|----------------|
| Auth | Sign up, sign in, token validation, expired token, duplicate email | 100% |
| CRUD | Sources, collections, scrape jobs — create, read, update, delete | 90% |
| Scrapers | Mock HTTP responses, verify parsing for each strategy | 80% |
| Deduplicator | Exact match, near-duplicate, empty input, single item | 100% |
| Pipeline | Step execution order, error propagation, context passing | 80% |
| API | Response schemas match, error codes correct, auth enforced | 90% |

**Setup:** pytest + pytest-asyncio + httpx (for TestClient) + factory-boy (for fixtures)

### Phase 7: Proxy & Stealth (When Scaling)

| ID | Task |
|----|------|
| SCRAPE-5 | Add proxy rotation support to httpx and Playwright |
| — | Add proxy pool configuration to `config.py` |
| — | Implement proxy health checking and rotation logic |

This phase is only needed when you're scraping sites that actively block (LinkedIn, Indeed, Glassdoor). For government sites, news RSS, and VC portfolios, the earlier phases are sufficient.

---

## File Structure After Upgrade

```
backend/
  dependencies.py              # NEW — get_current_user, get_db
  schemas/                     # NEW — all Pydantic models
    enums.py                   #   SourceType, SourceStrategy, SourceHealth, etc.
    auth.py                    #   SignUpRequest, UserOut, TokenResponse
    source.py                  #   SourceCreate, SourceOut
    studio.py                  #   ScrapeJobCreate, ScrapeJobOut
    collection.py              #   CollectionCreate, CollectionOut
    activity.py                #   ScrapeRunOut, ActivityStats
    signal.py                  #   SignalOut
    scraped.py                 #   ScrapedJob, ScrapedCompany (validation)
  scrapers/
    browser_pool.py            # NEW — persistent Playwright browser + stealth
  utils/
    url_validator.py           # NEW — SSRF protection
  tests/                       # NEW — pytest suite
    conftest.py
    test_auth.py
    test_sources.py
    test_scrapers.py
    test_dedup.py
```
