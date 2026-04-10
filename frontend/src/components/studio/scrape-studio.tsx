"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { SOURCE_STRATEGY_LABELS } from "@/lib/constants";
import { usePreviewScrape, useCreateScrapeJob } from "@/hooks/use-studio";
import { SchedulePicker } from "./schedule-picker";
import { CollectionPicker } from "./collection-picker";
import { ItemPreview } from "./item-preview";
import type { SourceStrategy } from "@/types/source";

const studioSchema = z.object({
  name: z.string().min(1, "Name is required"),
  url: z.string().url("Must be a valid URL"),
  strategy: z.enum([
    "yc",
    "generic_jobs",
    "generic_portfolio",
    "playwright_portfolio",
    "hn_hiring",
  ] as const),
  schedule: z.enum(["daily", "weekly", "manual"] as const),
  collectionName: z.string().min(1, "Collection is required"),
  notify: z.boolean(),
});

type StudioFormValues = z.infer<typeof studioSchema>;

export function ScrapeStudio() {
  const previewMutation = usePreviewScrape();
  const createJob = useCreateScrapeJob();
  const [previewItems, setPreviewItems] = useState<
    Record<string, string | number | boolean | null>[]
  >([]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<StudioFormValues>({
    resolver: zodResolver(studioSchema),
    defaultValues: {
      name: "",
      url: "",
      strategy: "generic_jobs",
      schedule: "daily",
      collectionName: "",
      notify: false,
    },
  });

  const currentStrategy = watch("strategy");
  const currentSchedule = watch("schedule");
  const currentNotify = watch("notify");
  const currentCollectionName = watch("collectionName");
  const currentUrl = watch("url");

  const handlePreview = () => {
    previewMutation.mutate(
      { url: currentUrl, strategy: currentStrategy },
      {
        onSuccess: (items) => {
          setPreviewItems(items);
        },
      }
    );
  };

  const onSubmit = (data: StudioFormValues) => {
    createJob.mutate(
      {
        name: data.name,
        url: data.url,
        instructions: `Strategy: ${data.strategy}`,
        collectionName: data.collectionName,
        schedule: data.schedule,
        notify: data.notify,
      },
      {
        onSuccess: () => {
          reset();
          setPreviewItems([]);
        },
      }
    );
  };

  return (
    <div className="grid gap-6 p-6 lg:grid-cols-2">
      <div className="flex flex-col gap-4">
        <h2 className="text-sm font-medium">Scrape Studio</h2>
        <p className="text-xs text-muted-foreground">
          Add any URL, pick a strategy, preview results, and save as a scheduled
          scrape job.
        </p>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
        >
          <div className="flex flex-col gap-1.5">
            <label htmlFor="studio-name" className="text-sm font-medium">
              Name
            </label>
            <Input
              id="studio-name"
              placeholder="e.g. Kenya Finance Directory"
              {...register("name")}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="studio-url" className="text-sm font-medium">
              URL
            </label>
            <Input
              id="studio-url"
              placeholder="https://..."
              {...register("url")}
            />
            {errors.url && (
              <p className="text-xs text-destructive">{errors.url.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Strategy</label>
            <Select
              value={currentStrategy}
              onValueChange={(v) => {
                if (v) setValue("strategy", v as SourceStrategy);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(
                  Object.entries(SOURCE_STRATEGY_LABELS) as [
                    SourceStrategy,
                    string,
                  ][]
                ).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Schedule</label>
            <SchedulePicker
              value={currentSchedule}
              onChange={(v) => setValue("schedule", v)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Collection</label>
            <CollectionPicker
              value={currentCollectionName}
              onChange={(v) => setValue("collectionName", v)}
            />
            {errors.collectionName && (
              <p className="text-xs text-destructive">
                {errors.collectionName.message}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Switch
              checked={currentNotify}
              onCheckedChange={(v) => setValue("notify", v)}
            />
            <label className="text-sm">Notify on new items</label>
          </div>

          <div className="flex gap-2 mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handlePreview}
              disabled={!currentUrl || previewMutation.isPending}
            >
              <Eye className="h-4 w-4 mr-1" />
              {previewMutation.isPending ? "Loading..." : "Preview"}
            </Button>
            <Button type="submit" disabled={createJob.isPending}>
              <Save className="h-4 w-4 mr-1" />
              {createJob.isPending ? "Saving..." : "Save Job"}
            </Button>
          </div>
        </form>
      </div>

      <div className="flex flex-col gap-4">
        <h3 className="text-sm font-medium">Preview Results</h3>
        <ItemPreview items={previewItems} />
      </div>
    </div>
  );
}
