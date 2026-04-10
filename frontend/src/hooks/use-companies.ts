import { useQuery } from "@tanstack/react-query";
import { getCompanies } from "@/services/companies.service";

export function useCompanies(search?: string) {
  return useQuery({
    queryKey: ["companies", search],
    queryFn: () => getCompanies(search),
  });
}
