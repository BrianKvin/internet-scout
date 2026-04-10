export interface Job {
  id: string;
  title: string;
  company: string;
  companyId: string;
  sourceId: string;
  dedupKey: string;
  location: string | null;
  salary: string | null;
  description: string | null;
  applyUrl: string;
  sector: string | null;
  stage: string | null;
  isNew: boolean;
  isRemote: boolean;
  savedAt: string | null;
  scrapedAt: string;
}

export interface JobFilters {
  search?: string;
  source?: string;
  tags?: string[];
}
