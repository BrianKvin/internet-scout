import { DUMMY_SCRAPE_RUNS } from "@/data/activity";
import type { ScrapeRun, ActivityStats } from "@/types/activity";

export async function getScrapeRuns(filters?: {
  status?: string;
  sourceId?: string;
}): Promise<ScrapeRun[]> {
  let runs = [...DUMMY_SCRAPE_RUNS];

  if (filters?.status) {
    runs = runs.filter((r) => r.status === filters.status);
  }
  if (filters?.sourceId) {
    runs = runs.filter((r) => r.sourceId === filters.sourceId);
  }

  return runs.sort(
    (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
  );
}

export async function getActivityStats(): Promise<ActivityStats> {
  const runs = DUMMY_SCRAPE_RUNS;
  const successCount = runs.filter((r) => r.status === "success").length;
  const todayItems = runs
    .filter((r) => r.startedAt.startsWith("2026-04-11"))
    .reduce((sum, r) => sum + r.itemsNew, 0);
  const activeSources = new Set(runs.map((r) => r.sourceId)).size;

  return {
    totalRuns: runs.length,
    successRate: Math.round((successCount / runs.length) * 100),
    itemsCollectedToday: todayItems,
    activeSourceCount: activeSources,
  };
}
