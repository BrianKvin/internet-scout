import { DUMMY_COLLECTIONS, DUMMY_COLLECTION_ITEMS } from "@/data/collections";
import type { Collection, CollectionItem } from "@/types/collection";

export async function getCollections(): Promise<Collection[]> {
  return [...DUMMY_COLLECTIONS];
}

export interface CollectionItemsResult {
  items: CollectionItem[];
  total: number;
  page: number;
  pageSize: number;
}

export async function getCollectionItems(
  collectionId: string,
  options?: { search?: string; page?: number; pageSize?: number }
): Promise<CollectionItemsResult> {
  const page = options?.page ?? 1;
  const pageSize = options?.pageSize ?? 50;

  let items = DUMMY_COLLECTION_ITEMS.filter(
    (i) => i.collectionId === collectionId
  );

  if (options?.search) {
    const q = options.search.toLowerCase();
    items = items.filter((item) =>
      Object.values(item.data).some(
        (val) => typeof val === "string" && val.toLowerCase().includes(q)
      )
    );
  }

  const total = items.length;
  const start = (page - 1) * pageSize;
  const paged = items.slice(start, start + pageSize);

  return { items: paged, total, page, pageSize };
}

export async function getCollectionItemsForExport(
  collectionId: string
): Promise<CollectionItem[]> {
  return DUMMY_COLLECTION_ITEMS.filter(
    (i) => i.collectionId === collectionId
  );
}
