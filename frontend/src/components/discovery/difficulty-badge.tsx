"use client";

import { Badge } from "@/components/ui/badge";
import type { DifficultyLevel } from "@/types/discovery";

const DIFFICULTY_STYLES: Record<DifficultyLevel, string> = {
  easy: "bg-green-100 text-green-800",
  moderate: "bg-yellow-100 text-yellow-800",
  hard: "bg-red-100 text-red-800",
};

interface DifficultyBadgeProps {
  level: DifficultyLevel;
}

export function DifficultyBadge({ level }: DifficultyBadgeProps) {
  return (
    <Badge variant="outline" className={`text-xs ${DIFFICULTY_STYLES[level]}`}>
      {level}
    </Badge>
  );
}
