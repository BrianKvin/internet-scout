"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, Save, Play, FolderOpen } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useSources } from "@/hooks/use-sources";
import {
  usePreviewScrape,
  useCreateScrapeJob,
  useScrapeJobs,
  useRunScrapeJob,
} from "@/hooks/use-studio";
import { useDashboardNav } from "@/hooks/use-dashboard-nav";
import { SchedulePicker } from "./schedule-picker";
import {
  CollectionPicker,
  type CollectionSelection,
} from "./collection-picker";
import { ItemPreview } from "./item-preview";
import type { ScrapeJob } from "@/types/scrape-job";

const studioSchema = z.object({
  name: z.string().min(1, "Name is required"),
  keywords: z.string(),
  schedule: z.enum(["daily", "weekly", "manual"] as const),
  notify: z.boolean(),
});

type StudioFormValues = z.infer<typeof studioSchema>;

interface ScrapeStudioProps {
  navData?: Record<string, string>;
}

export function ScrapeStudio({ navData }: ScrapeStudioProps) {
  const { data: sources } = useSources();
  const { data: scrapeJobs } = useScrapeJobs();
  const previewMutation = usePreviewScrape();
  const createJob = useCreateScrapeJob();
  const runJob = useRunScrapeJob();
  const { navigate } = useDashboardNav();

  const [selectedSourceId, setSelectedSourceId] = useState<string>("");
  const [previewItems, setPreviewItems] = useState<
    Record<string, string | number | boolean | null>[]
  >([]);
  const [previewStats, setPreviewStats] = useState<{
    filtered: number;
    total: number;
  } | null>(null);
  const [collection, setCollection] = useState<CollectionSelection | null>(null);
  const [collectionError, setCollectionError] = useState<string | null>(null);

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
      keywords: "",
      schedule: "daily",
      notify: false,
    },
  });

  const currentSchedule = watch("schedule");
  const currentNotify = watch("notify");
  const currentKeywords = watch("keywords");

  // Pre-select source if navigated from Sources page
  useEffect(() => {
    if (navData?.sourceId && sources) {
      const source = sources.find((s) => s.id === navData.sourceId);
      if (source) {
        setSelectedSourceId(source.id);
        setValue("name", `${source.name} — Scrape Job`);
      }
    }
  }, [navData?.sourceId, sources, setValue]);

  const selectedSource = sources?.find((s) => s.id === selectedSourceId);

  const handlePreview = () => {
    if (!selectedSource) return;
    previewMutation.mutate(
      {
        url: selectedSource.url,
        strategy: selectedSource.strategy,
        keywords: currentKeywords,
      },
      {
        onSuccess: (result) => {
          setPreviewItems(result.items);
          setPreviewStats({
            filtered: result.filtered,
            total: result.total,
          });
        },
      }
    );
  };

  const onSubmit = (data: StudioFormValues) => {
    if (!selectedSourceId) {
      toast.error("Select a source first");
      return;
    }
    if (!collection) {
      setCollectionError("Collection is required");
      return;
    }
    setCollectionError(null);

    const keywordList = data.keywords
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);

    createJob.mutate(
      {
        name: data.name,
        sourceId: selectedSourceId,
        url: selectedSource?.url ?? "",
        instructions: "",
        keywords: keywordList,
        collectionId: collection.type === "existing" ? collection.id : null,
        newCollectionName: collection.type === "new" ? collection.name : null,
        schedule: data.schedule,
        notify: data.notify,
      },
      {
        onSuccess: () => {
          reset();
          setSelectedSourceId("");
          setCollection(null);
          setPreviewItems([]);
          setPreviewStats(null);
          toast.success("Scrape job created");
        },
      }
    );
  };

  const handleRunJob = (job: ScrapeJob) => {
    void toast.promise(runJob.mutateAsync(job.id), {
      loading: `Running "${job.name}"...`,
      success: (result) => {
        if (result.scraped === 0) {
          return `Scrape complete — 0 new items. Results may have been filtered or deduped.`;
        }
        const parts = [`${result.scraped} new items added`];
        if (result.companiesAdded > 0) {
          parts.push(`${result.companiesAdded} companies extracted`);
        }
        return parts.join(". ");
      },
      error: (err) =>
        err instanceof Error ? err.message : "Scrape failed",
    });
  };

  const handleViewCollection = (collectionId: string) => {
    navigate("collections", { collectionId });
  };

  return (
    <div className="grid gap-6 p-6 lg:grid-cols-2">
      {/* Left: Create Job Form */}
      <div className="flex flex-col gap-4">
        <h2 className="text-sm font-medium">Scrape Studio</h2>
        <p className="text-xs text-muted-foreground">
          Select a source, add keyword filters, preview results, and save as a
          scheduled scrape job.
        </p>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
        >
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Source</label>
            <Select
              value={selectedSourceId}
              onValueChange={(v) => {
                if (v) {
                  setSelectedSourceId(v);
                  const src = sources?.find((s) => s.id === v);
                  if (src) setValue("name", `${src.name} — Scrape Job`);
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a source to scrape" />
              </SelectTrigger>
              <SelectContent>
                {sources?.filter((s) => s.enabled).map((source) => (
                  <SelectItem key={source.id} value={source.id}>
                    {source.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedSource && (
              <p className="text-xs text-muted-foreground truncate">
                {selectedSource.url} — {selectedSource.strategy}
              </p>
            )}
            {!selectedSourceId && sources?.filter((s) => s.enabled).length === 0 && (
              <p className="text-xs text-muted-foreground">
                No enabled sources. Add one in the Sources tab first.
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="studio-name" className="text-sm font-medium">
              Job Name
            </label>
            <Input
              id="studio-name"
              placeholder="e.g. Data Science Jobs — Kenya"
              {...register("name")}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="studio-keywords" className="text-sm font-medium">
              Keywords
              <span className="font-normal text-muted-foreground ml-1">
                (comma-separated, optional)
              </span>
            </label>
            <Input
              id="studio-keywords"
              placeholder="e.g. data science, python, machine learning"
              {...register("keywords")}
            />
            <p className="text-xs text-muted-foreground">
              Only items matching at least one keyword will be kept.
              Leave empty to keep all results.
            </p>
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
              value={collection}
              onChange={(v) => {
                setCollection(v);
                if (v) setCollectionError(null);
              }}
            />
            {collectionError && (
              <p className="text-xs text-destructive">{collectionError}</p>
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
              disabled={!selectedSourceId || previewMutation.isPending}
            >
              <Eye className="h-4 w-4 mr-1" />
              {previewMutation.isPending ? "Loading..." : "Preview"}
            </Button>
            <Button type="submit" disabled={createJob.isPending || !selectedSourceId}>
              <Save className="h-4 w-4 mr-1" />
              {createJob.isPending ? "Saving..." : "Save Job"}
            </Button>
          </div>
        </form>
      </div>

      {/* Right: Preview + Saved Jobs */}
      <div className="flex flex-col gap-6">
        {/* Preview section */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Preview</h3>
            {previewStats && (
              <span className="text-xs text-muted-foreground">
                {previewStats.filtered} of {previewStats.total} items
                {currentKeywords ? " (filtered)" : ""}
              </span>
            )}
          </div>
          <ItemPreview items={previewItems} />
        </div>

        {/* Saved scrape jobs */}
        {scrapeJobs && scrapeJobs.length > 0 && (
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-medium">Saved Scrape Jobs</h3>
            <div className="flex flex-col gap-2">
              {scrapeJobs.map((job) => (
                <div
                  key={job.id}
                  className="flex items-center gap-3 rounded-lg border p-3"
                >
                  <div className="flex flex-col gap-1 min-w-0 flex-1">
                    <span className="text-sm font-medium truncate">
                      {job.name}
                    </span>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="truncate max-w-[200px]">{job.url}</span>
                      <Badge variant="outline" className="text-xs shrink-0">
                        {job.schedule}
                      </Badge>
                      {job.keywords.length > 0 && (
                        <Badge variant="secondary" className="text-xs shrink-0">
                          {job.keywords.length} keyword{job.keywords.length > 1 ? "s" : ""}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {job.collectionId && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        title="View collection"
                        onClick={() => handleViewCollection(job.collectionId)}
                      >
                        <FolderOpen className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      title="Run now"
                      onClick={() => handleRunJob(job)}
                      disabled={runJob.isPending}
                    >
                      <Play className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
