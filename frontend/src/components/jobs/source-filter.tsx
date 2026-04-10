"use client";

import { cn } from "@/lib/utils";
import { useSources } from "@/hooks/use-sources";

interface SourceFilterProps {
  selected: string;
  onSelect: (sourceId: string) => void;
}

export function SourceFilter({ selected, onSelect }: SourceFilterProps) {
  const { data: sources } = useSources();

  const enabledSources = sources?.filter((s) => s.enabled) ?? [];

  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onSelect("all")}
        className={cn(
          "rounded-full border px-3 py-1 text-sm transition-colors",
          selected === "all"
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border bg-background text-muted-foreground hover:bg-accent"
        )}
      >
        All sources
      </button>
      {enabledSources.map((source) => (
        <button
          key={source.id}
          onClick={() => onSelect(source.id)}
          className={cn(
            "rounded-full border px-3 py-1 text-sm transition-colors",
            selected === source.id
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-background text-muted-foreground hover:bg-accent"
          )}
        >
          {source.name}
        </button>
      ))}
    </div>
  );
}
