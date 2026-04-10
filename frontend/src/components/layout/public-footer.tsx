import Link from "next/link";
import { Radar } from "lucide-react";

export function PublicFooter() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Radar className="h-5 w-5 text-primary" />
              <span className="text-base font-semibold">Startscout</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              General-purpose web scraping platform. Add any source, run it on a
              schedule, collect structured data.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <h4 className="text-sm font-medium">Product</h4>
            <nav className="flex flex-col gap-2 text-sm text-muted-foreground">
              <a href="#how-it-works" className="hover:text-foreground transition-colors">
                How It Works
              </a>
              <a href="#features" className="hover:text-foreground transition-colors">
                Features
              </a>
              <a href="#use-cases" className="hover:text-foreground transition-colors">
                Use Cases
              </a>
              <a href="#faq" className="hover:text-foreground transition-colors">
                FAQ
              </a>
            </nav>
          </div>

          <div className="flex flex-col gap-3">
            <h4 className="text-sm font-medium">Account</h4>
            <nav className="flex flex-col gap-2 text-sm text-muted-foreground">
              <Link href="/sign-in" className="hover:text-foreground transition-colors">
                Sign In
              </Link>
              <Link href="/sign-up" className="hover:text-foreground transition-colors">
                Register
              </Link>
            </nav>
          </div>

          <div className="flex flex-col gap-3">
            <h4 className="text-sm font-medium">Legal</h4>
            <nav className="flex flex-col gap-2 text-sm text-muted-foreground">
              <span className="cursor-default">Terms &amp; Conditions</span>
              <span className="cursor-default">Privacy Policy</span>
            </nav>
          </div>
        </div>

        <div className="mt-10 border-t pt-6 text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} Startscout. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
