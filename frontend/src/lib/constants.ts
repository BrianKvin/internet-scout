import type { SourceStrategy, SourceType } from "@/types/source";

export const SOURCE_TYPE_LABELS: Record<SourceType, string> = {
  job_board: "Job Board",
  vc_portfolio: "VC Portfolio",
  government: "Government",
  news: "News & Media",
  directory: "Directory",
  regulatory: "Regulatory",
  environment: "Environment",
  research: "Research",
  custom: "Custom",
};

export const SOURCE_STRATEGY_LABELS: Record<SourceStrategy, string> = {
  yc: "Y Combinator",
  generic_jobs: "Generic Jobs",
  generic_portfolio: "Generic Portfolio",
  playwright_portfolio: "Playwright Portfolio",
  hn_hiring: "HN Who is Hiring",
  generic_table: "HTML Table",
  generic_list: "List / Repeating Blocks",
  rss_feed: "RSS / Atom Feed",
  pdf_extract: "PDF Extract",
  playwright_spa: "Playwright SPA",
  api_json: "JSON API",
};

export const STRATEGY_BY_TYPE: Record<SourceType, SourceStrategy[]> = {
  job_board: ["yc", "generic_jobs", "hn_hiring", "playwright_spa"],
  vc_portfolio: ["generic_portfolio", "playwright_portfolio"],
  government: ["generic_table", "playwright_spa", "pdf_extract"],
  news: ["rss_feed", "generic_list", "playwright_spa"],
  directory: ["generic_list", "generic_table", "playwright_spa"],
  regulatory: ["generic_table", "pdf_extract", "api_json"],
  environment: ["generic_table", "rss_feed", "api_json"],
  research: ["generic_list", "rss_feed", "pdf_extract"],
  custom: [
    "generic_list",
    "generic_table",
    "playwright_spa",
    "api_json",
    "rss_feed",
    "pdf_extract",
  ],
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
  src_nema: "bg-emerald-100 text-emerald-800",
  src_cbk: "bg-yellow-100 text-yellow-800",
  src_ppra: "bg-sky-100 text-sky-800",
  src_bdafrica: "bg-rose-100 text-rose-800",
  src_nse: "bg-violet-100 text-violet-800",
  src_gazette: "bg-slate-100 text-slate-800",
  src_unep: "bg-lime-100 text-lime-800",
  src_agpo: "bg-fuchsia-100 text-fuchsia-800",
  src_knbs: "bg-zinc-100 text-zinc-800",
  src_ngobrd: "bg-pink-100 text-pink-800",
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
  src_nema: "NEMA",
  src_cbk: "CBK",
  src_ppra: "PPRA",
  src_bdafrica: "BDA",
  src_nse: "NSE",
  src_gazette: "GAZ",
  src_unep: "UNEP",
  src_agpo: "AGPO",
  src_knbs: "KNBS",
  src_ngobrd: "NGOB",
};

export const TAG_OPTIONS = ["remote", "new", "hot"] as const;
export type TagOption = (typeof TAG_OPTIONS)[number];
