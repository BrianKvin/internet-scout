import type { SourceHealth } from "./source";

export interface ScrapeJob {
  id: string;
  name: string;
  url: string;
  instructions: string;
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
  url: string;
  instructions: string;
  collectionName: string;
  schedule: "daily" | "weekly" | "manual";
  notify: boolean;
}
