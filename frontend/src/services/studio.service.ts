import { DUMMY_SCRAPE_JOBS } from "@/data/scrape-jobs";
import { DUMMY_COLLECTIONS } from "@/data/collections";
import type { ScrapeJob, ScrapeJobCreate } from "@/types/scrape-job";
import type { Collection } from "@/types/collection";

export async function getScrapeJobs(): Promise<ScrapeJob[]> {
  return [...DUMMY_SCRAPE_JOBS];
}

export async function previewScrape(
  _url: string,
  _strategy: string
): Promise<Record<string, string | number | boolean | null>[]> {
  // Return dummy preview data
  return [
    { name: "Example Item 1", category: "Finance", location: "Nairobi" },
    { name: "Example Item 2", category: "Technology", location: "Lagos" },
    { name: "Example Item 3", category: "Agriculture", location: "Kampala" },
    { name: "Example Item 4", category: "Healthcare", location: "Dar es Salaam" },
    { name: "Example Item 5", category: "Education", location: "Kigali" },
  ];
}

export async function createScrapeJob(
  body: ScrapeJobCreate
): Promise<ScrapeJob> {
  const collectionId = `col_${Date.now()}`;
  const newCollection: Collection = {
    id: collectionId,
    name: body.collectionName,
    description: null,
    category: "custom",
    itemCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  DUMMY_COLLECTIONS.push(newCollection);

  const newJob: ScrapeJob = {
    id: `sj_${Date.now()}`,
    name: body.name,
    url: body.url,
    instructions: body.instructions,
    config: {},
    collectionId,
    schedule: body.schedule,
    notify: body.notify,
    lastRun: null,
    lastCount: 0,
    health: "ok",
    createdAt: new Date().toISOString(),
  };
  DUMMY_SCRAPE_JOBS.push(newJob);
  return { ...newJob };
}
