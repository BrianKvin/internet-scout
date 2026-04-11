import {
  DUMMY_DASHBOARD_STATS,
  DUMMY_SOURCE_PERFORMANCE,
} from "@/data/stats";
import type { DashboardStats, SourcePerformance } from "@/types/stats";

export async function getDashboardStats(): Promise<DashboardStats> {
  return { ...DUMMY_DASHBOARD_STATS };
}

export async function getSourcePerformance(): Promise<SourcePerformance[]> {
  return [...DUMMY_SOURCE_PERFORMANCE];
}
