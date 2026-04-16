import { request } from "@/services/api";
import { mapScrapeJob, type ApiScrapeJob } from "@/services/mappers";
import type { ScrapeJob, ScrapeJobCreate } from "@/types/scrape-job";

export async function getScrapeJobs(): Promise<ScrapeJob[]> {
  const rows = await request<ApiScrapeJob[]>("/studio/");
  return rows.map(mapScrapeJob);
}

export interface PreviewResult {
  items: Record<string, string | number | boolean | null>[];
  filtered: number;
  total: number;
}

export async function previewScrape(
  url: string,
  strategy: string,
  keywords: string = "",
): Promise<PreviewResult> {
  const params = new URLSearchParams({
    url,
    strategy,
    limit: "10",
  });
  if (keywords) params.set("keywords", keywords);

  return request<PreviewResult>(`/studio/preview?${params.toString()}`, {
    method: "POST",
  });
}

export interface RunJobResult {
  scraped: number;
  items: Record<string, string | number | boolean | null>[];
  collectionId: string | null;
  companiesAdded: number;
}

export async function runScrapeJob(jobId: string): Promise<RunJobResult> {
  const result = await request<{
    scraped: number;
    items: Record<string, string | number | boolean | null>[];
    collection_id: string | null;
    companies_added: number;
  }>(`/studio/${jobId}/run`, { method: "POST" });

  return {
    scraped: result.scraped,
    items: result.items,
    collectionId: result.collection_id,
    companiesAdded: result.companies_added,
  };
}

export async function createScrapeJob(
  body: ScrapeJobCreate
): Promise<ScrapeJob> {
  const row = await request<ApiScrapeJob>("/studio/", {
    method: "POST",
    body: JSON.stringify({
      name: body.name,
      source_id: body.sourceId,
      url: body.url,
      instructions: body.instructions,
      keywords: body.keywords,
      collection_id: body.collectionId,
      collection_name: body.newCollectionName,
      schedule: body.schedule,
      notify: body.notify,
    }),
  });

  return mapScrapeJob(row);
}
