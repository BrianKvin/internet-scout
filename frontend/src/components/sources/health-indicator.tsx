"use client";

import { cn } from "@/lib/utils";
import type { SourceHealth } from "@/types/source";

interface HealthIndicatorProps {
  health: SourceHealth;
}

const HEALTH_COLORS: Record<SourceHealth, string> = {
  ok: "bg-green-500",
  warning: "bg-yellow-500",
  dead: "bg-red-500",
};

const HEALTH_LABELS: Record<SourceHealth, string> = {
  ok: "Healthy",
  warning: "Warning",
  dead: "Dead",
};

export function HealthIndicator({ health }: HealthIndicatorProps) {
  return (
    <div className="flex items-center gap-1.5" title={HEALTH_LABELS[health]}>
      <div className={cn("h-2 w-2 rounded-full", HEALTH_COLORS[health])} />
      <span className="text-xs text-muted-foreground">
        {HEALTH_LABELS[health]}
      </span>
    </div>
  );
}
