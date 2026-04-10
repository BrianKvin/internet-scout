import { DUMMY_NOTIFICATION_SETTINGS } from "@/data/notifications";
import type { NotificationSettings } from "@/types/notification";

let settings = { ...DUMMY_NOTIFICATION_SETTINGS };

export async function getNotificationSettings(): Promise<NotificationSettings> {
  return { ...settings };
}

export async function updateNotificationSettings(
  updates: Partial<NotificationSettings>
): Promise<NotificationSettings> {
  settings = { ...settings, ...updates };
  return { ...settings };
}
