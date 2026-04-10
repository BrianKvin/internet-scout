# Startscout Frontend Implementation Plan

## Context

Building the frontend for Startscout — a general-purpose web scraping platform (starting as a startup job-hunting tool). The goal is to build all UI surfaces for phases 1-3 (free features) with dummy data in a central location, making it trivial to swap in real API calls later. Phase 4 (AI) and Phase 5 (paid APIs) UI shells will be included but without functional integrations.

The UI follows the screenshot inspiration: clean, minimal, tab-based dashboard with stats bar, filter pills, and list/card layouts.

---

## Tech Stack

| Tool | Why |
|---|---|
| **Next.js 15** (App Router, TypeScript) | Spec requirement, server components for shell |
| **TanStack Query v5** | User-requested, better mutation/optimistic update support than SWR |
| **shadcn/ui** + Tailwind CSS v4 | Ownable component primitives, matches the minimal aesthetic |
| **@dnd-kit/core + sortable** | Pipeline kanban drag-and-drop |
| **React Hook Form + Zod** | Source form, studio form, notification settings |
| **Recharts** | Stats charts (source performance, application funnel) |
| **Lucide React** | Icons (bundled with shadcn) |
| **papaparse** | Client-side CSV export |

### Full Package List

```
next@15, react@19, typescript
@tanstack/react-query@5, @tanstack/react-query-devtools
@dnd-kit/core@6, @dnd-kit/sortable@8
tailwindcss@4, class-variance-authority, clsx, tailwind-merge
react-hook-form, @hookform/resolvers, zod
lucide-react
papaparse (CSV export)
recharts (stats charts)
```

---

## Data Layer Architecture (3 layers)

```
Components → Hooks (TanStack Query) → Services → Data files (swap point)
```

- **`data/`** — typed dummy data arrays (8 jobs, 8 companies, 10 sources, 3 pipeline items, etc.)
- **`services/`** — async functions that import from `data/`, filter/mutate locally. **This is the only layer that changes when the backend is ready** — swap `import from data` with `api.get("/jobs")`
- **`hooks/`** — TanStack Query wrappers (`useQuery` + `useMutation` with optimistic updates). Never change.

### How the swap works

```
DUMMY DATA PHASE:
  services/jobs.service.ts → imports from data/jobs.ts → filters locally → returns Promise<Job[]>

BACKEND PHASE:
  services/jobs.service.ts → calls api.get<Job[]>("/jobs", { params }) → returns Promise<Job[]>
```

Hooks, components, types — nothing else changes.

---

## Project Structure

All paths relative to `internet-scout/frontend/`:

```
frontend/
│
├── app/
│   ├── layout.tsx              — QueryProvider, fonts, metadata
│   ├── page.tsx                — Dashboard: stats bar + tab router (single-page, no routes)
│   └── globals.css             — Tailwind base + shadcn CSS variables
│
├── components/
│   ├── ui/                     — shadcn primitives (auto-generated)
│   │   ├── badge.tsx
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── input.tsx
│   │   ├── select.tsx
│   │   ├── sheet.tsx
│   │   ├── skeleton.tsx
│   │   ├── switch.tsx
│   │   ├── table.tsx
│   │   ├── tabs.tsx
│   │   └── toast.tsx
│   │
│   ├── layout/
│   │   ├── stats-bar.tsx       — Top stats: jobs found, companies, saved, applied
│   │   └── tab-navigation.tsx  — Tab switcher (Job feed, Companies, Pipeline...)
│   │
│   ├── jobs/
│   │   ├── job-feed.tsx        — Search + filters + job list container
│   │   ├── job-card.tsx        — Single job row: title, company, badges, save btn
│   │   ├── job-search.tsx      — Debounced search input
│   │   ├── source-filter.tsx   — Source pill toggles (YC, Sequoia, Pear...)
│   │   └── tag-filter.tsx      — Tag pills (remote, new, hot)
│   │
│   ├── companies/
│   │   ├── company-grid.tsx    — Company cards grid container
│   │   ├── company-card.tsx    — Single company card with signal badges
│   │   └── signal-badge.tsx    — News mention / funding badge
│   │
│   ├── pipeline/
│   │   ├── pipeline-board.tsx  — Kanban board container with DnD context
│   │   ├── pipeline-column.tsx — Single stage column (droppable)
│   │   └── pipeline-card.tsx   — Draggable job card within pipeline
│   │
│   ├── sources/
│   │   ├── sources-manager.tsx — Source list + add form container
│   │   ├── source-row.tsx      — Single source with toggle, scrape, delete
│   │   ├── source-form.tsx     — Add/edit source dialog (RHF + Zod)
│   │   └── health-indicator.tsx— Green/yellow/red status dot
│   │
│   ├── studio/
│   │   ├── scrape-studio.tsx   — Studio container: form + preview
│   │   ├── instruction-form.tsx— Name + URL + strategy picker
│   │   ├── schedule-picker.tsx — Daily / weekly / manual selector
│   │   ├── item-preview.tsx    — First 5 results preview table
│   │   └── collection-picker.tsx— Select or create a collection
│   │
│   ├── collections/
│   │   ├── collection-browser.tsx — Collection cards grid
│   │   ├── collection-card.tsx    — Single collection summary card
│   │   ├── collection-detail.tsx  — Paginated item table + search + export
│   │   └── export-button.tsx      — CSV / JSON download trigger
│   │
│   ├── stats/
│   │   ├── stats-dashboard.tsx    — Stats tab container
│   │   ├── source-performance.tsx — Items per source chart (recharts)
│   │   └── application-funnel.tsx — Applied → interview → offer funnel
│   │
│   └── notifications/
│       ├── notification-settings.tsx — Digest + Slack webhook config
│       └── digest-preview.tsx       — Preview of what the digest looks like
│
├── data/                       — Dummy data (THE SWAP POINT)
│   ├── jobs.ts                 — 8 dummy jobs
│   ├── companies.ts            — 8 dummy companies
│   ├── pipeline.ts             — 3 dummy pipeline items
│   ├── sources.ts              — 10 seed sources (from spec)
│   ├── collections.ts          — 2-3 collections with items
│   ├── signals.ts              — News signals for a few companies
│   ├── scrape-jobs.ts          — Dummy scrape jobs
│   └── stats.ts                — Dummy analytics data
│
├── services/                   — Async functions wrapping data access
│   ├── api.ts                  — Base fetch wrapper (ready for backend)
│   ├── jobs.service.ts
│   ├── companies.service.ts
│   ├── pipeline.service.ts
│   ├── sources.service.ts
│   ├── collections.service.ts
│   ├── studio.service.ts
│   ├── signals.service.ts
│   ├── stats.service.ts
│   └── notifications.service.ts
│
├── hooks/                      — TanStack Query wrappers
│   ├── use-jobs.ts
│   ├── use-companies.ts
│   ├── use-pipeline.ts         — Includes DnD stage mutation
│   ├── use-sources.ts          — Includes CRUD + toggle mutations
│   ├── use-collections.ts
│   ├── use-studio.ts
│   ├── use-signals.ts
│   ├── use-stats.ts
│   └── use-notifications.ts
│
├── types/                      — TypeScript interfaces
│   ├── job.ts
│   ├── company.ts
│   ├── pipeline.ts
│   ├── source.ts
│   ├── collection.ts
│   ├── scrape-job.ts
│   ├── signal.ts
│   ├── stats.ts
│   └── notification.ts
│
├── lib/
│   ├── utils.ts                — cn() utility, formatters
│   ├── query-client.ts         — QueryClient config (staleTime, gcTime)
│   └── constants.ts            — Pipeline stages, source types, strategies
│
├── providers/
│   └── query-provider.tsx      — QueryClientProvider wrapper
│
├── tailwind.config.ts
├── tsconfig.json
├── next.config.ts
├── package.json
└── components.json             — shadcn/ui config
```

---

## Type Definitions

### `types/job.ts`
```typescript
export interface Job {
  id: string;
  title: string;
  company: string;
  companyId: string;
  sourceId: string;
  dedupKey?: string;
  location: string | null;
  salary: string | null;
  description: string | null;
  applyUrl: string;
  sector: string | null;
  stage: string | null;         // "Series A", "Seed", etc.
  isNew: boolean;
  isRemote: boolean;
  savedAt: string | null;       // ISO timestamp or null
  scrapedAt: string;
}

export interface JobFilters {
  search?: string;
  source?: string;
  tag?: string;                 // "remote" | "new" | "hot"
}
```

### `types/company.ts`
```typescript
export interface Company {
  id: string;
  name: string;
  domain: string | null;
  website: string | null;
  careersUrl: string | null;
  sourceId: string;
  sector: string | null;
  stage: string | null;
  enriched: boolean;
  enrichedAt: string | null;
  createdAt: string;
}
```

### `types/pipeline.ts`
```typescript
export const PIPELINE_STAGES = [
  "discovered", "researched", "applied",
  "interviewing", "offer", "rejected"
] as const;

export type PipelineStage = (typeof PIPELINE_STAGES)[number];

export interface PipelineItem {
  id: string;
  jobId: string;
  job: Job;                     // denormalized for display
  stage: PipelineStage;
  notes: string | null;
  appliedAt: string | null;
  updatedAt: string;
}
```

### `types/source.ts`
```typescript
export type SourceType = "job_board" | "vc_portfolio";
export type SourceStrategy = "yc" | "generic_jobs" | "generic_portfolio" | "playwright_portfolio" | "hn_hiring";
export type SourceHealth = "ok" | "warning" | "dead";

export interface Source {
  id: string;
  name: string;
  url: string;
  type: SourceType;
  strategy: SourceStrategy;
  enabled: boolean;
  lastScraped: string | null;
  jobCount: number;
  health: SourceHealth;
  notes: string | null;
}

export interface SourceCreate {
  name: string;
  url: string;
  type: SourceType;
  strategy: SourceStrategy;
}
```

### `types/collection.ts`
```typescript
export interface Collection {
  id: string;
  name: string;
  description: string | null;
  category: string | null;      // "jobs" | "finance" | "real_estate" | "custom"
  itemCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CollectionItem {
  id: string;
  collectionId: string;
  scrapeJobId: string | null;
  data: Record<string, unknown>; // schema-free JSON
  isNew: boolean;
  scrapedAt: string;
}
```

### `types/scrape-job.ts`
```typescript
export interface ScrapeJob {
  id: string;
  name: string;
  url: string;
  instructions: string;
  config: Record<string, unknown>;
  collectionId: string;
  schedule: "daily" | "weekly" | "manual";
  notify: boolean;
  lastRun: string | null;
  lastCount: number;
  health: SourceHealth;
  createdAt: string;
}

export interface ScrapeJobCreate {
  name: string;
  url: string;
  instructions: string;
  collectionName: string;
  schedule: "daily" | "weekly" | "manual";
  notify: boolean;
}
```

### `types/signal.ts`
```typescript
export type SignalType = "funding_round" | "news" | "hiring_surge" | "github_activity";

export interface Signal {
  id: string;
  companyId: string;
  type: SignalType;
  title: string;
  detail: string | null;
  amount: string | null;        // e.g. "$12M Series A"
  sourceUrl: string | null;
  detectedAt: string;
}
```

### `types/stats.ts`
```typescript
export interface DashboardStats {
  jobsFound: number;
  companiesTracked: number;
  savedRoles: number;
  appliedActive: number;
}

export interface SourcePerformance {
  sourceId: string;
  sourceName: string;
  itemsPerRun: number[];
  lastRunItems: number;
  healthHistory: SourceHealth[];
}

export interface FunnelStats {
  discovered: number;
  researched: number;
  applied: number;
  interviewing: number;
  offer: number;
  rejected: number;
}
```

### `types/notification.ts`
```typescript
export interface NotificationSettings {
  digestEnabled: boolean;
  digestEmail: string;
  digestTime: string;           // "07:00"
  slackWebhookUrl: string | null;
  slackEnabled: boolean;
}
```

---

## Implementation Steps

### Step 1: Scaffold + Config

```bash
cd internet-scout
npx create-next-app@latest frontend --typescript --tailwind --app
cd frontend
npx shadcn@latest init    # New York style, zinc palette
```

Install dependencies:
```bash
npm install @tanstack/react-query @tanstack/react-query-devtools \
  @dnd-kit/core @dnd-kit/sortable \
  react-hook-form @hookform/resolvers zod \
  recharts papaparse lucide-react
```

Add shadcn components:
```bash
npx shadcn@latest add badge button card dialog dropdown-menu \
  input select table tabs toast skeleton switch separator
```

Create folder structure, `providers/query-provider.tsx`, `lib/utils.ts`, `lib/constants.ts`, `lib/query-client.ts`.

---

### Step 2: Types

Create all TypeScript interfaces in `types/` as defined above:
- `job.ts` — Job, JobFilters
- `company.ts` — Company
- `pipeline.ts` — PipelineItem, PipelineStage, PIPELINE_STAGES
- `source.ts` — Source, SourceCreate, SourceHealth, SourceStrategy, SourceType
- `collection.ts` — Collection, CollectionItem
- `scrape-job.ts` — ScrapeJob, ScrapeJobCreate
- `signal.ts` — Signal, SignalType
- `stats.ts` — DashboardStats, SourcePerformance, FunnelStats
- `notification.ts` — NotificationSettings

---

### Step 3: Dummy Data

Create all `data/*.ts` files with realistic data:
- **`jobs.ts`** — 8 jobs across YC, Sequoia, Pear sources (matching screenshot numbers)
- **`companies.ts`** — 8 companies with varied sectors and stages
- **`pipeline.ts`** — 3 pipeline items (matching "Applied/active: 3")
- **`sources.ts`** — 10 seed sources from spec's SQL INSERT (YC, Sequoia, Pear, Wellfound, a16z, Lightspeed, Accel, GV, HN, Remote OK)
- **`collections.ts`** — 2-3 collections (Kenya Finance Directory, East Africa VC Firms) with 5-10 items each
- **`signals.ts`** — News signals for 2-3 companies
- **`scrape-jobs.ts`** — 2-3 scrape job configs
- **`stats.ts`** — Dashboard stats, source performance, funnel data

---

### Step 4: Services + Hooks

**Services** (`services/*.service.ts`):
Each file imports from `data/`, applies local filtering/mutation, returns Promises.

Example pattern:
```typescript
// services/jobs.service.ts
import { DUMMY_JOBS } from "@/data/jobs";
import type { Job, JobFilters } from "@/types/job";

export async function getJobs(filters?: JobFilters): Promise<Job[]> {
  let jobs = [...DUMMY_JOBS];
  if (filters?.search) {
    const q = filters.search.toLowerCase();
    jobs = jobs.filter(j =>
      j.title.toLowerCase().includes(q) || j.company.toLowerCase().includes(q)
    );
  }
  if (filters?.source && filters.source !== "all") {
    jobs = jobs.filter(j => j.sourceId === filters.source);
  }
  return jobs;
}

export async function saveJob(id: string): Promise<Job> {
  const job = DUMMY_JOBS.find(j => j.id === id);
  if (!job) throw new Error("Job not found");
  job.savedAt = job.savedAt ? null : new Date().toISOString();
  return { ...job };
}
```

**`services/api.ts`** — base fetch wrapper (ready for backend but unused in dummy phase):
```typescript
const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${path}`);
  return res.json();
}
```

**Hooks** (`hooks/use-*.ts`):
Each wraps a service with TanStack Query.

Example pattern:
```typescript
// hooks/use-jobs.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getJobs, saveJob } from "@/services/jobs.service";
import type { JobFilters } from "@/types/job";

export function useJobs(filters?: JobFilters) {
  return useQuery({
    queryKey: ["jobs", filters],
    queryFn: () => getJobs(filters),
  });
}

export function useSaveJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => saveJob(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
  });
}
```

---

### Step 5: Layout Shell

- **`app/layout.tsx`** — Wrap with QueryProvider, set font (Inter), metadata
- **`app/page.tsx`** — Dashboard container with stats bar + controlled tab navigation using shadcn Tabs
- **`components/layout/stats-bar.tsx`** — 4 stat cards: Jobs found, Companies tracked, Saved roles, Applied/active
- **`components/layout/tab-navigation.tsx`** — Tab switcher for all 7 tabs

The dashboard is a **single-page app** — all tabs live in `page.tsx`, no separate routes. Active tab tracked in state, optionally synced to URL query param (`?tab=pipeline`).

---

### Step 6: Job Feed Tab

The primary tab (most complex list view):
- **`job-feed.tsx`** — Container wiring search + filters + job list
- **`job-search.tsx`** — Debounced search input (300ms)
- **`source-filter.tsx`** — Pill buttons for each source (data-driven from `useSources()`) + "All sources"
- **`tag-filter.tsx`** — Remote / New / Hot toggle pills
- **`job-card.tsx`** — Row showing: title, company, location, salary range, source badge (colored: YC green, SEQ gray, PEAR coral), remote badge, fit %, SAVE button, series stage

Save button triggers `useSaveJob()` mutation with optimistic update.

---

### Step 7: Companies Tab

- **`company-grid.tsx`** — Responsive card grid with search
- **`company-card.tsx`** — Name, domain, sector, stage, careers URL link, enrichment status, signal badges
- **`signal-badge.tsx`** — Colored badge for news mentions (type-specific: funding=green, news=blue, hiring=orange)

---

### Step 8: Pipeline Tab (Kanban)

- **`pipeline-board.tsx`** — `DndContext` + `SortableContext` wrapping 6 columns
- **`pipeline-column.tsx`** — Droppable column with stage name header + item count
- **`pipeline-card.tsx`** — Draggable card showing job title, company, applied date

`onDragEnd` calls `useUpdateStage()` mutation → updates dummy data → invalidates pipeline + stats queries. Uses optimistic updates for instant visual feedback.

6 stages: `discovered → researched → applied → interviewing → offer → rejected`

---

### Step 9: Sources Tab

- **`sources-manager.tsx`** — Source list table + "Add source" button
- **`source-row.tsx`** — Name, URL, type, strategy, enabled toggle (shadcn Switch), "Scrape now" button, health dot, delete button
- **`source-form.tsx`** — Dialog with React Hook Form + Zod validation: name (required), URL (required, valid URL), type (job_board/vc_portfolio), strategy (dropdown from STRATEGY_MAP keys)
- **`health-indicator.tsx`** — Colored dot: green=ok, yellow=warning, red=dead

---

### Step 10: Scrape Studio Tab

- **`scrape-studio.tsx`** — Two-panel layout: form on left, preview on right
- **`instruction-form.tsx`** — Name, URL, strategy picker (dropdown — AI instruction interpreter is Phase 4)
- **`schedule-picker.tsx`** — Radio group: daily / weekly / manual
- **`collection-picker.tsx`** — Select existing collection or type a new name
- **`item-preview.tsx`** — Table showing 5 dummy preview results after "Preview" button click

---

### Step 11: Collections Tab

- **`collection-browser.tsx`** — Grid of collection cards, click to drill into detail
- **`collection-card.tsx`** — Name, category badge, item count, last updated
- **`collection-detail.tsx`** — Full paginated table with search, back button
- **`export-button.tsx`** — Dropdown: CSV / JSON, triggers client-side generation via papaparse

---

### Step 12: Stats Tab

- **`stats-dashboard.tsx`** — Grid of chart cards
- **`source-performance.tsx`** — Bar chart (recharts) showing items scraped per source
- **`application-funnel.tsx`** — Funnel/bar chart: discovered → researched → applied → interviewing → offer/rejected

---

### Step 13: Notifications

- **`notification-settings.tsx`** — Form: digest enabled toggle, digest email, digest time, Slack webhook URL, Slack enabled toggle
- **`digest-preview.tsx`** — Static preview of a sample daily digest email

---

### Step 14: Polish

- Loading skeletons using shadcn Skeleton for each tab
- Empty states with illustrations/messages for each tab
- Toast notifications for actions (saved, source added, stage updated, exported)
- Mobile responsive breakpoints for all tabs
- Tab state synced to URL query param (`?tab=pipeline`)
- Keyboard shortcut: `/` to focus search

---

## Key Architectural Decisions

1. **Single-page tab-based dashboard** — no separate routes. shadcn Tabs with controlled state. URL query param tracks active tab for shareability.

2. **All tabs are client components** — every tab needs interactivity (search, filter, drag, toggle). Root layout is a server component.

3. **Source filter pills are data-driven** — read from `useSources()`, not hardcoded. New sources added via Sources tab automatically appear as filter options.

4. **Optimistic updates for all mutations** — saves, toggles, stage drags update UI instantly via `queryClient.setQueryData`. `onError` rolls back. Works identically with dummy data and real APIs.

5. **Debounced search** — 300ms debounce before updating the TanStack Query key. Prevents excessive re-renders on fast typing.

6. **`services/api.ts` created from day 1** — establishes the fetch wrapper contract. When backend is ready, services swap from importing `data/` to calling `api.get()`.

---

## Verification Checklist

- [ ] `npm run dev` — app loads at localhost:3000
- [ ] Job feed: search filters jobs, source pills filter by source, save button toggles
- [ ] Companies: cards display with signal badges
- [ ] Pipeline: drag a card between columns, stage updates persist
- [ ] Sources: add a source via form, toggle enabled, see health indicator
- [ ] Studio: fill form, click preview, see dummy items
- [ ] Collections: browse cards, click into detail, search items, export CSV
- [ ] Stats: charts render with dummy data
- [ ] `npm run build` — no TypeScript errors, clean production build
