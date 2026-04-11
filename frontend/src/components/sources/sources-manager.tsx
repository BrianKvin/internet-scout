"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useSources } from "@/hooks/use-sources";
import { SourceRow } from "./source-row";
import { SourceForm } from "./source-form";

export function SourcesManager() {
  const { data: sources, isLoading } = useSources();
  const [formOpen, setFormOpen] = useState(false);

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 border-b">
        <div>
          <h2 className="text-sm font-medium">Scraper Sources</h2>
          <p className="text-xs text-muted-foreground">
            Manage the sources Startscout scrapes across all your targets.
          </p>
        </div>
        <Button size="sm" onClick={() => setFormOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Add Source
        </Button>
      </div>

      {isLoading ? (
        Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-6 py-4 border-b">
            <Skeleton className="h-5 w-10" />
            <div className="flex flex-col gap-2 flex-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-64" />
            </div>
            <Skeleton className="h-8 w-8" />
          </div>
        ))
      ) : sources && sources.length > 0 ? (
        sources.map((source) => (
          <SourceRow key={source.id} source={source} />
        ))
      ) : (
        <div className="px-6 py-12 text-center text-muted-foreground">
          No sources configured yet. Add one to get started.
        </div>
      )}

      <SourceForm open={formOpen} onOpenChange={setFormOpen} />
    </div>
  );
}
