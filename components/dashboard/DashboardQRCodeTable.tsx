"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Archive, ExternalLink } from "lucide-react";
import type { DashboardQRCode } from "@/components/dashboard/dashboard-data";
import {
  formatDateTime,
  formatNumber,
  formatShortDate,
  getModeLabel,
  getQRCodeDestinationLabel,
  getQRCodeEditHref,
  getQRCodeHref,
  getStatusLabel,
  getTypeLabel,
} from "@/components/dashboard/dashboard-utils";
import {
  Badge,
  Button,
  DataTable,
  type DataTableColumn,
} from "@/components/ui";

interface DashboardQRCodeTableProps {
  readonly rows: readonly DashboardQRCode[];
  readonly onArchive: (row: DashboardQRCode) => void;
  readonly emptyState?: ReactNode;
}

export function DashboardQRCodeTable({
  rows,
  onArchive,
  emptyState,
}: DashboardQRCodeTableProps) {
  return (
    <DataTable
      rows={rows}
      columns={getDashboardColumns({ onArchive })}
      getRowKey={(row) => row.id}
      emptyState={emptyState}
    />
  );
}

function getDashboardColumns({
  onArchive,
}: {
  readonly onArchive: (row: DashboardQRCode) => void;
}): readonly DataTableColumn<DashboardQRCode>[] {
  return [
    {
      key: "code",
      header: "Code",
      className: "min-w-72",
      render: (row) => (
        <div className="min-w-0">
          <Link
            href={getQRCodeHref(row)}
            className="font-semibold text-slate-950 underline-offset-4 hover:text-sky-700 hover:underline"
          >
            {row.title}
          </Link>
          <p className="mt-1 max-w-sm break-all text-xs leading-5 text-slate-500">
            {getQRCodeDestinationLabel(row)}
          </p>
        </div>
      ),
    },
    {
      key: "mode",
      header: "Mode",
      render: (row) => (
        <div className="flex flex-wrap gap-2">
          <Badge variant={row.mode === "dynamic" ? "info" : "neutral"}>
            {getModeLabel(row.mode)}
          </Badge>
          <Badge variant={row.status === "published" ? "success" : "warning"}>
            {getStatusLabel(row.status)}
          </Badge>
        </div>
      ),
    },
    {
      key: "type",
      header: "Type",
      render: (row) => getTypeLabel(row.type),
    },
    {
      key: "scans",
      header: "Scans",
      render: (row) => formatNumber(row.scanCount),
    },
    {
      key: "updated",
      header: "Updated",
      className: "min-w-32",
      render: (row) => (
        <span title={formatDateTime(row.updatedAt)}>
          {formatShortDate(row.updatedAt)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      className: "min-w-56",
      render: (row) => (
        <div className="flex flex-wrap gap-2">
          <Link
            href={getQRCodeHref(row)}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm transition-colors hover:border-sky-300 hover:bg-sky-50 hover:text-sky-900"
          >
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
            View
          </Link>
          <Link
            href={getQRCodeEditHref(row)}
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm transition-colors hover:border-sky-300 hover:bg-sky-50 hover:text-sky-900"
          >
            Edit
          </Link>
          <Button
            variant="danger"
            size="sm"
            onClick={() => onArchive(row)}
            leftIcon={<Archive className="h-4 w-4" aria-hidden="true" />}
          >
            Archive
          </Button>
        </div>
      ),
    },
  ];
}
