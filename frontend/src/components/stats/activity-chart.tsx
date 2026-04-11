"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ScrapeRun } from "@/types/activity";

interface ActivityChartProps {
  data: ScrapeRun[];
}

interface DayBucket {
  date: string;
  success: number;
  partial: number;
  failed: number;
}

export function ActivityChart({ data }: ActivityChartProps) {
  const buckets = new Map<string, DayBucket>();

  for (const run of data) {
    const date = new Date(run.startedAt).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    const existing = buckets.get(date) ?? { date, success: 0, partial: 0, failed: 0 };
    if (run.status === "success") existing.success++;
    else if (run.status === "partial") existing.partial++;
    else if (run.status === "failed") existing.failed++;
    buckets.set(date, existing);
  }

  const chartData = Array.from(buckets.values()).reverse();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Scrape Runs by Day</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="date" className="text-xs" tick={{ fontSize: 12 }} />
              <YAxis className="text-xs" tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  fontSize: 12,
                  borderRadius: 8,
                  border: "1px solid hsl(var(--border))",
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="success" stackId="a" fill="hsl(142, 71%, 45%)" radius={[0, 0, 0, 0]} />
              <Bar dataKey="partial" stackId="a" fill="hsl(38, 92%, 50%)" radius={[0, 0, 0, 0]} />
              <Bar dataKey="failed" stackId="a" fill="hsl(0, 72%, 51%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
