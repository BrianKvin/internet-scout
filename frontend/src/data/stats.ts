import type { SourcePerformance } from "@/types/stats";

export const DUMMY_SOURCE_PERFORMANCE: SourcePerformance[] = [
  {
    sourceId: "src_yc",
    sourceName: "Y Combinator",
    itemsPerRun: [12, 15, 8, 14, 11, 13, 10],
    lastRunItems: 3,
    healthHistory: ["ok", "ok", "ok", "ok", "ok"],
  },
  {
    sourceId: "src_seq",
    sourceName: "Sequoia Capital",
    itemsPerRun: [6, 8, 5, 7, 9, 6, 8],
    lastRunItems: 2,
    healthHistory: ["ok", "ok", "ok", "ok", "ok"],
  },
  {
    sourceId: "src_pear",
    sourceName: "Pear VC",
    itemsPerRun: [10, 7, 12, 9, 11, 8, 10],
    lastRunItems: 3,
    healthHistory: ["ok", "ok", "warning", "ok", "ok"],
  },
  {
    sourceId: "src_nema",
    sourceName: "NEMA Kenya",
    itemsPerRun: [5, 7, 3, 6, 4, 7],
    lastRunItems: 7,
    healthHistory: ["ok", "ok", "ok", "ok", "ok"],
  },
  {
    sourceId: "src_cbk",
    sourceName: "Central Bank of Kenya",
    itemsPerRun: [3, 4, 2, 4, 3, 4],
    lastRunItems: 4,
    healthHistory: ["ok", "ok", "ok", "ok", "ok"],
  },
  {
    sourceId: "src_ppra",
    sourceName: "PPRA Tenders",
    itemsPerRun: [8, 12, 15, 10, 14, 15],
    lastRunItems: 15,
    healthHistory: ["ok", "ok", "ok", "ok", "ok"],
  },
  {
    sourceId: "src_bdafrica",
    sourceName: "Business Daily Africa",
    itemsPerRun: [18, 22, 0, 20, 24],
    lastRunItems: 24,
    healthHistory: ["ok", "ok", "warning", "ok", "ok"],
  },
  {
    sourceId: "src_agpo",
    sourceName: "AGPO Portal",
    itemsPerRun: [4, 6, 3, 6],
    lastRunItems: 6,
    healthHistory: ["ok", "warning", "ok", "warning"],
  },
];
