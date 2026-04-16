import { request } from "@/services/api";
import { mapSignal, type ApiSignal } from "@/services/mappers";
import type { Signal } from "@/types/signal";

export async function getSignals(companyId?: string): Promise<Signal[]> {
  const query = companyId ? `?company_id=${encodeURIComponent(companyId)}` : "";
  const rows = await request<ApiSignal[]>(`/signals/${query}`);
  return rows.map(mapSignal);
}
