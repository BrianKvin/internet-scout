"use client";

import { ExternalLink, Plus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SOURCE_TYPE_LABELS, SOURCE_STRATEGY_LABELS } from "@/lib/constants";
import { DifficultyBadge } from "./difficulty-badge";
import { useAddDiscoveredSource } from "@/hooks/use-discovery";
import type { DiscoveredSource } from "@/types/discovery";
import { useState } from "react";

interface DiscoveryResultProps {
  source: DiscoveredSource & { alreadyAdded: boolean };
}

const FRESHNESS_LABELS: Record<string, string> = {
  daily: "Updated daily",
  weekly: "Updated weekly",
  monthly: "Updated monthly",
  unknown: "Update frequency unknown",
};

export function DiscoveryResult({ source }: DiscoveryResultProps) {
  const addSource = useAddDiscoveredSource();
  const [justAdded, setJustAdded] = useState(false);
  const isAdded = source.alreadyAdded || justAdded;

  const handleAdd = () => {
    addSource.mutate(source.id, {
      onSuccess: () => setJustAdded(true),
    });
  };

  return (
    <div className="flex flex-col gap-2 border rounded-lg p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1 min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{source.name}</span>
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
          <p className="text-xs text-muted-foreground">{source.description}</p>
          <p className="text-xs text-muted-foreground truncate">{source.url}</p>
        </div>

        <Button
          variant={isAdded ? "outline" : "default"}
          size="sm"
          onClick={handleAdd}
          disabled={isAdded || addSource.isPending}
          className="shrink-0"
        >
          {isAdded ? (
            <>
              <Check className="h-3.5 w-3.5 mr-1" />
              Added
            </>
          ) : addSource.isPending ? (
            "Adding..."
          ) : (
            <>
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add to Sources
            </>
          )}
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className="text-xs">
          {SOURCE_TYPE_LABELS[source.type]}
        </Badge>
        <Badge variant="outline" className="text-xs">
          {SOURCE_STRATEGY_LABELS[source.suggestedStrategy]}
        </Badge>
        <DifficultyBadge level={source.difficulty} />
        <span className="text-xs text-muted-foreground">
          {FRESHNESS_LABELS[source.freshness]}
        </span>
        {source.region && (
          <span className="text-xs text-muted-foreground">
            {source.region}
          </span>
        )}
      </div>

      {source.legalNote && (
        <p className="text-xs text-muted-foreground italic">
          {source.legalNote}
        </p>
      )}
    </div>
  );
}
