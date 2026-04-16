import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  searchSources,
  addDiscoveredSource,
  getCatalogFilters,
} from "@/services/discovery.service";
import type { DiscoveryQuery } from "@/types/discovery";

export function useCatalogFilters() {
  return useQuery({
    queryKey: ["catalog-filters"],
    queryFn: getCatalogFilters,
  });
}

export function useDiscoverySearch() {
  return useMutation({
    mutationFn: (query: DiscoveryQuery) => searchSources(query),
  });
}

export function useAddDiscoveredSource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sourceId: string) => addDiscoveredSource(sourceId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["sources"] });
    },
  });
}
