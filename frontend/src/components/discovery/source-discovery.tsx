"use client";

import { useState, useEffect } from "react";
import { Search, Compass } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDebounce } from "@/hooks/use-debounce";
import { useCatalogFilters, useDiscoverySearch } from "@/hooks/use-discovery";
import { DiscoveryResult } from "./discovery-result";
import type { DiscoveredSource } from "@/types/discovery";

export function SourceDiscovery() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [region, setRegion] = useState("all");
  const debouncedQuery = useDebounce(query, 300);
  const search = useDiscoverySearch();
  const { data: filters } = useCatalogFilters();
  const [results, setResults] = useState<
    (DiscoveredSource & { alreadyAdded: boolean })[]
  >([]);

  useEffect(() => {
    search.mutate(
      {
        query: debouncedQuery,
        category: category === "all" ? undefined : category,
        region: region === "all" ? undefined : region,
      },
      { onSuccess: (data) => setResults(data) }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery, category, region]);

  const grouped = results.reduce<
    Record<string, (DiscoveredSource & { alreadyAdded: boolean })[]>
  >((acc, source) => {
    const key = source.category;
    if (!acc[key]) acc[key] = [];
    acc[key].push(source);
    return acc;
  }, {});

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-sm font-medium flex items-center gap-2">
          <Compass className="h-4 w-4" />
          Source Discovery
        </h2>
        <p className="text-xs text-muted-foreground">
          Find data sources to scrape. Search by domain, country, or topic and
          add them to your sources with one click.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder='Search sources... e.g. "data science jobs" or "startups"'
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={category} onValueChange={(v) => { if (v) setCategory(v); }}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {filters?.categories.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.value.charAt(0).toUpperCase() + cat.value.slice(1)} ({cat.count})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={region} onValueChange={(v) => { if (v) setRegion(v); }}>
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Regions</SelectItem>
            {filters?.regions.map((r) => (
              <SelectItem key={r.value} value={r.value}>
                {r.value} ({r.count})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {results.length === 0 && !search.isPending && (
        <div className="text-center py-12 text-sm text-muted-foreground">
          No sources found. Try a different search term.
        </div>
      )}

      {Object.entries(grouped).map(([categoryKey, sources]) => (
        <div key={categoryKey} className="flex flex-col gap-3">
          <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {categoryKey} ({sources.length})
          </h3>
          <div className="flex flex-col gap-3">
            {sources.map((source) => (
              <DiscoveryResult key={source.id} source={source} />
            ))}
          </div>
        </div>
      ))}

      {search.isPending && (
        <div className="text-center py-8 text-sm text-muted-foreground">
          Searching...
        </div>
      )}
    </div>
  );
}
