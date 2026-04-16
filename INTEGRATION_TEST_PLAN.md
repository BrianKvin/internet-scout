# End-to-End Integration Test Plan

## Status
- ✅ Backend auth system implemented (User model, PBKDF2 hashing, HS256 JWT tokens)
- ✅ Backend analytics routers implemented (activity, stats)
- ✅ All frontend services converted to API calls
- ✅ Mappers layer created (snake_case → camelCase conversion)
- ✅ Auth provider wired to backend
- ✅ Linting validation passed (0 errors, 3 non-blocking warnings)
- ⏳ Ready for runtime testing

---

## Startup Instructions

### Prerequisites
- PostgreSQL running on `localhost:5432`
- Redis running on `localhost:6379`
- Environment variables set in `backend/.env`:
  ```
  DATABASE_URL=postgresql+asyncpg://postgres:password@localhost:5432/internet_scout
  AUTH_SECRET=your-secret-key-for-jwt-signing
  ```

### Terminal 1: Backend
```bash
cd backend

# Apply migrations (create users table and any pending migrations)
python -m alembic upgrade head

# Start the API server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Expected output:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete
```

### Terminal 2: Frontend
```bash
cd frontend

# Start Next.js dev server
npm run dev
```

Expected output:
```
- ready started server on 0.0.0.0:3000, url: http://localhost:3000
```

Open http://localhost:3000 in your browser.

---

## Test Scenarios

### 1. Authentication Flow
**Test**: User registration and login
- [ ] Navigate to `/sign-up`
- [ ] Enter email, name, password
- [ ] Click "Sign up"
- [ ] Verify:
  - Backend creates User record
  - Token returned and stored in localStorage
  - Redirect to `/dashboard`
  - User info displays in header/sidebar

**Test**: Session persistence
- [ ] Refresh page (F5)
- [ ] Verify:
  - Auth provider calls `/auth/me` on bootstrap
  - User remains authenticated
  - No redirect to login

**Test**: Sign in
- [ ] Navigate to `/sign-in`
- [ ] Enter registered email and password
- [ ] Verify:
  - Token saved
  - Redirects to `/dashboard`
  - User info displays correctly

**Test**: Error handling
- [ ] Try sign-up with existing email
- [ ] Verify: Error message displays (409 conflict)
- [ ] Try sign-in with wrong password
- [ ] Verify: Error message displays (401 unauthorized)

---

### 2. Source Management (Source Seeding)
**Test**: First load sources
- [ ] On `/dashboard` → Sources tab
- [ ] Verify:
  - GET `/sources` called
  - If table empty: auto-calls `/sources/seed` → returns default sources
  - Sources list displays (should show at least default sources)

**Test**: Create source
- [ ] Click "Add Source"
- [ ] Enter URL, select type, strategy
- [ ] Click "Save"
- [ ] Verify:
  - POST `/sources/` called
  - Source appears in list
  - No duplicate API call (request() auto-injects token)

**Test**: Toggle source on/off
- [ ] Click source toggle
- [ ] Verify: PATCH `/sources/{id}/toggle` called, status updates

**Test**: Delete source
- [ ] Click delete icon
- [ ] Verify: DELETE `/sources/{id}` called, source removed from list

---

### 3. Jobs Management
**Test**: Load jobs
- [ ] Navigate to Jobs tab
- [ ] Verify:
  - GET `/jobs` called (no filters initially)
  - Jobs list displays
  - Response mapped via mappers.ts (check browser DevTools: camelCase fields)

**Test**: Filter jobs
- [ ] Enter search term
- [ ] Select source filter, remote/new checkboxes
- [ ] Verify:
  - GET `/jobs?search=...&source_id=...&is_remote=...&is_new=...` called
  - Results update

**Test**: Save job
- [ ] Click save icon on a job
- [ ] Verify: PATCH `/jobs/{id}/save` called, button state toggles

---

### 4. Collections Management
**Test**: Load collections
- [ ] Navigate to Collections tab
- [ ] Verify: GET `/collections/` called, list displays

**Test**: Create collection
- [ ] Click "New Collection"
- [ ] Enter name, description, job limit
- [ ] Click "Create"
- [ ] Verify:
  - POST `/collections/` called
  - Collection appears in list
  - User can add items (via studio or manual selection)

**Test**: View collection items
- [ ] Click on a collection
- [ ] Verify:
  - GET `/collections/{id}/items?page=1` called
  - Items display with pagination/search working

---

### 5. Studio (Scraping)
**Test**: Launch studio
- [ ] Click "Studio" tab or "Create Job" flow
- [ ] Verify: GET `/studio/` called

**Test**: Preview scrape
- [ ] Enter URL, select strategy, configure settings
- [ ] Click "Preview"
- [ ] Verify: POST `/studio/preview` called, sample results displayed

**Test**: Execute scrape
- [ ] Click "Scrape & Save"
- [ ] Verify:
  - POST `/studio/` called with strategy in config
  - Job created or collection auto-created (if collection_name provided)
  - Redirect to activity/jobs tab

---

### 6. Analytics & Activity
**Test**: Dashboard stats
- [ ] Navigate to Dashboard tab (or Stats section)
- [ ] Verify:
  - GET `/stats/dashboard` called
  - Displays: items_collected, active_sources, collections count, scrape_runs

**Test**: Activity runs
- [ ] Navigate to Activity tab
- [ ] Verify:
  - GET `/activity/runs` called
  - Lists recent scrape jobs with source name, status, items
  - Filter by status/source works (calls GET with query params)

**Test**: Activity stats
- [ ] Scroll to stats section in Activity
- [ ] Verify: GET `/activity/stats` called, aggregates display

**Test**: Source performance
- [ ] View source performance chart
- [ ] Verify:
  - GET `/stats/source-performance` called
  - Returns per-source items_per_run arrays for trending

---

### 7. Discovery & Signals
**Test**: Discovery catalog
- [ ] Navigate to Discovery/Signals tab
- [ ] Verify:
  - Catalog filters display (getCatalogFilters works)
  - Dynamic getSources import detects "already added" sources

**Test**: Search signals
- [ ] Enter search query
- [ ] Verify: GET `/signals?company_id=...` called (if company filtered)

---

### 8. Notifications & Settings
**Test**: Notification settings
- [ ] Navigate to Settings → Notifications
- [ ] Verify: GET `/notify/settings` called, toggles display current state

**Test**: Update settings
- [ ] Toggle email/digest/slack preferences
- [ ] Click "Save"
- [ ] Verify: PATCH `/notify/settings` called, preferences persisted

---

### 9. Authorization & Token Injection
**Test**: All API calls include Authorization header
- [ ] Open browser DevTools → Network tab
- [ ] Perform any API action (load sources, create job, etc.)
- [ ] Click on request → Headers → Verify:
  ```
  Authorization: Bearer <jwt-token>
  ```

**Test**: Token expiration (optional, requires mocking)
- [ ] Manually clear localStorage
- [ ] Try API call
- [ ] Verify: Request fails (401 Unauthorized) or redirects to `/sign-in`

---

## Verification Checklist

### Backend
- [ ] `alembic upgrade head` runs without errors
- [ ] PostgreSQL migrations create `users` table
- [ ] `uvicorn main:app --reload` starts without import errors
- [ ] All routers loaded: `/auth`, `/activity`, `/stats`, `/sources`, `/jobs`, etc.
- [ ] FastAPI docs available at `http://localhost:8000/docs`

### Frontend
- [ ] `npm run lint` shows 0 errors (3 warnings acceptable)
- [ ] `npm run dev` starts without errors
- [ ] http://localhost:3000 loads sign-in page
- [ ] Browser DevTools → Application → localStorage has `token` after auth
- [ ] All API calls show correct endpoint + Authorization header

### Integration
- [ ] Auth flow works: sign-up → token stored → API calls succeed
- [ ] Source seeding works: First `/sources` call auto-seeds if table empty
- [ ] All 10 services call backend: sources, jobs, companies, collections, studio, stats, activity, signals, notifications, discovery
- [ ] Error handling works: 401 logout, 409 duplicate email, validation errors display
- [ ] Mappers convert responses correctly: DB snake_case → UI camelCase

---

## Debugging Tips

### If backend doesn't start:
```bash
# Check migrations
python -m alembic current
python -m alembic history

# Check Python syntax
python -m py_compile main.py models/user.py routers/auth.py

# Check Postgres connection
psql postgresql://postgres:password@localhost:5432/internet_scout
```

### If frontend API calls fail:
- Check DevTools Network tab for actual request URL + response
- Verify `/auth/me` returns user data (check bootstrap in auth-provider.tsx)
- Verify token in localStorage (`getAuthToken()` in api.ts)
- Check CORS headers if cross-origin issues

### If "Cannot find module" errors:
```bash
# Rebuild frontend types
npm run build

# Check imports in modified files
grep -r "import.*mappers" src/services/
```

---

## Expected API Response Mapping (Mappers)

Example: `/sources` returns:
```json
{
  "id": 1,
  "user_id": 123,
  "url": "https://example.com",
  "source_type": "RSS",
  "is_active": true,
  "scrape_strategy": "BeautifulSoup",
  "created_at": "2025-04-15T..."
}
```

Mappers convert to:
```json
{
  "id": 1,
  "userId": 123,
  "url": "https://example.com",
  "sourceType": "RSS",
  "isActive": true,
  "scrapeStrategy": "BeautifulSoup",
  "createdAt": "2025-04-15T..."
}
```

---

## Notes
- Source seeding preserved: First `GET /sources` auto-calls `/sources/seed` if table empty
- All tokens use HS256 signing with 7-day TTL
- Passwords hashed with PBKDF2 (120k iterations)
- React Hook Form warnings are library incompatibility (non-blocking)
- Use `#github-pull-request_copilot-coding-agent` when ready for async implementation tasks
