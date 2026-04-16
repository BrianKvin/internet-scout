import { request } from "@/services/api";
import {
  mapActivityStats,
  mapScrapeRun,
  type ApiActivityStats,
  type ApiScrapeRun,
} from "@/services/mappers";
import type { ScrapeRun, ActivityStats } from "@/types/activity";

export async function getScrapeRuns(filters?: {
  status?: string;
  sourceId?: string;
}): Promise<ScrapeRun[]> {
  const params = new URLSearchParams();
  if (filters?.status) params.set("status", filters.status);
  if (filters?.sourceId) params.set("source_id", filters.sourceId);
  const query = params.toString();

  const rows = await request<ApiScrapeRun[]>(`/activity/runs${query ? `?${query}` : ""}`);
  return rows.map(mapScrapeRun);
}

export async function getActivityStats(): Promise<ActivityStats> {
  const row = await request<ApiActivityStats>("/activity/stats");
  return mapActivityStats(row);
}
