import { DUMMY_JOBS } from "@/data/jobs";
import type { Job, JobFilters } from "@/types/job";

export async function getJobs(filters?: JobFilters): Promise<Job[]> {
  let jobs = [...DUMMY_JOBS];

  if (filters?.search) {
    const q = filters.search.toLowerCase();
    jobs = jobs.filter(
      (j) =>
        j.title.toLowerCase().includes(q) ||
        j.company.toLowerCase().includes(q)
    );
  }

  if (filters?.source && filters.source !== "all") {
    jobs = jobs.filter((j) => j.sourceId === filters.source);
  }

  if (filters?.tags && filters.tags.length > 0) {
    jobs = jobs.filter((j) => {
      return filters.tags!.every((tag) => {
        switch (tag) {
          case "remote":
            return j.isRemote;
          case "new":
            return j.isNew;
          case "hot":
            return j.savedAt !== null;
          default:
            return true;
        }
      });
    });
  }

  return jobs;
}

export async function saveJob(id: string): Promise<Job> {
  const job = DUMMY_JOBS.find((j) => j.id === id);
  if (!job) {
    throw new Error(`Job not found: ${id}`);
  }
  job.savedAt = job.savedAt ? null : new Date().toISOString();
  return { ...job };
}
