import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getPipeline, updateStage } from "@/services/pipeline.service";
import type { PipelineStage } from "@/types/pipeline";

export function usePipeline() {
  return useQuery({
    queryKey: ["pipeline"],
    queryFn: getPipeline,
  });
}

export function useUpdateStage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, stage }: { id: string; stage: PipelineStage }) =>
      updateStage(id, stage),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["pipeline"] });
      void queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
  });
}
