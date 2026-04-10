import type { NotificationSettings } from "@/types/notification";

export const DUMMY_NOTIFICATION_SETTINGS: NotificationSettings = {
  digestEnabled: true,
  digestEmail: "user@example.com",
  digestTime: "07:00",
  slackWebhookUrl: null,
  slackEnabled: false,
};
