export type SourceType = "job_board" | "vc_portfolio";

export type SourceStrategy =
  | "yc"
  | "generic_jobs"
  | "generic_portfolio"
  | "playwright_portfolio"
  | "hn_hiring";

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
