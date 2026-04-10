export interface NotificationSettings {
  digestEnabled: boolean;
  digestEmail: string;
  digestTime: string;
  slackWebhookUrl: string | null;
  slackEnabled: boolean;
}
