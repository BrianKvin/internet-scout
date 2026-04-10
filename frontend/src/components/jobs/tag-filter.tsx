"use client";

import { cn } from "@/lib/utils";
import { TAG_OPTIONS, type TagOption } from "@/lib/constants";

interface TagFilterProps {
  selected: TagOption[];
  onToggle: (tag: TagOption) => void;
}

export function TagFilter({ selected, onToggle }: TagFilterProps) {
  return (
    <div className="flex gap-2">
      {TAG_OPTIONS.map((tag) => (
        <button
          key={tag}
          onClick={() => onToggle(tag)}
          className={cn(
            "rounded-full border px-3 py-1 text-sm capitalize transition-colors",
            selected.includes(tag)
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-background text-muted-foreground hover:bg-accent"
          )}
        >
          {tag}
        </button>
      ))}
    </div>
  );
}
