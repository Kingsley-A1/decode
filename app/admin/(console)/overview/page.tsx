import Link from "next/link";
import {
  Activity,
  Boxes,
  History,
  Image,
  Link2,
  QrCode,
  Star,
  Users,
} from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Badge } from "@/components/ui";
import { getAdminOverview } from "@/server/admin/queries";

export default async function AdminOverviewPage() {
  const overview = await getAdminOverview();
  const metrics = [
    { label: "Users", value: overview.totals.users, icon: Users, href: "/admin/users" },
    { label: "Workspaces", value: overview.totals.workspaces, icon: Boxes, href: "/admin/workspaces" },
    { label: "QR codes", value: overview.totals.qrCodes, icon: QrCode, href: "/admin/qr-codes" },
    { label: "Dynamic QR", value: overview.totals.dynamicQRCodes, icon: Activity, href: "/admin/qr-codes?status=published" },
    { label: "Landing pages", value: overview.totals.landingPages, icon: Boxes, href: "/admin/landing-pages" },
    { label: "Assets", value: overview.totals.assets, icon: Image, href: "/admin/assets" },
    { label: "Scans", value: overview.totals.scans, icon: Activity, href: "/admin/scans" },
    { label: "Reviews", value: overview.totals.reviews, icon: Star, href: "/admin/reviews" },
    { label: "Link checks", value: overview.totals.linkChecks, icon: Link2, href: "/admin/link-checks" },
  ] as const;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Overview"
        description="Audit-first visibility across accounts, workspaces, QR inventory, assets, scans, reviews, and link checks."
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {metrics.map((metric) => {
          const Icon = metric.icon;

          return (
            <Link
              key={metric.label}
              href={metric.href}
              className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-sky-300 hover:bg-sky-50"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-slate-600">{metric.label}</p>
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-sky-50 text-sky-700">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
              </div>
              <p className="mt-4 text-3xl font-semibold text-slate-950">
                {metric.value.toLocaleString()}
              </p>
            </Link>
          );
        })}
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">
              Recent audit activity
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Unified platform, workspace, and admin-auth events.
            </p>
          </div>
          <Link
            href="/admin/audit"
            className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-700 hover:bg-sky-50 hover:text-sky-900"
          >
            <History className="h-4 w-4" aria-hidden="true" />
            Open audit
          </Link>
        </div>

        <div className="space-y-3">
          {overview.recentAuditEvents.length === 0 ? (
            <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              No admin audit events have been recorded yet.
            </p>
          ) : (
            overview.recentAuditEvents.map((event) => (
              <article
                key={`${event.source}-${event.id}`}
                className="rounded-lg border border-slate-200 bg-slate-50 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="info">{event.source}</Badge>
                    <p className="font-semibold text-slate-950">{event.action}</p>
                  </div>
                  <time className="text-xs text-slate-500">
                    {formatDate(event.createdAt)}
                  </time>
                </div>
                <p className="mt-2 text-sm text-slate-600">
                  {event.actorLabel} · {event.entityType}
                  {event.workspaceLabel ? ` · ${event.workspaceLabel}` : ""}
                </p>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

function formatDate(value: Date): string {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}
