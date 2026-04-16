import { MutationCache, QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError } from "@/services/api";

export function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        gcTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
        retry: 1,
      },
      mutations: {
        retry: 0,
      },
    },
    mutationCache: new MutationCache({
      onError: (error) => {
        // Global mutation error handler — shows a toast for every failed mutation.
        // Individual mutations can still override with their own onError.
        if (error instanceof ApiError) {
          // Don't toast 401s — the auth provider handles those with a redirect
          if (error.status === 401) return;
          toast.error(error.message);
        } else if (error instanceof Error) {
          toast.error(error.message || "Something went wrong");
        } else {
          toast.error("Something went wrong");
        }
      },
    }),
  });
}
