import type { ReactNode } from "react";
import { EmptyState } from "@/components/ui";

export interface AdminTableColumn<TRow> {
  readonly key: string;
  readonly header: string;
  readonly render: (row: TRow) => ReactNode;
}

interface AdminTableProps<TRow> {
  readonly rows: readonly TRow[];
  readonly columns: readonly AdminTableColumn<TRow>[];
  readonly getRowKey: (row: TRow) => string;
  readonly emptyTitle: string;
  readonly emptyDescription: string;
}

export function AdminTable<TRow>({
  rows,
  columns,
  getRowKey,
  emptyTitle,
  emptyDescription,
}: AdminTableProps<TRow>) {
  if (rows.length === 0) {
    return (
      <EmptyState title={emptyTitle} description={emptyDescription} />
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
        <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-600">
          <tr>
            {columns.map((column) => (
              <th key={column.key} scope="col" className="px-4 py-3">
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row) => (
            <tr key={getRowKey(row)}>
              {columns.map((column) => (
                <td key={column.key} className="px-4 py-3 text-slate-700">
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
