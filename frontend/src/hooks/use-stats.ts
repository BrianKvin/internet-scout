import { useQuery } from "@tanstack/react-query";
import {
  getDashboardStats,
  getSourcePerformance,
} from "@/services/stats.service";

export function useDashboardStats() {
  return useQuery({
    queryKey: ["stats", "dashboard"],
    queryFn: getDashboardStats,
  });
}

export function useSourcePerformance() {
  return useQuery({
    queryKey: ["stats", "source-performance"],
    queryFn: getSourcePerformance,
  });
}
