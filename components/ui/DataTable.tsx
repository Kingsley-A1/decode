import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface DataTableColumn<TRow> {
  key: string;
  header: string;
  render: (row: TRow) => ReactNode;
  className?: string;
}

interface DataTableProps<TRow> {
  columns: readonly DataTableColumn<TRow>[];
  rows: readonly TRow[];
  getRowKey: (row: TRow) => string;
  emptyState?: ReactNode;
  className?: string;
}

export function DataTable<TRow>({
  columns,
  rows,
  getRowKey,
  emptyState,
  className,
}: DataTableProps<TRow>) {
  if (rows.length === 0 && emptyState) {
    return <>{emptyState}</>;
  }

  return (
    <div
      className={cn(
        "overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm",
        className
      )}
    >
      <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
        <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-600">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={cn("px-4 py-3", column.className)}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row) => (
            <tr key={getRowKey(row)}>
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={cn("px-4 py-3 text-slate-700", column.className)}
                >
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
