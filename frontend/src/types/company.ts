export interface Company {
  id: string;
  name: string;
  domain: string | null;
  website: string | null;
  careersUrl: string | null;
  sourceId: string;
  sector: string | null;
  stage: string | null;
  enriched: boolean;
  enrichedAt: string | null;
  createdAt: string;
}
