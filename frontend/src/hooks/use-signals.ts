import { useQuery } from "@tanstack/react-query";
import { getSignals } from "@/services/signals.service";

export function useSignals(companyId?: string) {
  return useQuery({
    queryKey: ["signals", companyId],
    queryFn: () => getSignals(companyId),
  });
}
