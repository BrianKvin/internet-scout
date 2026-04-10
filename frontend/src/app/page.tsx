"use client";

import Link from "next/link";
import {
  Radar,
  Globe,
  Database,
  Zap,
  Clock,
  BarChart3,
  Bell,
  Search,
  ArrowRight,
  ChevronDown,
  Monitor,
  FileText,
  ShieldCheck,
} from "lucide-react";
import { PublicNav } from "@/components/layout/public-nav";
import { PublicFooter } from "@/components/layout/public-footer";
import { useState } from "react";
import { cn } from "@/lib/utils";

function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-linear-to-b from-muted/50 to-background py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-6 text-center">
        <div className="mx-auto max-w-3xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-background px-4 py-1.5 text-sm text-muted-foreground">
            <Radar className="h-4 w-4 text-primary" />
            Web intelligence platform
          </div>

          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Scrape anything.
            <br />
            <span className="text-primary">Track everything.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            Add any source from the dashboard, run it on a schedule, and collect
            structured data into flexible collections. No code required for
            standard targets.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Get Started Free
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex items-center gap-2 rounded-lg border px-6 py-3 text-sm font-medium hover:bg-accent transition-colors"
            >
              See How It Works
            </a>
          </div>
        </div>

        <div className="mx-auto mt-16 max-w-4xl rounded-xl border bg-card p-2 shadow-lg">
          <div className="rounded-lg bg-muted/50 p-6">
            <div className="flex items-center gap-3 border-b pb-4">
              <div className="flex gap-1.5">
                <div className="h-3 w-3 rounded-full bg-red-400" />
                <div className="h-3 w-3 rounded-full bg-yellow-400" />
                <div className="h-3 w-3 rounded-full bg-green-400" />
              </div>
              <div className="flex-1 rounded-md bg-background px-3 py-1 text-xs text-muted-foreground">
                startscout.app/dashboard
              </div>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-4">
              {[
                { label: "Jobs found", value: "142" },
                { label: "Companies", value: "38" },
                { label: "Saved roles", value: "12" },
                { label: "In pipeline", value: "7" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-md bg-background p-3 text-center"
                >
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="text-xs text-muted-foreground">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 space-y-2">
              {[
                {
                  title: "Senior Frontend Engineer",
                  company: "Vectral",
                  tag: "YC",
                },
                {
                  title: "ML Engineer",
                  company: "Cohere AI",
                  tag: "YC",
                },
                {
                  title: "Staff Engineer",
                  company: "Retool",
                  tag: "PEAR",
                },
              ].map((job) => (
                <div
                  key={job.title}
                  className="flex items-center justify-between rounded-md bg-background px-4 py-2.5"
                >
                  <div>
                    <span className="text-sm font-medium">{job.title}</span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      {job.company}
                    </span>
                  </div>
                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                    {job.tag}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  const steps = [
    {
      icon: Globe,
      title: "1. Add a source",
      description:
        "Paste a URL, pick a scraping strategy, and give it a name. Works for job boards, VC portfolios, directories, government tenders, or any page with structured data.",
    },
    {
      icon: Clock,
      title: "2. Set a schedule",
      description:
        "Run your scraper daily, weekly, or on-demand. Startscout handles retries, rate limiting, and health monitoring automatically.",
    },
    {
      icon: Database,
      title: "3. Collect results",
      description:
        "Scraped items land in Collections — flexible, schema-free data buckets. Search, filter, export to CSV/JSON, or pipe into your next workflow.",
    },
    {
      icon: Bell,
      title: "4. Get notified",
      description:
        "Receive a daily email digest or real-time Slack alerts when new items appear. Never miss a new listing or opportunity again.",
    },
  ];

  return (
    <section id="how-it-works" className="py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight">How It Works</h2>
          <p className="mt-3 text-muted-foreground">
            From URL to structured data in four steps.
          </p>
        </div>

        <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step) => (
            <div key={step.title} className="flex flex-col items-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <step.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-4 font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  const features = [
    {
      icon: Search,
      title: "Dynamic Source Registry",
      description:
        "Add, toggle, and manage scraper sources from the dashboard. No code changes needed — even switch between static and Playwright strategies per source.",
    },
    {
      icon: Monitor,
      title: "Scrape Studio",
      description:
        "Paste any URL, pick a strategy, preview the first 5 results live, then save as a scheduled job. Point-and-click scraping for any website.",
    },
    {
      icon: Database,
      title: "Schema-Free Collections",
      description:
        "Results land in Collections with no predefined schema. Finance directories, job boards, procurement notices — all in one flexible data layer.",
    },
    {
      icon: Zap,
      title: "Pipeline Builder",
      description:
        "Chain steps after each scrape: enrich contacts, deduplicate, export to CSV, fire a Slack alert, or POST to a webhook.",
    },
    {
      icon: BarChart3,
      title: "Source Health Monitoring",
      description:
        "Automatic detection when a scraper starts returning 0 results. Get alerted instantly so you can fix selectors before data goes stale.",
    },
    {
      icon: FileText,
      title: "Export Anywhere",
      description:
        "Download any collection as CSV or JSON with one click. Or configure automatic exports as a pipeline step after every scrape run.",
    },
  ];

  return (
    <section id="features" className="bg-muted/30 py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight">Features</h2>
          <p className="mt-3 text-muted-foreground">
            Everything you need to scrape, structure, and monitor web data.
          </p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-xl border bg-card p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <feature.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function UseCasesSection() {
  const useCases = [
    {
      title: "Startup Job Hunting",
      description:
        "Track roles across Y Combinator, Sequoia, Pear VC, and more. Get notified before jobs hit LinkedIn. Built-in pipeline kanban to track applications.",
    },
    {
      title: "Business Directories",
      description:
        "Scrape finance directories, vendor lists, or supplier databases. Automatically extract company names, contact details, and service categories.",
    },
    {
      title: "Government Procurement",
      description:
        "Monitor tender notices from government agencies. Get alerted when new procurement opportunities match your sector and value range.",
    },
    {
      title: "Market Research",
      description:
        "Track competitor portfolios, pricing pages, or product catalogs. Export structured data for analysis and reporting.",
    },
  ];

  return (
    <section id="use-cases" className="py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight">Use Cases</h2>
          <p className="mt-3 text-muted-foreground">
            One platform, any data source.
          </p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2">
          {useCases.map((uc) => (
            <div
              key={uc.title}
              className="rounded-xl border bg-card p-6"
            >
              <h3 className="font-semibold">{uc.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {uc.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQSection() {
  const faqs = [
    {
      question: "Do I need to write code?",
      answer:
        "No. For most websites, you pick a strategy from the dropdown and Startscout handles selector detection automatically. For JS-rendered SPAs, Playwright kicks in. Only edge cases need manual selector config.",
    },
    {
      question: "Is it free to use?",
      answer:
        "The core scraping platform is completely free — source management, collections, exports, notifications, and the pipeline builder. AI-powered features (instruction interpretation, fit scoring, email drafting) require a paid Anthropic API key.",
    },
    {
      question: "What happens when a website changes its layout?",
      answer:
        "Startscout monitors source health automatically. If a scraper returns 0 results, it flags the source as broken and sends you a Slack alert so you can update the strategy or selectors.",
    },
    {
      question: "Can I export my data?",
      answer:
        "Yes. Any collection can be exported as CSV or JSON with one click. You can also set up automatic exports as a pipeline step after every scrape run, or POST results to a webhook.",
    },
    {
      question: "How often does it scrape?",
      answer:
        "You choose per source: daily, weekly, or on-demand. The scheduler runs via APScheduler with polite delays between sources to avoid rate limiting.",
    },
  ];

  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="bg-muted/30 py-20">
      <div className="mx-auto max-w-3xl px-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight">FAQ</h2>
          <p className="mt-3 text-muted-foreground">
            Common questions about Startscout.
          </p>
        </div>

        <div className="mt-14 space-y-3">
          {faqs.map((faq, index) => (
            <div key={faq.question} className="rounded-lg border bg-card">
              <button
                onClick={() =>
                  setOpenIndex(openIndex === index ? null : index)
                }
                className="flex w-full items-center justify-between px-5 py-4 text-left text-sm font-medium"
              >
                {faq.question}
                <ChevronDown
                  className={cn(
                    "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                    openIndex === index && "rotate-180"
                  )}
                />
              </button>
              {openIndex === index && (
                <div className="px-5 pb-4 text-sm leading-relaxed text-muted-foreground">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="rounded-2xl bg-primary px-8 py-14 text-center text-primary-foreground">
          <ShieldCheck className="mx-auto h-10 w-10 opacity-80" />
          <h2 className="mt-4 text-3xl font-bold tracking-tight">
            Ready to start scraping?
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm opacity-80">
            Create a free account, add your first source, and start collecting
            structured data in minutes. No credit card required.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-lg bg-background px-6 py-3 text-sm font-medium text-foreground hover:bg-background/90 transition-colors"
            >
              Create Free Account
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-lg border border-primary-foreground/30 px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary-foreground/10 transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicNav />
      <main className="flex-1">
        <HeroSection />
        <HowItWorksSection />
        <FeaturesSection />
        <UseCasesSection />
        <FAQSection />
        <CTASection />
      </main>
      <PublicFooter />
    </div>
  );
}
