"use client";

import { useState, useCallback } from "react";
import { useJobs } from "@/hooks/use-jobs";
import { useDebounce } from "@/hooks/use-debounce";
import { JobSearch } from "./job-search";
import { SourceFilter } from "./source-filter";
import { TagFilter } from "./tag-filter";
import { JobCard } from "./job-card";
import { Skeleton } from "@/components/ui/skeleton";
import type { TagOption } from "@/lib/constants";

export function JobFeed() {
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [tagFilters, setTagFilters] = useState<TagOption[]>([]);

  const debouncedSearch = useDebounce(search, 300);

  const { data: jobs, isLoading } = useJobs({
    search: debouncedSearch || undefined,
    source: sourceFilter !== "all" ? sourceFilter : undefined,
    tags: tagFilters.length > 0 ? tagFilters : undefined,
  });

  const handleToggleTag = useCallback((tag: TagOption) => {
    setTagFilters((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }, []);

  return (
    <div className="flex flex-col">
      <div className="flex flex-col gap-3 px-6 py-4 border-b">
        <JobSearch value={search} onChange={setSearch} />
        <div className="flex flex-wrap items-center gap-4">
          <SourceFilter selected={sourceFilter} onSelect={setSourceFilter} />
          <div className="h-4 w-px bg-border" />
          <TagFilter selected={tagFilters} onToggle={handleToggleTag} />
        </div>
      </div>

      <div className="flex flex-col">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-6 py-4 border-b">
              <div className="flex flex-col gap-2 flex-1">
                <Skeleton className="h-5 w-64" />
                <Skeleton className="h-4 w-48" />
              </div>
              <Skeleton className="h-6 w-12" />
              <Skeleton className="h-8 w-16" />
            </div>
          ))
        ) : jobs && jobs.length > 0 ? (
          jobs.map((job) => <JobCard key={job.id} job={job} />)
        ) : (
          <div className="px-6 py-16 text-center">
            <p className="text-muted-foreground">No items found matching your filters.</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Try broadening your search or clearing filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}
