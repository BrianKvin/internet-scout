import type { SourceStrategy, SourceType } from "@/types/source";

export const SOURCE_TYPE_LABELS: Record<SourceType, string> = {
  job_board: "Job Board",
  vc_portfolio: "VC Portfolio",
};

export const SOURCE_STRATEGY_LABELS: Record<SourceStrategy, string> = {
  yc: "Y Combinator",
  generic_jobs: "Generic Jobs",
  generic_portfolio: "Generic Portfolio",
  playwright_portfolio: "Playwright Portfolio",
  hn_hiring: "HN Who is Hiring",
};

export const SOURCE_BADGE_COLORS: Record<string, string> = {
  src_yc: "bg-green-100 text-green-800",
  src_seq: "bg-gray-100 text-gray-800",
  src_pear: "bg-orange-100 text-orange-800",
  src_wf: "bg-blue-100 text-blue-800",
  src_a16z: "bg-purple-100 text-purple-800",
  src_ls: "bg-indigo-100 text-indigo-800",
  src_accel: "bg-cyan-100 text-cyan-800",
  src_gv: "bg-red-100 text-red-800",
  src_hn: "bg-amber-100 text-amber-800",
  src_remote: "bg-teal-100 text-teal-800",
};

export const SOURCE_SHORT_NAMES: Record<string, string> = {
  src_yc: "YC",
  src_seq: "SEQ",
  src_pear: "PEAR",
  src_wf: "WF",
  src_a16z: "A16Z",
  src_ls: "LS",
  src_accel: "ACCEL",
  src_gv: "GV",
  src_hn: "HN",
  src_remote: "ROK",
};

export const TAG_OPTIONS = ["remote", "new", "hot"] as const;
export type TagOption = (typeof TAG_OPTIONS)[number];
