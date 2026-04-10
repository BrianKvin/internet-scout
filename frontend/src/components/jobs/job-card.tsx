"use client";

import { Bookmark, ExternalLink, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { SOURCE_BADGE_COLORS, SOURCE_SHORT_NAMES } from "@/lib/constants";
import { useSaveJob } from "@/hooks/use-jobs";
import type { Job } from "@/types/job";

interface JobCardProps {
  job: Job;
}

export function JobCard({ job }: JobCardProps) {
  const saveJobMutation = useSaveJob();

  const badgeColor =
    SOURCE_BADGE_COLORS[job.sourceId] ?? "bg-gray-100 text-gray-800";
  const shortName = SOURCE_SHORT_NAMES[job.sourceId] ?? job.sourceId;

  const handleSave = () => {
    saveJobMutation.mutate(job.id);
  };

  return (
    <div className="flex items-center justify-between border-b px-6 py-4 hover:bg-accent/50 transition-colors">
      <div className="flex flex-col gap-1 min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="font-medium truncate">{job.title}</h3>
          {job.isNew && (
            <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
              new
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{job.company}</span>
          {job.location && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {job.location}
            </span>
          )}
          {job.salary && <span>{job.salary}</span>}
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0 ml-4">
        <Badge className={cn("text-xs font-medium", badgeColor)} variant="secondary">
          {shortName}
        </Badge>

        {job.isRemote && (
          <Badge variant="outline" className="text-xs">
            remote
          </Badge>
        )}

        {job.stage && (
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {job.stage}
          </span>
        )}

        <a
          href={job.applyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent transition-colors"
        >
          <ExternalLink className="h-4 w-4" />
        </a>

        <button
          onClick={handleSave}
          disabled={saveJobMutation.isPending}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium hover:bg-accent transition-colors disabled:opacity-50",
            job.savedAt && "text-primary"
          )}
        >
          <Bookmark
            className={cn("h-4 w-4", job.savedAt && "fill-current")}
          />
          {job.savedAt ? "SAVED" : "SAVE"}
        </button>
      </div>
    </div>
  );
}
