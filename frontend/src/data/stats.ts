import type { DashboardStats, FunnelStats, SourcePerformance } from "@/types/stats";

export const DUMMY_DASHBOARD_STATS: DashboardStats = {
  jobsFound: 8,
  companiesTracked: 8,
  savedRoles: 0,
  appliedActive: 3,
};

export const DUMMY_SOURCE_PERFORMANCE: SourcePerformance[] = [
  {
    sourceId: "src_yc",
    sourceName: "Y Combinator",
    itemsPerRun: [12, 15, 8, 14, 11, 13, 10],
    lastRunItems: 3,
    healthHistory: ["ok", "ok", "ok", "ok", "ok"],
  },
  {
    sourceId: "src_seq",
    sourceName: "Sequoia Capital",
    itemsPerRun: [6, 8, 5, 7, 9, 6, 8],
    lastRunItems: 2,
    healthHistory: ["ok", "ok", "ok", "ok", "ok"],
  },
  {
    sourceId: "src_pear",
    sourceName: "Pear VC",
    itemsPerRun: [10, 7, 12, 9, 11, 8, 10],
    lastRunItems: 3,
    healthHistory: ["ok", "ok", "warning", "ok", "ok"],
  },
];

export const DUMMY_FUNNEL_STATS: FunnelStats = {
  discovered: 8,
  researched: 5,
  applied: 3,
  interviewing: 1,
  offer: 0,
  rejected: 0,
};
