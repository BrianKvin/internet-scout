"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Signal } from "@/types/signal";

interface SignalBadgeProps {
  signal: Signal;
}

const SIGNAL_STYLES: Record<string, string> = {
  funding_round: "bg-green-100 text-green-800",
  news: "bg-blue-100 text-blue-800",
  hiring_surge: "bg-orange-100 text-orange-800",
  github_activity: "bg-purple-100 text-purple-800",
  regulatory_change: "bg-yellow-100 text-yellow-800",
  environmental_alert: "bg-emerald-100 text-emerald-800",
  tender_deadline: "bg-sky-100 text-sky-800",
};

const SIGNAL_LABELS: Record<string, string> = {
  funding_round: "Funding",
  news: "News",
  hiring_surge: "Hiring",
  github_activity: "GitHub",
  regulatory_change: "Regulatory",
  environmental_alert: "Environment",
  tender_deadline: "Tender",
};

export function SignalBadge({ signal }: SignalBadgeProps) {
  const style = SIGNAL_STYLES[signal.type] ?? "bg-gray-100 text-gray-800";
  const label = SIGNAL_LABELS[signal.type] ?? signal.type;

  return (
    <Badge variant="secondary" className={cn("text-xs", style)} title={signal.title}>
      {label}
      {signal.amount ? ` · ${signal.amount}` : ""}
    </Badge>
  );
}
