export interface Collection {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CollectionItem {
  id: string;
  collectionId: string;
  scrapeJobId: string | null;
  data: Record<string, string | number | boolean | null>;
  isNew: boolean;
  scrapedAt: string;
}
