import { DUMMY_PIPELINE } from "@/data/pipeline";
import type { PipelineItem, PipelineStage } from "@/types/pipeline";

export async function getPipeline(): Promise<PipelineItem[]> {
  return [...DUMMY_PIPELINE];
}

export async function updateStage(
  id: string,
  stage: PipelineStage
): Promise<PipelineItem> {
  const item = DUMMY_PIPELINE.find((p) => p.id === id);
  if (!item) {
    throw new Error(`Pipeline item not found: ${id}`);
  }
  item.stage = stage;
  item.updatedAt = new Date().toISOString();
  if (stage === "applied" && !item.appliedAt) {
    item.appliedAt = new Date().toISOString();
  }
  return { ...item };
}
