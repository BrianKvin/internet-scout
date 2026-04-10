import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getNotificationSettings,
  updateNotificationSettings,
} from "@/services/notifications.service";
import type { NotificationSettings } from "@/types/notification";

export function useNotificationSettings() {
  return useQuery({
    queryKey: ["notification-settings"],
    queryFn: getNotificationSettings,
  });
}

export function useUpdateNotificationSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (updates: Partial<NotificationSettings>) =>
      updateNotificationSettings(updates),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["notification-settings"],
      });
    },
  });
}
