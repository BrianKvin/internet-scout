import type { SourceHealth } from "./source";

export interface ScrapeJob {
  id: string;
  name: string;
  sourceId: string | null;
  url: string;
  instructions: string;
  keywords: string[];
  config: Record<string, string | number | boolean | null>;
  collectionId: string;
  schedule: "daily" | "weekly" | "manual";
  notify: boolean;
  lastRun: string | null;
  lastCount: number;
  health: SourceHealth;
  createdAt: string;
}

export interface ScrapeJobCreate {
  name: string;
  sourceId: string | null;
  url: string;
  instructions: string;
  keywords: string[];
  collectionId: string | null;
  newCollectionName: string | null;
  schedule: "daily" | "weekly" | "manual";
  notify: boolean;
}
