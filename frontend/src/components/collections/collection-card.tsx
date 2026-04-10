"use client";

import { Database, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Collection } from "@/types/collection";

interface CollectionCardProps {
  collection: Collection;
  onClick: () => void;
}

export function CollectionCard({ collection, onClick }: CollectionCardProps) {
  const updatedLabel = new Date(collection.updatedAt).toLocaleDateString(
    "en-US",
    { month: "short", day: "numeric" }
  );

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{collection.name}</CardTitle>
        {collection.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {collection.description}
          </p>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3">
          {collection.category && (
            <Badge variant="secondary" className="text-xs capitalize">
              {collection.category}
            </Badge>
          )}
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Database className="h-3 w-3" />
            {collection.itemCount} items
          </span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {updatedLabel}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
