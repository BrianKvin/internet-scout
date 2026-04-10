"use client";

import Link from "next/link";
import { Radar, LogOut } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatsBar } from "@/components/layout/stats-bar";
import { JobFeed } from "@/components/jobs/job-feed";
import { CompanyGrid } from "@/components/companies/company-grid";
import { PipelineBoard } from "@/components/pipeline/pipeline-board";
import { SourcesManager } from "@/components/sources/sources-manager";
import { ScrapeStudio } from "@/components/studio/scrape-studio";
import { CollectionBrowser } from "@/components/collections/collection-browser";
import { StatsDashboard } from "@/components/stats/stats-dashboard";
import { NotificationSettingsForm } from "@/components/notifications/notification-settings";
import { useAuth } from "@/providers/auth-provider";

const tabTriggerClass =
  "rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2.5 text-sm";

export default function DashboardPage() {
  const { isAuthenticated, user, signOut } = useAuth();

  return (
    <div className="mx-auto w-full max-w-7xl flex flex-col min-h-screen">
      <header className="flex items-center justify-between border-b px-6 py-3">
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

      <StatsBar />

      <Tabs defaultValue="jobs" className="flex-1 flex flex-col">
        <div className="border-b px-6 overflow-x-auto">
          <TabsList className="h-auto bg-transparent p-0 gap-0">
            <TabsTrigger value="jobs" className={tabTriggerClass}>
              Job feed
            </TabsTrigger>
            <TabsTrigger value="companies" className={tabTriggerClass}>
              Companies
            </TabsTrigger>
            <TabsTrigger value="pipeline" className={tabTriggerClass}>
              My pipeline
            </TabsTrigger>
            <TabsTrigger value="sources" className={tabTriggerClass}>
              Sources
            </TabsTrigger>
            <TabsTrigger value="studio" className={tabTriggerClass}>
              Studio
            </TabsTrigger>
            <TabsTrigger value="collections" className={tabTriggerClass}>
              Collections
            </TabsTrigger>
            <TabsTrigger value="stats" className={tabTriggerClass}>
              Stats
            </TabsTrigger>
            <TabsTrigger value="notifications" className={tabTriggerClass}>
              Notifications
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="jobs" className="flex-1 mt-0">
          <JobFeed />
        </TabsContent>
        <TabsContent value="companies" className="flex-1 mt-0">
          <CompanyGrid />
        </TabsContent>
        <TabsContent value="pipeline" className="flex-1 mt-0">
          <PipelineBoard />
        </TabsContent>
        <TabsContent value="sources" className="flex-1 mt-0">
          <SourcesManager />
        </TabsContent>
        <TabsContent value="studio" className="flex-1 mt-0">
          <ScrapeStudio />
        </TabsContent>
        <TabsContent value="collections" className="flex-1 mt-0">
          <CollectionBrowser />
        </TabsContent>
        <TabsContent value="stats" className="flex-1 mt-0">
          <StatsDashboard />
        </TabsContent>
        <TabsContent value="notifications" className="flex-1 mt-0">
          <NotificationSettingsForm />
        </TabsContent>
      </Tabs>
    </div>
  );
}
