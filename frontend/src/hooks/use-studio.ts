import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getScrapeJobs,
  previewScrape,
  createScrapeJob,
} from "@/services/studio.service";
import type { ScrapeJobCreate } from "@/types/scrape-job";

export function useScrapeJobs() {
  return useQuery({
    queryKey: ["scrape-jobs"],
    queryFn: getScrapeJobs,
  });
}

export function usePreviewScrape() {
  return useMutation({
    mutationFn: ({ url, strategy }: { url: string; strategy: string }) =>
      previewScrape(url, strategy),
  });
}

export function useCreateScrapeJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: ScrapeJobCreate) => createScrapeJob(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["scrape-jobs"] });
      void queryClient.invalidateQueries({ queryKey: ["collections"] });
    },
  });
}
