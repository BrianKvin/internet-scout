import type { SourceStrategy, SourceType } from "./source";

export type DifficultyLevel = "easy" | "moderate" | "hard";

export interface DiscoveredSource {
  id: string;
  name: string;
  url: string;
  description: string;
  type: SourceType;
  suggestedStrategy: SourceStrategy;
  difficulty: DifficultyLevel;
  freshness: "daily" | "weekly" | "monthly" | "unknown";
  legalNote: string | null;
  category: string;
  region: string | null;
}

export interface DiscoveryQuery {
  query: string;
  category?: string;
  region?: string;
}

export interface CatalogFilters {
  categories: { value: string; count: number }[];
  regions: { value: string; count: number }[];
}
