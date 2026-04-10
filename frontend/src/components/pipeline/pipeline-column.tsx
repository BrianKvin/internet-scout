"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { cn } from "@/lib/utils";
import { PIPELINE_STAGE_LABELS } from "@/lib/constants";
import { PipelineCard } from "./pipeline-card";
import type { PipelineItem, PipelineStage } from "@/types/pipeline";

interface PipelineColumnProps {
  stage: PipelineStage;
  items: PipelineItem[];
}

export function PipelineColumn({ stage, items }: PipelineColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });

  const itemIds = items.map((item) => item.id);

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col gap-3 rounded-lg border bg-muted/30 p-3 min-w-[250px] min-h-[200px]",
        isOver && "ring-2 ring-primary/50 bg-primary/5"
      )}
    >
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-medium capitalize">
          {PIPELINE_STAGE_LABELS[stage]}
        </h3>
        <span className="text-xs text-muted-foreground rounded-full bg-muted px-2 py-0.5">
          {items.length}
        </span>
      </div>

      <SortableContext
        items={itemIds}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex flex-col gap-2">
          {items.map((item) => (
            <PipelineCard key={item.id} item={item} />
          ))}
        </div>
      </SortableContext>

      {items.length === 0 && (
        <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground py-8">
          Drop items here
        </div>
      )}
    </div>
  );
}
