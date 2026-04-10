"use client";

import { useDashboardStats } from "@/hooks/use-stats";
import { Skeleton } from "@/components/ui/skeleton";

interface StatCardProps {
  label: string;
  value: number;
  sublabel: string;
}

function StatCard({ label, value, sublabel }: StatCardProps) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold">{value}</span>
        <span className="text-xs text-muted-foreground">{sublabel}</span>
      </div>
    </div>
  );
}

function StatCardSkeleton() {
  return (
    <div className="flex flex-col gap-1">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-16" />
    </div>
  );
}

export function StatsBar() {
  const { data: stats, isLoading } = useDashboardStats();

  if (isLoading || !stats) {
    return (
      <div className="flex gap-8 border-b px-6 py-4">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-8 border-b px-6 py-4">
      <StatCard
        label="Jobs found"
        value={stats.jobsFound}
        sublabel="+1 today"
      />
      <StatCard
        label="Companies tracked"
        value={stats.companiesTracked}
        sublabel="4 with contacts"
      />
      <StatCard
        label="Saved roles"
        value={stats.savedRoles}
        sublabel="across all sources"
      />
      <StatCard
        label="Applied / active"
        value={stats.appliedActive}
        sublabel="in pipeline"
      />
    </div>
  );
}
