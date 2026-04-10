"use client";

import { useState } from "react";
import { ArrowLeft, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCollectionItems } from "@/hooks/use-collections";
import { useDebounce } from "@/hooks/use-debounce";
import { ExportButton } from "./export-button";
import type { Collection } from "@/types/collection";

interface CollectionDetailProps {
  collection: Collection;
  onBack: () => void;
}

export function CollectionDetail({
  collection,
  onBack,
}: CollectionDetailProps) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 300);

  const { data: result, isLoading } = useCollectionItems(collection.id, {
    search: debouncedSearch || undefined,
    page,
    pageSize: 20,
  });

  const items = result?.items ?? [];
  const total = result?.total ?? 0;

  // Derive columns from items
  const columns =
    items.length > 0
      ? Object.keys(items[0]?.data ?? {})
      : [];

  const totalPages = Math.max(1, Math.ceil(total / 20));

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <div className="flex-1">
          <h2 className="text-base font-medium">{collection.name}</h2>
          <p className="text-xs text-muted-foreground">
            {total} items
          </p>
        </div>
        <ExportButton
          collectionId={collection.id}
          collectionName={collection.name}
        />
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search items..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : items.length > 0 ? (
        <>
          <div className="rounded-md border overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map((col) => (
                    <TableHead
                      key={col}
                      className="text-xs capitalize whitespace-nowrap"
                    >
                      {col.replace(/_/g, " ")}
                    </TableHead>
                  ))}
                  <TableHead className="text-xs">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    {columns.map((col) => (
                      <TableCell
                        key={col}
                        className="text-xs whitespace-nowrap"
                      >
                        {String(item.data[col] ?? "")}
                      </TableCell>
                    ))}
                    <TableCell>
                      {item.isNew && (
                        <Badge
                          variant="secondary"
                          className="text-xs bg-green-100 text-green-800"
                        >
                          new
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="py-12 text-center text-muted-foreground">
          No items found.
        </div>
      )}
    </div>
  );
}
