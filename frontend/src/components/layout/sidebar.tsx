"use client";

import {
  Rss,
  Building2,
  Activity,
  Compass,
  Globe,
  FlaskConical,
  FolderOpen,
  BarChart3,
  Bell,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface NavItem {
  id: string;
  label: string;
  icon: typeof Rss;
  group?: string;
}

export const NAV_ITEMS: NavItem[] = [
  { id: "feed", label: "Feed", icon: Rss, group: "Data" },
  { id: "companies", label: "Companies", icon: Building2, group: "Data" },
  { id: "activity", label: "Activity", icon: Activity, group: "Data" },
  { id: "discovery", label: "Discover", icon: Compass, group: "Manage" },
  { id: "sources", label: "Sources", icon: Globe, group: "Manage" },
  { id: "studio", label: "Studio", icon: FlaskConical, group: "Manage" },
  { id: "collections", label: "Collections", icon: FolderOpen, group: "Manage" },
  { id: "stats", label: "Stats", icon: BarChart3, group: "Monitor" },
  { id: "notifications", label: "Notifications", icon: Bell, group: "Monitor" },
];

interface SidebarProps {
  activeSection: string;
  onNavigate: (id: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export function Sidebar({
  activeSection,
  onNavigate,
  collapsed,
  onToggleCollapse,
}: SidebarProps) {
  // Pre-compute group header visibility without mutating any variable during render.
  const navItems = NAV_ITEMS.map((item, index) => {
    const prevGroup = index > 0 ? NAV_ITEMS[index - 1]?.group : undefined;
    const showGroup = !collapsed && Boolean(item.group) && item.group !== prevGroup;
    return { item, showGroup };
  });

  return (
    <aside
      className={cn(
        "flex flex-col border-r bg-muted/30 transition-all duration-200 shrink-0",
        collapsed ? "w-14" : "w-48"
      )}
    >
      <div className="flex-1 flex flex-col gap-1 px-2 py-3">
        {navItems.map(({ item, showGroup }) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;

          return (
            <div key={item.id}>
              {showGroup && (
                <span className="px-2 pt-4 pb-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60 block">
                  {item.group}
                </span>
              )}
              <button
                onClick={() => onNavigate(item.id)}
                title={collapsed ? item.label : undefined}
                className={cn(
                  "flex items-center gap-3 w-full rounded-md px-2.5 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </button>
            </div>
          );
        })}
      </div>

      <div className="border-t px-2 py-2">
        <button
          onClick={onToggleCollapse}
          className="flex items-center gap-3 w-full rounded-md px-2.5 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
        >
          {collapsed ? (
            <PanelLeft className="h-4 w-4 shrink-0" />
          ) : (
            <>
              <PanelLeftClose className="h-4 w-4 shrink-0" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
