"use client";

import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useCollections } from "@/hooks/use-collections";
import { CollectionCard } from "./collection-card";
import { CollectionDetail } from "./collection-detail";
import type { Collection } from "@/types/collection";

export function CollectionBrowser() {
  const { data: collections, isLoading } = useCollections();
  const [selectedCollection, setSelectedCollection] =
    useState<Collection | null>(null);

  if (selectedCollection) {
    return (
      <CollectionDetail
        collection={selectedCollection}
        onBack={() => setSelectedCollection(null)}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4 p-6">
      <div>
        <h2 className="text-sm font-medium">Collections</h2>
        <p className="text-xs text-muted-foreground">
          Browse all data collections created from scrape jobs.
        </p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-lg border p-6">
              <Skeleton className="h-5 w-40 mb-2" />
              <Skeleton className="h-3 w-full mb-4" />
              <div className="flex gap-2">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-5 w-20" />
              </div>
            </div>
          ))}
        </div>
      ) : collections && collections.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {collections.map((col) => (
            <CollectionCard
              key={col.id}
              collection={col}
              onClick={() => setSelectedCollection(col)}
            />
          ))}
        </div>
      ) : (
        <div className="py-12 text-center text-muted-foreground">
          No collections yet. Create one from the Studio tab.
        </div>
      )}
    </div>
  );
}
