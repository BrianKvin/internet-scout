import { DUMMY_SOURCES } from "@/data/sources";
import type { Source, SourceCreate } from "@/types/source";

export async function getSources(): Promise<Source[]> {
  return [...DUMMY_SOURCES];
}

export async function addSource(body: SourceCreate): Promise<Source> {
  const newSource: Source = {
    id: `src_${Date.now()}`,
    name: body.name,
    url: body.url,
    type: body.type,
    strategy: body.strategy,
    enabled: true,
    lastScraped: null,
    jobCount: 0,
    health: "ok",
    notes: null,
  };
  DUMMY_SOURCES.push(newSource);
  return { ...newSource };
}

export async function toggleSource(id: string): Promise<Source> {
  const source = DUMMY_SOURCES.find((s) => s.id === id);
  if (!source) {
    throw new Error(`Source not found: ${id}`);
  }
  source.enabled = !source.enabled;
  return { ...source };
}

export async function deleteSource(id: string): Promise<void> {
  const index = DUMMY_SOURCES.findIndex((s) => s.id === id);
  if (index === -1) {
    throw new Error(`Source not found: ${id}`);
  }
  DUMMY_SOURCES.splice(index, 1);
}

export async function scrapeSource(id: string): Promise<{ scraped: number }> {
  const source = DUMMY_SOURCES.find((s) => s.id === id);
  if (!source) {
    throw new Error(`Source not found: ${id}`);
  }
  source.lastScraped = new Date().toISOString();
  const count = Math.floor(Math.random() * 10) + 1;
  source.jobCount += count;
  return { scraped: count };
}
