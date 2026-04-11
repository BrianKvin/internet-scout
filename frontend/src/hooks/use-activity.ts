import { useQuery } from "@tanstack/react-query";
import { getScrapeRuns, getActivityStats } from "@/services/activity.service";

export function useScrapeRuns(filters?: {
  status?: string;
  sourceId?: string;
}) {
  return useQuery({
    queryKey: ["activity", "runs", filters],
    queryFn: () => getScrapeRuns(filters),
  });
}

export function useActivityStats() {
  return useQuery({
    queryKey: ["activity", "stats"],
    queryFn: getActivityStats,
  });
}
