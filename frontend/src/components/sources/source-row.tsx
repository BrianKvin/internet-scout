"use client";

import { Play, Trash2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  useToggleSource,
  useDeleteSource,
  useScrapeSource,
} from "@/hooks/use-sources";
import { HealthIndicator } from "./health-indicator";
import { SOURCE_STRATEGY_LABELS, SOURCE_TYPE_LABELS } from "@/lib/constants";
import type { Source } from "@/types/source";

interface SourceRowProps {
  source: Source;
}

export function SourceRow({ source }: SourceRowProps) {
  const toggleSource = useToggleSource();
  const deleteSource = useDeleteSource();
  const scrapeSource = useScrapeSource();

  const lastScrapedLabel = source.lastScraped
    ? new Date(source.lastScraped).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Never";

  return (
    <div className="flex items-center gap-4 border-b px-6 py-4">
      <Switch
        checked={source.enabled}
        onCheckedChange={() => toggleSource.mutate(source.id)}
        disabled={toggleSource.isPending}
      />

      <div className="flex flex-col gap-1 min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{source.name}</span>
          <HealthIndicator health={source.health} />
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="truncate max-w-[300px]">{source.url}</span>
          <Badge variant="outline" className="text-xs">
            {SOURCE_TYPE_LABELS[source.type]}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {SOURCE_STRATEGY_LABELS[source.strategy]}
          </Badge>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
        <span>{source.jobCount} items</span>
        <span>Last: {lastScrapedLabel}</span>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          title="Scrape now"
          onClick={() => scrapeSource.mutate(source.id)}
          disabled={scrapeSource.isPending || !source.enabled}
        >
          <Play className="h-4 w-4" />
        </Button>
        <a
          href={source.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent transition-colors"
        >
          <ExternalLink className="h-4 w-4" />
        </a>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive"
          title="Delete source"
          onClick={() => deleteSource.mutate(source.id)}
          disabled={deleteSource.isPending}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
