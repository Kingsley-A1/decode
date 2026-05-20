import { Search } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminTable, type AdminTableColumn } from "@/components/admin/AdminTable";
import { Badge } from "@/components/ui";
import {
  listAdminAssets,
  listAdminLandingPages,
  listAdminLinkChecks,
  listAdminQRCodes,
  listAdminReviews,
  listAdminScans,
  listAdminUsers,
  listAdminWorkspaces,
  listPlatformUsers,
} from "@/server/admin/queries";
import {
  adminListQuerySchema,
  type AdminListQuery,
} from "@/server/admin/schemas";

export type AdminResource =
  | "admin-users"
  | "users"
  | "workspaces"
  | "qr-codes"
  | "landing-pages"
  | "assets"
  | "scans"
  | "reviews"
  | "link-checks";

export interface AdminResourceConfig {
  readonly resource: AdminResource;
  readonly title: string;
  readonly description: string;
  readonly emptyTitle: string;
  readonly emptyDescription: string;
}

interface AdminResourcePageProps {
  readonly config: AdminResourceConfig;
  readonly searchParams?: Record<string, string | string[] | undefined>;
}

interface DisplayRow {
  readonly id: string;
  readonly primary: string;
  readonly secondary: string;
  readonly status: string;
  readonly metric: string;
  readonly updatedAt: Date;
}

export async function AdminResourcePage({
  config,
  searchParams,
}: AdminResourcePageProps) {
  const query = parseListQuery(searchParams);
  const page = await getResourcePage(config.resource, query);
  const rows = page.records;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={config.title}
        description={config.description}
        actions={<SearchForm query={query} />}
      />

      <section className="grid gap-4 sm:grid-cols-3">
        <MetricPanel label="Total matches" value={page.total} />
        <MetricPanel label="Showing" value={rows.length} />
        <MetricPanel label="Next page" value={page.nextCursor ? "Available" : "None"} />
      </section>

      <AdminTable
        rows={rows}
        columns={resourceColumns}
        getRowKey={(row) => row.id}
        emptyTitle={config.emptyTitle}
        emptyDescription={config.emptyDescription}
      />
    </div>
  );
}

const resourceColumns: readonly AdminTableColumn<DisplayRow>[] = [
  {
    key: "record",
    header: "Record",
    render: (row) => (
      <div className="min-w-64">
        <p className="font-semibold text-slate-950">{row.primary}</p>
        <p className="mt-1 max-w-md break-all text-xs leading-5 text-slate-500">
          {row.secondary}
        </p>
      </div>
    ),
  },
  {
    key: "status",
    header: "Status",
    render: (row) => <Badge variant={getStatusVariant(row.status)}>{row.status}</Badge>,
  },
  {
    key: "metric",
    header: "Metric",
    render: (row) => row.metric,
  },
  {
    key: "updated",
    header: "Updated",
    render: (row) => formatDate(row.updatedAt),
  },
];

async function getResourcePage(
  resource: AdminResource,
  query: AdminListQuery
) {
  switch (resource) {
    case "admin-users":
      return toDisplayPage(await listAdminUsers(query), (row) => ({
        id: row.id,
        primary: row.name,
        secondary: row.email,
        status: `${row.role} / ${row.status}`,
        metric: `${row._count.sessions} sessions`,
        updatedAt: row.updatedAt,
      }));
    case "users":
      return toDisplayPage(await listPlatformUsers(query), (row) => ({
        id: row.id,
        primary: row.name ?? "Unnamed user",
        secondary: row.email ?? "No email",
        status: row.deletedAt ? "deleted" : "active",
        metric: `${row._count.ownedQRCodes} QR codes`,
        updatedAt: row.updatedAt,
      }));
    case "workspaces":
      return toDisplayPage(await listAdminWorkspaces(query), (row) => ({
        id: row.id,
        primary: row.name,
        secondary: `${row.slug} · owner ${row.owner.email ?? row.owner.name ?? row.owner.id}`,
        status: row.deletedAt ? "deleted" : "active",
        metric: `${row._count.qrCodes} QR / ${row._count.scanEvents} scans`,
        updatedAt: row.updatedAt,
      }));
    case "qr-codes":
      return toDisplayPage(await listAdminQRCodes(query), (row) => ({
        id: row.id,
        primary: row.title,
        secondary: row.destinationUrl ?? row.slug ?? row.workspace.name,
        status: `${row.mode} / ${row.status}`,
        metric: `${row.scanCount} scans`,
        updatedAt: row.updatedAt,
      }));
    case "landing-pages":
      return toDisplayPage(await listAdminLandingPages(query), (row) => ({
        id: row.id,
        primary: row.title,
        secondary: `${row.type} · ${row.workspace.name}`,
        status: row.status,
        metric: row.qrCode?.title ?? "No QR attached",
        updatedAt: row.updatedAt,
      }));
    case "assets":
      return toDisplayPage(await listAdminAssets(query), (row) => ({
        id: row.id,
        primary: row.purpose,
        secondary: `${row.contentType} · ${row.workspace.name}`,
        status: row.status,
        metric: formatBytes(row.fileSizeBytes),
        updatedAt: row.updatedAt,
      }));
    case "scans":
      return toDisplayPage(await listAdminScans(query), (row) => ({
        id: row.id,
        primary: row.qrCode.title,
        secondary: `${row.workspace.name} · ${row.referrer ?? "Direct"}`,
        status: row.deviceClass ?? "unknown",
        metric: [row.browser, row.operatingSystem].filter(Boolean).join(" / "),
        updatedAt: row.scannedAt,
      }));
    case "reviews":
      return toDisplayPage(await listAdminReviews(query), (row) => ({
        id: row.id,
        primary: row.title,
        secondary: `${row.name} · ${row.email ?? "No email"}`,
        status: row.status,
        metric: `${row.rating}/5`,
        updatedAt: row.updatedAt,
      }));
    case "link-checks":
      return toDisplayPage(await listAdminLinkChecks(query), (row) => ({
        id: row.id,
        primary: row.normalizedUrl,
        secondary: `Confidence ${row.confidence}`,
        status: row.verdict,
        metric: `Expires ${formatDate(row.expiresAt)}`,
        updatedAt: row.checkedAt,
      }));
  }
}

function SearchForm({ query }: { readonly query: AdminListQuery }) {
  return (
    <form className="flex w-full max-w-sm gap-2" action="">
      <label className="sr-only" htmlFor="admin-resource-search">
        Search records
      </label>
      <div className="relative min-w-0 flex-1">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          aria-hidden="true"
        />
        <input
          id="admin-resource-search"
          name="q"
          defaultValue={query.q ?? ""}
          placeholder="Search"
          className="min-h-11 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-900 shadow-sm"
        />
      </div>
      <button
        type="submit"
        className="inline-flex min-h-11 items-center justify-center rounded-lg border border-sky-700 bg-sky-700 px-4 text-sm font-semibold text-white"
      >
        Search
      </button>
    </form>
  );
}

function MetricPanel({
  label,
  value,
}: {
  readonly label: string;
  readonly value: number | string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function toDisplayPage<TRecord extends { readonly id: string }>(
  page: {
    readonly records: readonly TRecord[];
    readonly nextCursor: string | null;
    readonly total: number;
  },
  mapRow: (row: TRecord) => DisplayRow
) {
  return {
    records: page.records.map(mapRow),
    nextCursor: page.nextCursor,
    total: page.total,
  };
}

function parseListQuery(
  searchParams?: Record<string, string | string[] | undefined>
): AdminListQuery {
  const q = typeof searchParams?.q === "string" ? searchParams.q : undefined;
  const status =
    typeof searchParams?.status === "string" ? searchParams.status : undefined;
  const cursor =
    typeof searchParams?.cursor === "string" ? searchParams.cursor : undefined;

  return adminListQuerySchema.parse({ q, status, cursor });
}

function getStatusVariant(status: string) {
  if (status.includes("published") || status.includes("active")) {
    return "success";
  }
  if (status.includes("archived") || status.includes("disabled")) {
    return "warning";
  }
  if (status.includes("suspicious") || status.includes("flagged")) {
    return "danger";
  }

  return "neutral";
}

function formatDate(value: Date): string {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

function formatBytes(value: number): string {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`;

  return `${Math.round(value / (1024 * 1024))} MB`;
}
