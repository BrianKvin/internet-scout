"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { useSourcePerformance } from "@/hooks/use-stats";
import { useScrapeRuns } from "@/hooks/use-activity";
import { SourcePerformance } from "./source-performance";
import { ActivityChart } from "./activity-chart";

export function StatsDashboard() {
  const { data: performance, isLoading: perfLoading } =
    useSourcePerformance();
  const { data: runs, isLoading: runsLoading } = useScrapeRuns();

  if (perfLoading || runsLoading) {
    return (
      <div className="grid gap-6 p-6 lg:grid-cols-2">
        <div className="rounded-lg border p-6">
          <Skeleton className="h-5 w-40 mb-4" />
          <Skeleton className="h-[250px] w-full" />
        </div>
        <div className="rounded-lg border p-6">
          <Skeleton className="h-5 w-40 mb-4" />
          <Skeleton className="h-[250px] w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6 p-6 lg:grid-cols-2">
      {performance && <SourcePerformance data={performance} />}
      {runs && <ActivityChart data={runs} />}
    </div>
  );
}
