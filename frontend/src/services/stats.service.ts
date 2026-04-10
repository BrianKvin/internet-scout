import {
  DUMMY_DASHBOARD_STATS,
  DUMMY_SOURCE_PERFORMANCE,
  DUMMY_FUNNEL_STATS,
} from "@/data/stats";
import { DUMMY_JOBS } from "@/data/jobs";
import { DUMMY_PIPELINE } from "@/data/pipeline";
import type { DashboardStats, FunnelStats, SourcePerformance } from "@/types/stats";

export async function getDashboardStats(): Promise<DashboardStats> {
  return {
    ...DUMMY_DASHBOARD_STATS,
    jobsFound: DUMMY_JOBS.length,
    savedRoles: DUMMY_JOBS.filter((j) => j.savedAt !== null).length,
    appliedActive: DUMMY_PIPELINE.filter(
      (p) => p.stage === "applied" || p.stage === "interviewing"
    ).length,
  };
}

export async function getSourcePerformance(): Promise<SourcePerformance[]> {
  return [...DUMMY_SOURCE_PERFORMANCE];
}

export async function getFunnelStats(): Promise<FunnelStats> {
  return { ...DUMMY_FUNNEL_STATS };
}
