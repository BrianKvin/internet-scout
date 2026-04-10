import type { Job } from "./job";

export const PIPELINE_STAGES = [
  "discovered",
  "researched",
  "applied",
  "interviewing",
  "offer",
  "rejected",
] as const;

export type PipelineStage = (typeof PIPELINE_STAGES)[number];

export interface PipelineItem {
  id: string;
  jobId: string;
  job: Job;
  stage: PipelineStage;
  notes: string | null;
  appliedAt: string | null;
  updatedAt: string;
}
