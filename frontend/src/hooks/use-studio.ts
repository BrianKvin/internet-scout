import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getScrapeJobs,
  previewScrape,
  createScrapeJob,
  runScrapeJob,
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
    mutationFn: ({
      url,
      strategy,
      keywords,
    }: {
      url: string;
      strategy: string;
      keywords?: string;
    }) => previewScrape(url, strategy, keywords),
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

export function useRunScrapeJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (jobId: string) => runScrapeJob(jobId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["scrape-jobs"] });
      void queryClient.invalidateQueries({ queryKey: ["collections"] });
      void queryClient.invalidateQueries({ queryKey: ["companies"] });
      void queryClient.invalidateQueries({ queryKey: ["jobs"] });
      void queryClient.invalidateQueries({ queryKey: ["stats"] });
      void queryClient.invalidateQueries({ queryKey: ["activity", "runs"] });
    },
  });
}
