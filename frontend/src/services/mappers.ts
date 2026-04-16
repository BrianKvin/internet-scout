import type { Source } from "@/types/source";
import type { Job } from "@/types/job";
import type { Company } from "@/types/company";
import type { Collection, CollectionItem } from "@/types/collection";
import type { ScrapeJob } from "@/types/scrape-job";
import type { ScrapeRun, ActivityStats } from "@/types/activity";
import type { DashboardStats, SourcePerformance } from "@/types/stats";
import type { Signal } from "@/types/signal";

export interface ApiSource {
  id: string;
  name: string;
  url: string;
  type: Source["type"];
  strategy: Source["strategy"];
  enabled: boolean;
  last_scraped: string | null;
  job_count: number;
  health: Source["health"];
  notes: string | null;
}

export interface ApiJob {
  id: string;
  title: string;
  company: string;
  company_id: string | null;
  source_id: string | null;
  dedup_key: string | null;
  location: string | null;
  salary: string | null;
  description: string | null;
  apply_url: string;
  sector: string | null;
  stage: string | null;
  is_new: boolean;
  is_remote: boolean;
  saved_at: string | null;
  scraped_at: string;
}

export interface ApiCompany {
  id: string;
  name: string;
  domain: string | null;
  website: string | null;
  careers_url: string | null;
  source_id: string | null;
  sector: string | null;
  stage: string | null;
  enriched: boolean;
  enriched_at: string | null;
  created_at: string;
}

export interface ApiCollection {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  item_count: number;
  created_at: string;
  updated_at: string;
}

export interface ApiCollectionItem {
  id: string;
  collection_id: string;
  scrape_job_id: string | null;
  data: Record<string, string | number | boolean | null>;
  is_new: boolean;
  scraped_at: string;
}

export interface ApiScrapeJob {
  id: string;
  name: string;
  source_id: string | null;
  url: string;
  instructions: string;
  keywords: string[] | null;
  config: Record<string, string | number | boolean | null>;
  collection_id: string | null;
  schedule: ScrapeJob["schedule"];
  notify: boolean;
  last_run: string | null;
  last_count: number;
  health: ScrapeJob["health"];
  created_at: string;
}

export interface ApiScrapeRun {
  id: string;
  source_id: string | null;
  source_name: string;
  status: ScrapeRun["status"];
  items_found: number;
  items_new: number;
  items_deduped: number;
  duration_ms: number;
  error_message: string | null;
  started_at: string;
  finished_at: string | null;
}

export interface ApiActivityStats {
  total_runs: number;
  success_rate: number;
  items_collected_today: number;
  active_source_count: number;
}

export interface ApiDashboardStats {
  items_collected: number;
  active_sources: number;
  collections: number;
  scrape_runs: number;
}

export interface ApiSourcePerformance {
  source_id: string;
  source_name: string;
  items_per_run: number[];
  last_run_items: number;
  health_history: SourcePerformance["healthHistory"];
}

export interface ApiSignal {
  id: string;
  company_id: string | null;
  type: Signal["type"];
  title: string;
  detail: string | null;
  amount: string | null;
  source_url: string | null;
  detected_at: string;
}

export function mapSource(source: ApiSource): Source {
  return {
    id: source.id,
    name: source.name,
    url: source.url,
    type: source.type,
    strategy: source.strategy,
    enabled: source.enabled,
    lastScraped: source.last_scraped,
    itemCount: source.job_count,
    health: source.health,
    notes: source.notes,
    lastSuccessAt: source.last_scraped,
    lastFailureAt: null,
    failureReason: null,
  };
}

export function mapJob(job: ApiJob): Job {
  return {
    id: job.id,
    title: job.title,
    company: job.company,
    companyId: job.company_id ?? "",
    sourceId: job.source_id ?? "unknown",
    dedupKey: job.dedup_key ?? "",
    location: job.location,
    salary: job.salary,
    description: job.description,
    applyUrl: job.apply_url,
    sector: job.sector,
    stage: job.stage,
    isNew: job.is_new,
    isRemote: job.is_remote,
    savedAt: job.saved_at,
    scrapedAt: job.scraped_at,
  };
}

export function mapCompany(company: ApiCompany): Company {
  return {
    id: company.id,
    name: company.name,
    domain: company.domain,
    website: company.website,
    careersUrl: company.careers_url,
    sourceId: company.source_id ?? "unknown",
    sector: company.sector,
    stage: company.stage,
    enriched: company.enriched,
    enrichedAt: company.enriched_at,
    createdAt: company.created_at,
  };
}

export function mapCollection(collection: ApiCollection): Collection {
  return {
    id: collection.id,
    name: collection.name,
    description: collection.description,
    category: collection.category,
    itemCount: collection.item_count,
    createdAt: collection.created_at,
    updatedAt: collection.updated_at,
  };
}

export function mapCollectionItem(item: ApiCollectionItem): CollectionItem {
  return {
    id: item.id,
    collectionId: item.collection_id,
    scrapeJobId: item.scrape_job_id,
    data: item.data,
    isNew: item.is_new,
    scrapedAt: item.scraped_at,
  };
}

export function mapScrapeJob(job: ApiScrapeJob): ScrapeJob {
  return {
    id: job.id,
    name: job.name,
    sourceId: job.source_id,
    url: job.url,
    instructions: job.instructions,
    keywords: job.keywords ?? [],
    config: job.config,
    collectionId: job.collection_id ?? "",
    schedule: job.schedule,
    notify: job.notify,
    lastRun: job.last_run,
    lastCount: job.last_count,
    health: job.health,
    createdAt: job.created_at,
  };
}

export function mapScrapeRun(run: ApiScrapeRun): ScrapeRun {
  return {
    id: run.id,
    sourceId: run.source_id ?? "unknown",
    sourceName: run.source_name,
    status: run.status,
    itemsFound: run.items_found,
    itemsNew: run.items_new,
    itemsDeduped: run.items_deduped,
    durationMs: run.duration_ms,
    errorMessage: run.error_message,
    startedAt: run.started_at,
    finishedAt: run.finished_at,
  };
}

export function mapActivityStats(stats: ApiActivityStats): ActivityStats {
  return {
    totalRuns: stats.total_runs,
    successRate: stats.success_rate,
    itemsCollectedToday: stats.items_collected_today,
    activeSourceCount: stats.active_source_count,
  };
}

export function mapDashboardStats(stats: ApiDashboardStats): DashboardStats {
  return {
    itemsCollected: stats.items_collected,
    activeSources: stats.active_sources,
    collections: stats.collections,
    scrapeRuns: stats.scrape_runs,
  };
}

export function mapSourcePerformance(row: ApiSourcePerformance): SourcePerformance {
  return {
    sourceId: row.source_id,
    sourceName: row.source_name,
    itemsPerRun: row.items_per_run,
    lastRunItems: row.last_run_items,
    healthHistory: row.health_history,
  };
}

export function mapSignal(signal: ApiSignal): Signal {
  return {
    id: signal.id,
    companyId: signal.company_id ?? "",
    type: signal.type,
    title: signal.title,
    detail: signal.detail,
    amount: signal.amount,
    sourceUrl: signal.source_url,
    detectedAt: signal.detected_at,
  };
}
