"use client";

import { Download } from "lucide-react";
import Papa from "papaparse";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getCollectionItemsForExport } from "@/services/collections.service";

interface ExportButtonProps {
  collectionId: string;
  collectionName: string;
}

function downloadBlob(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function ExportButton({
  collectionId,
  collectionName,
}: ExportButtonProps) {
  const handleExport = async (format: "csv" | "json") => {
    const items = await getCollectionItemsForExport(collectionId);
    const data = items.map((item) => item.data);
    const safeName = collectionName.replace(/[^a-z0-9]/gi, "_").toLowerCase();

    if (format === "csv") {
      const csv = Papa.unparse(data);
      downloadBlob(csv, `${safeName}.csv`, "text/csv;charset=utf-8;");
    } else {
      const json = JSON.stringify(data, null, 2);
      downloadBlob(json, `${safeName}.json`, "application/json;charset=utf-8;");
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="inline-flex items-center rounded-md border border-border bg-background px-2.5 py-1.5 text-sm hover:bg-muted transition-colors">
        <Download className="h-4 w-4 mr-1" />
        Export
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={() => void handleExport("csv")}>
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => void handleExport("json")}>
          Export as JSON
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
