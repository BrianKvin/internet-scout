"use client";

import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useScrapeRuns } from "@/hooks/use-activity";
import { RunCard } from "./run-card";
import type { RunStatus } from "@/types/activity";

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: "all", label: "All" },
  { value: "success", label: "Success" },
  { value: "partial", label: "Partial" },
  { value: "failed", label: "Failed" },
];

export function ActivityFeed() {
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: runs, isLoading } = useScrapeRuns(
    statusFilter !== "all" ? { status: statusFilter as RunStatus } : undefined
  );

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-medium">Scrape Activity</h2>
          <p className="text-xs text-muted-foreground">
            History of all scrape runs across your sources.
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        {STATUS_FILTERS.map((filter) => (
          <button
            key={filter.value}
            onClick={() => setStatusFilter(filter.value)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              statusFilter === filter.value
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-lg border p-4">
              <Skeleton className="h-5 w-32 mb-2" />
              <Skeleton className="h-3 w-24 mb-3" />
              <div className="grid grid-cols-3 gap-2">
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : runs && runs.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {runs.map((run) => (
            <RunCard key={run.id} run={run} />
          ))}
        </div>
      ) : (
        <div className="py-16 text-center">
          <p className="text-muted-foreground">
            No scrape runs found{statusFilter !== "all" ? ` with status "${statusFilter}"` : ""}.
          </p>
          <p className="text-xs text-muted-foreground/60 mt-1">Runs appear here after a source is scraped.</p>
        </div>
      )}
    </div>
  );
}
