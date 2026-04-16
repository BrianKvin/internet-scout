import { request } from "@/services/api";
import { mapJob, type ApiJob } from "@/services/mappers";
import type { Job, JobFilters } from "@/types/job";

export async function getJobs(filters?: JobFilters): Promise<Job[]> {
  const params = new URLSearchParams();
  if (filters?.search) params.set("search", filters.search);
  if (filters?.source && filters.source !== "all") params.set("source_id", filters.source);
  if (filters?.tags?.includes("remote")) params.set("is_remote", "true");
  if (filters?.tags?.includes("new")) params.set("is_new", "true");

  const query = params.toString();
  const rows = await request<ApiJob[]>(`/jobs/${query ? `?${query}` : ""}`);
  let jobs = rows.map(mapJob);

  if (filters?.tags?.includes("hot")) {
    jobs = jobs.filter((job) => job.savedAt !== null);
  }

  return jobs;
}

export async function saveJob(id: string): Promise<Job> {
  const row = await request<ApiJob>(`/jobs/${id}/save`, { method: "PATCH" });
  return mapJob(row);
}
