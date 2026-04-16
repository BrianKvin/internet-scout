import { request } from "@/services/api";
import type { NotificationSettings } from "@/types/notification";

export async function getNotificationSettings(): Promise<NotificationSettings> {
  return request<NotificationSettings>("/notify/settings");
}

export async function updateNotificationSettings(
  updates: Partial<NotificationSettings>
): Promise<NotificationSettings> {
  return request<NotificationSettings>("/notify/settings", {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
}
