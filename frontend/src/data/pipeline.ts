import type { PipelineItem } from "@/types/pipeline";
import { DUMMY_JOBS } from "./jobs";

const jobByIndex = (index: number) => {
  const job = DUMMY_JOBS[index];
  if (!job) {
    throw new Error(`No job at index ${index}`);
  }
  return job;
};

export const DUMMY_PIPELINE: PipelineItem[] = [
  {
    id: "pipe_1",
    jobId: "job_1",
    job: jobByIndex(0),
    stage: "applied",
    notes: "Applied via website, mentioned open-source contributions.",
    appliedAt: "2026-04-08T10:00:00Z",
    updatedAt: "2026-04-08T10:00:00Z",
  },
  {
    id: "pipe_2",
    jobId: "job_3",
    job: jobByIndex(2),
    stage: "interviewing",
    notes: "Phone screen scheduled for April 12.",
    appliedAt: "2026-04-05T09:00:00Z",
    updatedAt: "2026-04-09T14:00:00Z",
  },
  {
    id: "pipe_3",
    jobId: "job_7",
    job: jobByIndex(6),
    stage: "discovered",
    notes: null,
    appliedAt: null,
    updatedAt: "2026-04-09T07:00:00Z",
  },
];
