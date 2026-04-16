"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAddSource } from "@/hooks/use-sources";
import {
  SOURCE_TYPE_LABELS,
  SOURCE_STRATEGY_LABELS,
  STRATEGY_BY_TYPE,
} from "@/lib/constants";
import { SOURCE_TYPES, SOURCE_STRATEGIES } from "@/types/source";
import type { SourceStrategy, SourceType } from "@/types/source";

const sourceSchema = z.object({
  name: z.string().min(1, "Name is required"),
  url: z.string().url("Must be a valid URL"),
  type: z.enum(SOURCE_TYPES),
  strategy: z.enum(SOURCE_STRATEGIES),
});

type SourceFormValues = z.infer<typeof sourceSchema>;

interface SourceFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SourceForm({ open, onOpenChange }: SourceFormProps) {
  const addSource = useAddSource();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<SourceFormValues>({
    resolver: zodResolver(sourceSchema),
    defaultValues: {
      name: "",
      url: "",
      type: "custom",
      strategy: "generic_list",
    },
  });

  const currentType = watch("type");
  const currentStrategy = watch("strategy");

  useEffect(() => {
    const validStrategies = STRATEGY_BY_TYPE[currentType];
    if (!validStrategies.includes(currentStrategy) && validStrategies.length > 0) {
      setValue("strategy", validStrategies[0]!);
    }
  }, [currentType, currentStrategy, setValue]);

  const availableStrategies = STRATEGY_BY_TYPE[currentType];

  const onSubmit = (data: SourceFormValues) => {
    addSource.mutate(data, {
      onSuccess: () => {
        reset();
        onOpenChange(false);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Source</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="source-name" className="text-sm font-medium">
              Name
            </label>
            <Input
              id="source-name"
              placeholder="e.g. NEMA Kenya"
              {...register("name")}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="source-url" className="text-sm font-medium">
              URL
            </label>
            <Input
              id="source-url"
              placeholder="https://..."
              {...register("url")}
            />
            {errors.url && (
              <p className="text-xs text-destructive">{errors.url.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Type</label>
            <Select
              value={currentType}
              onValueChange={(value) => {
                if (value) setValue("type", value as SourceType);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(
                  Object.entries(SOURCE_TYPE_LABELS) as [SourceType, string][]
                ).map(([val, label]) => (
                  <SelectItem key={val} value={val}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Strategy</label>
            <Select
              value={currentStrategy}
              onValueChange={(value) => {
                if (value) setValue("strategy", value as SourceStrategy);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableStrategies.map((strategyKey) => (
                  <SelectItem key={strategyKey} value={strategyKey}>
                    {SOURCE_STRATEGY_LABELS[strategyKey]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={addSource.isPending}>
              {addSource.isPending ? "Adding..." : "Add Source"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
