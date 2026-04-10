import { DUMMY_SIGNALS } from "@/data/signals";
import type { Signal } from "@/types/signal";

export async function getSignals(companyId?: string): Promise<Signal[]> {
  if (companyId) {
    return DUMMY_SIGNALS.filter((s) => s.companyId === companyId);
  }
  return [...DUMMY_SIGNALS];
}
