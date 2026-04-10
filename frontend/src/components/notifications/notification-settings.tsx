"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useNotificationSettings,
  useUpdateNotificationSettings,
} from "@/hooks/use-notifications";
import { useEffect } from "react";

const notificationSchema = z.object({
  digestEnabled: z.boolean(),
  digestEmail: z.string().email("Must be a valid email").or(z.literal("")),
  digestTime: z.string(),
  slackWebhookUrl: z.string().url("Must be a valid URL").or(z.literal("")).nullable(),
  slackEnabled: z.boolean(),
});

type NotificationFormValues = z.infer<typeof notificationSchema>;

export function NotificationSettingsForm() {
  const { data: settings, isLoading } = useNotificationSettings();
  const updateSettings = useUpdateNotificationSettings();

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } =
    useForm<NotificationFormValues>({
      resolver: zodResolver(notificationSchema),
      defaultValues: {
        digestEnabled: false,
        digestEmail: "",
        digestTime: "07:00",
        slackWebhookUrl: null,
        slackEnabled: false,
      },
    });

  useEffect(() => {
    if (settings) {
      reset({
        digestEnabled: settings.digestEnabled,
        digestEmail: settings.digestEmail,
        digestTime: settings.digestTime,
        slackWebhookUrl: settings.slackWebhookUrl,
        slackEnabled: settings.slackEnabled,
      });
    }
  }, [settings, reset]);

  const digestEnabled = watch("digestEnabled");
  const slackEnabled = watch("slackEnabled");

  const onSubmit = (data: NotificationFormValues) => {
    updateSettings.mutate({
      digestEnabled: data.digestEnabled,
      digestEmail: data.digestEmail,
      digestTime: data.digestTime,
      slackWebhookUrl: data.slackWebhookUrl || null,
      slackEnabled: data.slackEnabled,
    });
  };

  if (isLoading) {
    return (
      <div className="grid gap-6 p-6 max-w-2xl">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="grid gap-6 p-6 max-w-2xl"
    >
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Daily Digest</CardTitle>
            <Switch
              checked={digestEnabled}
              onCheckedChange={(v) => setValue("digestEnabled", v)}
            />
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="digest-email" className="text-sm font-medium">
              Email
            </label>
            <Input
              id="digest-email"
              type="email"
              placeholder="you@example.com"
              disabled={!digestEnabled}
              {...register("digestEmail")}
            />
            {errors.digestEmail && (
              <p className="text-xs text-destructive">
                {errors.digestEmail.message}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="digest-time" className="text-sm font-medium">
              Send at
            </label>
            <Input
              id="digest-time"
              type="time"
              disabled={!digestEnabled}
              {...register("digestTime")}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Slack Alerts</CardTitle>
            <Switch
              checked={slackEnabled}
              onCheckedChange={(v) => setValue("slackEnabled", v)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="slack-webhook" className="text-sm font-medium">
              Webhook URL
            </label>
            <Input
              id="slack-webhook"
              placeholder="https://hooks.slack.com/services/..."
              disabled={!slackEnabled}
              {...register("slackWebhookUrl")}
            />
            {errors.slackWebhookUrl && (
              <p className="text-xs text-destructive">
                {errors.slackWebhookUrl.message}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Button
        type="submit"
        className="w-fit"
        disabled={updateSettings.isPending}
      >
        <Save className="h-4 w-4 mr-1" />
        {updateSettings.isPending ? "Saving..." : "Save Settings"}
      </Button>
    </form>
  );
}
