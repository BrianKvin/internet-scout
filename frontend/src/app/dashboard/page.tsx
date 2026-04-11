"use client";

import { useState } from "react";
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
import { useAuth } from "@/providers/auth-provider";

const SECTIONS: Record<string, React.ComponentType> = {
  feed: JobFeed,
  companies: CompanyGrid,
  activity: ActivityFeed,
  sources: SourcesManager,
  studio: ScrapeStudio,
  collections: CollectionBrowser,
  stats: StatsDashboard,
  notifications: NotificationSettingsForm,
};

export default function DashboardPage() {
  const { isAuthenticated, user, signOut } = useAuth();
  const [activeSection, setActiveSection] = useState("feed");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const ActiveComponent = SECTIONS[activeSection] ?? JobFeed;

  return (
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
          onNavigate={setActiveSection}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
        />

        <main className="flex-1 flex flex-col overflow-y-auto">
          <StatsBar />
          <div className="flex-1">
            <ActiveComponent />
          </div>
        </main>
      </div>
    </div>
  );
}
