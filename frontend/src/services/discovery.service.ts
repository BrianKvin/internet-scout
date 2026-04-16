import { DISCOVERY_CATALOG } from "@/data/discovery";
import { addSource } from "./sources.service";
import type { DiscoveredSource, DiscoveryQuery, CatalogFilters } from "@/types/discovery";
import type { Source } from "@/types/source";

export async function getCatalogFilters(): Promise<CatalogFilters> {
  const categoryCounts = new Map<string, number>();
  const regionCounts = new Map<string, number>();

  for (const source of DISCOVERY_CATALOG) {
    categoryCounts.set(source.category, (categoryCounts.get(source.category) ?? 0) + 1);
    if (source.region) {
      regionCounts.set(source.region, (regionCounts.get(source.region) ?? 0) + 1);
    }
  }

  const categories = [...categoryCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([value, count]) => ({ value, count }));

  const regions = [...regionCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([value, count]) => ({ value, count }));

  return { categories, regions };
}

export async function searchSources(
  query: DiscoveryQuery
): Promise<(DiscoveredSource & { alreadyAdded: boolean })[]> {
  const q = query.query.toLowerCase().trim();

  let results = DISCOVERY_CATALOG.filter((source) => {
    if (!q) return true;
    const searchable = [
      source.name,
      source.description,
      source.category,
      source.region ?? "",
      source.type,
    ]
      .join(" ")
      .toLowerCase();
    return q.split(/\s+/).every((term) => searchable.includes(term));
  });

  if (query.category) {
    results = results.filter((s) => s.category === query.category);
  }
  if (query.region) {
    results = results.filter((s) => s.region === query.region);
  }

  const existing = await getSources();
  const existingUrls = new Set(existing.map((s) => s.url));

  return results.map((source) => ({
    ...source,
    alreadyAdded: existingUrls.has(source.url),
  }));
}

export async function addDiscoveredSource(
  sourceId: string
): Promise<Source> {
  const discovered = DISCOVERY_CATALOG.find((s) => s.id === sourceId);
  if (!discovered) throw new Error(`Source not found in catalog: ${sourceId}`);

  return addSource({
    name: discovered.name,
    url: discovered.url,
    type: discovered.type,
    strategy: discovered.suggestedStrategy,
  });
}

async function getSources(): Promise<Source[]> {
  const { getSources: _getSources } = await import("./sources.service");
  return _getSources();
}
