"use client";

import { createContext, useContext } from "react";

export interface DashboardNavContext {
  navigate: (section: string, data?: Record<string, string>) => void;
}

export const DashboardNavCtx = createContext<DashboardNavContext | null>(null);

export function useDashboardNav(): DashboardNavContext {
  const ctx = useContext(DashboardNavCtx);
  if (!ctx) {
    throw new Error("useDashboardNav must be used within DashboardNavCtx.Provider");
  }
  return ctx;
}
