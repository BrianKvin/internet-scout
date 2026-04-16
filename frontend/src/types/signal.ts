export type SignalType =
  | "funding_round"
  | "news"
  | "hiring_surge"
  | "github_activity"
  | "regulatory_change"
  | "environmental_alert"
  | "tender_deadline";

export interface Signal {
  id: string;
  companyId: string;
  type: SignalType;
  title: string;
  detail: string | null;
  amount: string | null;
  sourceUrl: string | null;
  detectedAt: string;
}
