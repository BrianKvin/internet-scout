export type RunStatus = "success" | "partial" | "failed" | "running";

export interface ScrapeRun {
  id: string;
  sourceId: string;
  sourceName: string;
  status: RunStatus;
  itemsFound: number;
  itemsNew: number;
  itemsDeduped: number;
  durationMs: number;
  errorMessage: string | null;
  startedAt: string;
  finishedAt: string | null;
}

export interface ActivityStats {
  totalRuns: number;
  successRate: number;
  itemsCollectedToday: number;
  activeSourceCount: number;
}
