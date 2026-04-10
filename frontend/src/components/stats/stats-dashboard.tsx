"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { useSourcePerformance, useFunnelStats } from "@/hooks/use-stats";
import { SourcePerformance } from "./source-performance";
import { ApplicationFunnel } from "./application-funnel";

export function StatsDashboard() {
  const { data: performance, isLoading: perfLoading } =
    useSourcePerformance();
  const { data: funnel, isLoading: funnelLoading } = useFunnelStats();

  if (perfLoading || funnelLoading) {
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
      {funnel && <ApplicationFunnel data={funnel} />}
    </div>
  );
}
