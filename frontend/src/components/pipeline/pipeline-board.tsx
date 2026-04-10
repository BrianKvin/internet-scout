"use client";

import { useCallback } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { usePipeline, useUpdateStage } from "@/hooks/use-pipeline";
import { PipelineColumn } from "./pipeline-column";
import { PipelineCard } from "./pipeline-card";
import { PIPELINE_STAGES, type PipelineStage } from "@/types/pipeline";
import type { PipelineItem } from "@/types/pipeline";

export function PipelineBoard() {
  const { data: items, isLoading } = usePipeline();
  const updateStage = useUpdateStage();
  const [activeItem, setActiveItem] = useState<PipelineItem | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const getItemsByStage = useCallback(
    (stage: PipelineStage) => {
      return items?.filter((item) => item.stage === stage) ?? [];
    },
    [items]
  );

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const draggedItem = items?.find((item) => item.id === event.active.id);
      if (draggedItem) {
        setActiveItem(draggedItem);
      }
    },
    [items]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveItem(null);
      const { active, over } = event;

      if (!over) return;

      const activeId = active.id as string;
      const overId = over.id as string;

      // Check if dropped on a stage column
      const targetStage = PIPELINE_STAGES.find((s) => s === overId);
      if (targetStage) {
        const draggedItem = items?.find((item) => item.id === activeId);
        if (draggedItem && draggedItem.stage !== targetStage) {
          updateStage.mutate({ id: activeId, stage: targetStage });
        }
        return;
      }

      // Dropped on another item — find its stage
      const targetItem = items?.find((item) => item.id === overId);
      if (targetItem) {
        const draggedItem = items?.find((item) => item.id === activeId);
        if (draggedItem && draggedItem.stage !== targetItem.stage) {
          updateStage.mutate({ id: activeId, stage: targetItem.stage });
        }
      }
    },
    [items, updateStage]
  );

  if (isLoading) {
    return (
      <div className="flex gap-4 p-6 overflow-x-auto">
        {PIPELINE_STAGES.map((stage) => (
          <div
            key={stage}
            className="flex flex-col gap-3 rounded-lg border bg-muted/30 p-3 min-w-[250px]"
          >
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-20 w-full" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 p-6 overflow-x-auto">
        {PIPELINE_STAGES.map((stage) => (
          <PipelineColumn
            key={stage}
            stage={stage}
            items={getItemsByStage(stage)}
          />
        ))}
      </div>

      <DragOverlay>
        {activeItem ? <PipelineCard item={activeItem} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
