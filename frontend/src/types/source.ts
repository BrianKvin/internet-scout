export const SOURCE_TYPES = [
  "job_board",
  "vc_portfolio",
  "government",
  "news",
  "directory",
  "regulatory",
  "environment",
  "research",
  "custom",
] as const;

export type SourceType = (typeof SOURCE_TYPES)[number];

export const SOURCE_STRATEGIES = [
  "yc",
  "generic_jobs",
  "generic_portfolio",
  "playwright_portfolio",
  "hn_hiring",
  "generic_table",
  "generic_list",
  "rss_feed",
  "pdf_extract",
  "playwright_spa",
  "api_json",
] as const;

export type SourceStrategy = (typeof SOURCE_STRATEGIES)[number];

export type SourceHealth = "ok" | "warning" | "dead";

export interface Source {
  id: string;
  name: string;
  url: string;
  type: SourceType;
  strategy: SourceStrategy;
  enabled: boolean;
  lastScraped: string | null;
  itemCount: number;
  health: SourceHealth;
  notes: string | null;
  lastSuccessAt: string | null;
  lastFailureAt: string | null;
  failureReason: string | null;
}

export interface SourceCreate {
  name: string;
  url: string;
  type: SourceType;
  strategy: SourceStrategy;
}
