import { request } from "@/services/api";
import { mapSource, type ApiSource } from "@/services/mappers";
import type { Source, SourceCreate } from "@/types/source";

export async function getSources(): Promise<Source[]> {
  let rows = await request<ApiSource[]>("/sources/");

  // Preserve default source injection behavior on first load.
  if (rows.length === 0) {
    await request<{ seeded: boolean }>("/sources/seed", { method: "POST" });
    rows = await request<ApiSource[]>("/sources/");
  }

  return rows.map(mapSource);
}

export async function addSource(body: SourceCreate): Promise<Source> {
  const row = await request<ApiSource>("/sources/", {
    method: "POST",
    body: JSON.stringify(body),
  });
  return mapSource(row);
}

export async function toggleSource(id: string): Promise<Source> {
  const row = await request<ApiSource>(`/sources/${id}/toggle`, {
    method: "PATCH",
  });
  return mapSource(row);
}

export async function deleteSource(id: string): Promise<void> {
  await request<void>(`/sources/${id}`, {
    method: "DELETE",
  });
}

export interface ScrapeSourceResult {
  scraped: number;
  found: number;
  collectionId: string | null;
}

export async function scrapeSource(id: string): Promise<ScrapeSourceResult> {
  const result = await request<{
    found?: number;
    new?: number;
    collection_id?: string;
    collection_items_added?: number;
  }>(`/scrape/${id}`, {
    method: "POST",
  });
  return {
    scraped: result.new ?? result.found ?? 0,
    found: result.found ?? 0,
    collectionId: result.collection_id ?? null,
  };
}

type ScrapeAllResult = {
  source_id: string;
  found?: number;
  new?: number;
  dupes?: number;
  error?: string;
};

export async function scrapeAllSources(): Promise<{
  total: number;
  success: number;
  failed: number;
  newItems: number;
  results: ScrapeAllResult[];
}> {
  const payload = await request<{ results: ScrapeAllResult[] }>("/scrape/all/run", {
    method: "POST",
  });

  const results = payload.results ?? [];
  const failed = results.filter((r) => Boolean(r.error)).length;
  const success = results.length - failed;
  const newItems = results.reduce((sum, r) => sum + (r.new ?? r.found ?? 0), 0);

  return {
    total: results.length,
    success,
    failed,
    newItems,
    results,
  };
}
