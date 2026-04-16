import { request } from "@/services/api";
import {
  mapCollection,
  mapCollectionItem,
  type ApiCollection,
  type ApiCollectionItem,
} from "@/services/mappers";
import type { Collection, CollectionItem } from "@/types/collection";

export async function getCollections(): Promise<Collection[]> {
  const rows = await request<ApiCollection[]>("/collections/");
  return rows.map(mapCollection);
}

export interface CollectionItemsResult {
  items: CollectionItem[];
  total: number;
  page: number;
  pageSize: number;
}

interface ApiCollectionItemsResult {
  items: ApiCollectionItem[];
  total: number;
  page: number;
  page_size: number;
}

export async function getCollectionItems(
  collectionId: string,
  options?: { search?: string; page?: number; pageSize?: number }
): Promise<CollectionItemsResult> {
  const params = new URLSearchParams();
  if (options?.search) params.set("search", options.search);
  params.set("page", String(options?.page ?? 1));
  params.set("limit", String(options?.pageSize ?? 50));

  const data = await request<ApiCollectionItemsResult>(
    `/collections/${collectionId}/items?${params.toString()}`
  );

  return {
    items: data.items.map(mapCollectionItem),
    total: data.total,
    page: data.page,
    pageSize: data.page_size,
  };
}

export async function getCollectionItemsForExport(
  collectionId: string
): Promise<CollectionItem[]> {
  const data = await request<ApiCollectionItemsResult>(
    `/collections/${collectionId}/items?page=1&limit=10000`
  );
  return data.items.map(mapCollectionItem);
}
