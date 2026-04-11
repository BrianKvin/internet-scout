import type { SourceHealth } from "./source";

export interface DashboardStats {
  itemsCollected: number;
  activeSources: number;
  collections: number;
  scrapeRuns: number;
}

export interface SourcePerformance {
  sourceId: string;
  sourceName: string;
  itemsPerRun: number[];
  lastRunItems: number;
  healthHistory: SourceHealth[];
}
