"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { PipelineItem } from "@/types/pipeline";

interface PipelineCardProps {
  item: PipelineItem;
}

export function PipelineCard({ item }: PipelineCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const dateLabel = item.appliedAt
    ? new Date(item.appliedAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    : new Date(item.updatedAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className="cursor-grab active:cursor-grabbing"
    >
      <CardContent className="flex items-start gap-2 p-3">
        <button
          {...attributes}
          {...listeners}
          className="mt-0.5 shrink-0 text-muted-foreground hover:text-foreground"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="flex flex-col gap-1 min-w-0">
          <span className="text-sm font-medium truncate">
            {item.job.title}
          </span>
          <span className="text-xs text-muted-foreground truncate">
            {item.job.company}
          </span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            {dateLabel}
          </span>
          {item.notes && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {item.notes}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
