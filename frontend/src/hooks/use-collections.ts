import { useQuery } from "@tanstack/react-query";
import {
  getCollections,
  getCollectionItems,
} from "@/services/collections.service";

export function useCollections() {
  return useQuery({
    queryKey: ["collections"],
    queryFn: getCollections,
  });
}

export function useCollectionItems(
  collectionId: string,
  options?: { search?: string; page?: number; pageSize?: number }
) {
  return useQuery({
    queryKey: ["collection-items", collectionId, options],
    queryFn: () => getCollectionItems(collectionId, options),
    enabled: !!collectionId,
  });
}
