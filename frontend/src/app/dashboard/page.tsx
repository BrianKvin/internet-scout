"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { Radar, LogOut } from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { StatsBar } from "@/components/layout/stats-bar";
import { JobFeed } from "@/components/jobs/job-feed";
import { CompanyGrid } from "@/components/companies/company-grid";
import { ActivityFeed } from "@/components/activity/activity-feed";
import { SourcesManager } from "@/components/sources/sources-manager";
import { ScrapeStudio } from "@/components/studio/scrape-studio";
import { CollectionBrowser } from "@/components/collections/collection-browser";
import { StatsDashboard } from "@/components/stats/stats-dashboard";
import { NotificationSettingsForm } from "@/components/notifications/notification-settings";
import { SourceDiscovery } from "@/components/discovery/source-discovery";
import { useAuth } from "@/providers/auth-provider";
import { DashboardNavCtx } from "@/hooks/use-dashboard-nav";

const SECTIONS: Record<string, React.ComponentType<{ navData?: Record<string, string> }>> = {
  feed: JobFeed,
  companies: CompanyGrid,
  activity: ActivityFeed,
  discovery: SourceDiscovery,
  sources: SourcesManager,
  studio: ScrapeStudio,
  collections: CollectionBrowser,
  stats: StatsDashboard,
  notifications: NotificationSettingsForm,
};

export default function DashboardPage() {
  const { isAuthenticated, user, signOut } = useAuth();
  const [activeSection, setActiveSection] = useState("feed");
  const [navData, setNavData] = useState<Record<string, string>>({});
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const navigate = useCallback((section: string, data?: Record<string, string>) => {
    setActiveSection(section);
    setNavData(data ?? {});
  }, []);

  const navCtx = useMemo(() => ({ navigate }), [navigate]);

  const ActiveComponent = SECTIONS[activeSection] ?? JobFeed;

  return (
    <DashboardNavCtx.Provider value={navCtx}>
      <div className="mx-auto w-full max-w-7xl flex flex-col min-h-screen">
        <header className="flex items-center justify-between border-b px-5 py-3">
          <Link href="/" className="flex items-center gap-2">
            <Radar className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-semibold">Startscout</h1>
          </Link>
          <div className="flex items-center gap-4">
            {isAuthenticated && user ? (
              <>
                <span className="text-sm text-muted-foreground">
                  {user.name}
                </span>
                <button
                  onClick={signOut}
                  className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </>
            ) : (
              <Link
                href="/sign-in"
                className="rounded-md border px-4 py-1.5 text-sm font-medium hover:bg-accent transition-colors"
              >
                Sign In
              </Link>
            )}
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
          <Sidebar
            activeSection={activeSection}
            onNavigate={(id) => navigate(id)}
            collapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
          />

          <main className="flex-1 flex flex-col overflow-y-auto">
            <StatsBar />
            <div className="flex-1">
              <ActiveComponent navData={navData} />
            </div>
          </main>
        </div>
      </div>
    </DashboardNavCtx.Provider>
  );
}
