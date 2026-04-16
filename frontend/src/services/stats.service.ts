import { request } from "@/services/api";
import {
  mapDashboardStats,
  mapSourcePerformance,
  type ApiDashboardStats,
  type ApiSourcePerformance,
} from "@/services/mappers";
import type { DashboardStats, SourcePerformance } from "@/types/stats";

export async function getDashboardStats(): Promise<DashboardStats> {
  const row = await request<ApiDashboardStats>("/stats/dashboard");
  return mapDashboardStats(row);
}

export async function getSourcePerformance(): Promise<SourcePerformance[]> {
  const rows = await request<ApiSourcePerformance[]>("/stats/source-performance");
  return rows.map(mapSourcePerformance);
}
