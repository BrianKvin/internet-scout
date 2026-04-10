"use client";

import { cn } from "@/lib/utils";

type Schedule = "daily" | "weekly" | "manual";

interface SchedulePickerProps {
  value: Schedule;
  onChange: (value: Schedule) => void;
}

const OPTIONS: { value: Schedule; label: string }[] = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "manual", label: "Manual" },
];

export function SchedulePicker({ value, onChange }: SchedulePickerProps) {
  return (
    <div className="flex gap-2">
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            "rounded-md border px-3 py-1.5 text-sm transition-colors",
            value === option.value
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-background text-muted-foreground hover:bg-accent"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
