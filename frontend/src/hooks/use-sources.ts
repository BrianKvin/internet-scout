import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getSources,
  addSource,
  toggleSource,
  deleteSource,
  scrapeSource,
} from "@/services/sources.service";
import type { SourceCreate } from "@/types/source";

export function useSources() {
  return useQuery({
    queryKey: ["sources"],
    queryFn: getSources,
  });
}

export function useAddSource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: SourceCreate) => addSource(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["sources"] });
    },
  });
}

export function useToggleSource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => toggleSource(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["sources"] });
    },
  });
}

export function useDeleteSource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteSource(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["sources"] });
    },
  });
}

export function useScrapeSource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => scrapeSource(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["sources"] });
      void queryClient.invalidateQueries({ queryKey: ["jobs"] });
      void queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
  });
}
