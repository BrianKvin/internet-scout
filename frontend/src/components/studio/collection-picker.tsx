"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useCollections } from "@/hooks/use-collections";
import { useState } from "react";

export type CollectionSelection =
  | { type: "existing"; id: string }
  | { type: "new"; name: string };

interface CollectionPickerProps {
  value: CollectionSelection | null;
  onChange: (value: CollectionSelection | null) => void;
}

export function CollectionPicker({ value, onChange }: CollectionPickerProps) {
  const { data: collections } = useCollections();
  const [isCustom, setIsCustom] = useState(false);

  if (isCustom) {
    const customName = value?.type === "new" ? value.name : "";
    return (
      <div className="flex gap-2">
        <Input
          placeholder="New collection name"
          value={customName}
          onChange={(e) =>
            onChange(
              e.target.value
                ? { type: "new", name: e.target.value }
                : null
            )
          }
          className="flex-1"
        />
        <button
          type="button"
          onClick={() => {
            setIsCustom(false);
            onChange(null);
          }}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Cancel
        </button>
      </div>
    );
  }

  const selectedId = value?.type === "existing" ? value.id : "";

  return (
    <div className="flex gap-2">
      <Select
        value={selectedId}
        onValueChange={(v) => {
          if (v) onChange({ type: "existing", id: v });
        }}
      >
        <SelectTrigger className="flex-1">
          <SelectValue placeholder="Select a collection" />
        </SelectTrigger>
        <SelectContent>
          {collections?.map((col) => (
            <SelectItem key={col.id} value={col.id}>
              {col.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <button
        type="button"
        onClick={() => setIsCustom(true)}
        className="text-sm text-primary hover:underline whitespace-nowrap"
      >
        + New
      </button>
    </div>
  );
}
