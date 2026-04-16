"use client";

import Link from "next/link";
import { useAuth } from "@/providers/auth-provider";
import { Radar } from "lucide-react";

export function PublicNav() {
  const { isAuthenticated } = useAuth();
  const ctaHref = isAuthenticated ? "/dashboard" : "/sign-up";

  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2">
          <Radar className="h-5 w-5 text-primary" />
          <span className="text-lg font-semibold">Startscout</span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm md:flex">
          <a href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">
            How It Works
          </a>
          <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
            Features
          </a>
          <a href="#use-cases" className="text-muted-foreground hover:text-foreground transition-colors">
            Use Cases
          </a>
          <a href="#faq" className="text-muted-foreground hover:text-foreground transition-colors">
            FAQ
          </a>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href={ctaHref}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            {isAuthenticated ? "Dashboard" : "Get Started"}
          </Link>
        </div>
      </div>
    </header>
  );
}
