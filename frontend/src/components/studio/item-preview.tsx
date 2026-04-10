"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ItemPreviewProps {
  items: Record<string, string | number | boolean | null>[];
}

export function ItemPreview({ items }: ItemPreviewProps) {
  if (items.length === 0) {
    return (
      <div className="text-sm text-muted-foreground text-center py-8">
        Click &quot;Preview&quot; to see sample results.
      </div>
    );
  }

  const firstItem = items[0];
  if (!firstItem) return null;
  const columns = Object.keys(firstItem);

  return (
    <div className="rounded-md border overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col) => (
              <TableHead key={col} className="text-xs capitalize whitespace-nowrap">
                {col.replace(/_/g, " ")}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item, i) => (
            <TableRow key={i}>
              {columns.map((col) => (
                <TableCell key={col} className="text-xs whitespace-nowrap">
                  {String(item[col] ?? "")}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
