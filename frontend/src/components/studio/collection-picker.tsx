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

interface CollectionPickerProps {
  value: string;
  onChange: (value: string) => void;
}

export function CollectionPicker({ value, onChange }: CollectionPickerProps) {
  const { data: collections } = useCollections();
  const [isCustom, setIsCustom] = useState(false);

  if (isCustom) {
    return (
      <div className="flex gap-2">
        <Input
          placeholder="New collection name"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1"
        />
        <button
          type="button"
          onClick={() => {
            setIsCustom(false);
            onChange("");
          }}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <Select value={value} onValueChange={(v) => { if (v) onChange(v); }}>
        <SelectTrigger className="flex-1">
          <SelectValue placeholder="Select a collection" />
        </SelectTrigger>
        <SelectContent>
          {collections?.map((col) => (
            <SelectItem key={col.id} value={col.name}>
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
