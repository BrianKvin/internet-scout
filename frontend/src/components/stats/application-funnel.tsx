"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PIPELINE_STAGE_LABELS } from "@/lib/constants";
import type { FunnelStats } from "@/types/stats";
import type { PipelineStage } from "@/types/pipeline";

interface ApplicationFunnelProps {
  data: FunnelStats;
}

export function ApplicationFunnel({ data }: ApplicationFunnelProps) {
  const chartData = (
    Object.entries(data) as [PipelineStage, number][]
  ).map(([stage, count]) => ({
    stage: PIPELINE_STAGE_LABELS[stage],
    count,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Application Funnel</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis
                dataKey="stage"
                type="category"
                tick={{ fontSize: 12 }}
                width={100}
              />
              <Tooltip
                contentStyle={{
                  fontSize: 12,
                  borderRadius: 8,
                  border: "1px solid hsl(var(--border))",
                }}
              />
              <Bar
                dataKey="count"
                fill="hsl(var(--primary))"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
