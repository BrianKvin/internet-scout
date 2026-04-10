"use client";

import { ExternalLink, Globe, Briefcase, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSignals } from "@/hooks/use-signals";
import { SignalBadge } from "./signal-badge";
import { SOURCE_SHORT_NAMES } from "@/lib/constants";
import type { Company } from "@/types/company";

interface CompanyCardProps {
  company: Company;
}

export function CompanyCard({ company }: CompanyCardProps) {
  const { data: signals } = useSignals(company.id);

  const sourceName = SOURCE_SHORT_NAMES[company.sourceId] ?? company.sourceId;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-base">{company.name}</CardTitle>
          <Badge variant="outline" className="text-xs shrink-0">
            {sourceName}
          </Badge>
        </div>
        {company.domain && (
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            <Globe className="h-3 w-3" />
            {company.domain}
          </p>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          {company.sector && (
            <Badge variant="secondary" className="text-xs">
              {company.sector}
            </Badge>
          )}
          {company.stage && (
            <Badge variant="secondary" className="text-xs">
              {company.stage}
            </Badge>
          )}
          {company.enriched && (
            <Badge variant="secondary" className="text-xs bg-green-50 text-green-700">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Enriched
            </Badge>
          )}
        </div>

        {signals && signals.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {signals.map((signal) => (
              <SignalBadge key={signal.id} signal={signal} />
            ))}
          </div>
        )}

        <div className="flex gap-2 mt-1">
          {company.website && (
            <a
              href={company.website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-md border border-border bg-background px-2.5 py-1 text-xs hover:bg-muted transition-colors"
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Website
            </a>
          )}
          {company.careersUrl && (
            <a
              href={company.careersUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-md border border-border bg-background px-2.5 py-1 text-xs hover:bg-muted transition-colors"
            >
              <Briefcase className="h-3 w-3 mr-1" />
              Careers
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
