"use client";

import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  Clock,
  Database,
  Sparkles,
  Copy,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ScrapeRun, RunStatus } from "@/types/activity";

interface RunCardProps {
  run: ScrapeRun;
}

const STATUS_CONFIG: Record<
  RunStatus,
  { icon: typeof CheckCircle2; label: string; className: string }
> = {
  success: {
    icon: CheckCircle2,
    label: "Success",
    className: "bg-green-100 text-green-800",
  },
  partial: {
    icon: AlertTriangle,
    label: "Partial",
    className: "bg-amber-100 text-amber-800",
  },
  failed: {
    icon: XCircle,
    label: "Failed",
    className: "bg-red-100 text-red-800",
  },
  running: {
    icon: Loader2,
    label: "Running",
    className: "bg-blue-100 text-blue-800",
  },
};

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const seconds = ms / 1000;
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  const minutes = Math.floor(seconds / 60);
  const remaining = Math.round(seconds % 60);
  return `${minutes}m ${remaining}s`;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function RunCard({ run }: RunCardProps) {
  const status = STATUS_CONFIG[run.status];
  const StatusIcon = status.icon;

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-sm font-medium truncate">{run.sourceName}</h3>
            <span className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
              <Clock className="h-3 w-3" />
              {formatTime(run.startedAt)}
            </span>
          </div>
          <Badge variant="secondary" className={`shrink-0 text-xs ${status.className}`}>
            <StatusIcon className={`h-3 w-3 mr-1 ${run.status === "running" ? "animate-spin" : ""}`} />
            {status.label}
          </Badge>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="flex flex-col items-center gap-0.5 rounded-md bg-muted/50 py-1.5">
            <Database className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-sm font-semibold">{run.itemsFound}</span>
            <span className="text-[10px] text-muted-foreground">found</span>
          </div>
          <div className="flex flex-col items-center gap-0.5 rounded-md bg-muted/50 py-1.5">
            <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-sm font-semibold">{run.itemsNew}</span>
            <span className="text-[10px] text-muted-foreground">new</span>
          </div>
          <div className="flex flex-col items-center gap-0.5 rounded-md bg-muted/50 py-1.5">
            <Copy className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-sm font-semibold">{run.itemsDeduped}</span>
            <span className="text-[10px] text-muted-foreground">deduped</span>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Duration: {formatDuration(run.durationMs)}</span>
        </div>

        {run.errorMessage && (
          <p className="text-xs text-red-600 bg-red-50 rounded-md px-2 py-1.5 line-clamp-2">
            {run.errorMessage}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
