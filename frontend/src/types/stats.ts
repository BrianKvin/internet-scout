import type { SourceHealth } from "./source";

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
