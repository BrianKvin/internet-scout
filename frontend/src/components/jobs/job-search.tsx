"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface JobSearchProps {
  value: string;
  onChange: (value: string) => void;
}

export function JobSearch({ value, onChange }: JobSearchProps) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        placeholder="Search roles, companies..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-9"
      />
    </div>
  );
}
