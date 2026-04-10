import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getJobs, saveJob } from "@/services/jobs.service";
import type { JobFilters } from "@/types/job";

export function useJobs(filters?: JobFilters) {
  return useQuery({
    queryKey: ["jobs", filters],
    queryFn: () => getJobs(filters),
  });
}

export function useSaveJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => saveJob(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["jobs"] });
      void queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
  });
}
