import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Badge } from "@/components/ui";
import { listAdminAuditEvents } from "@/server/admin/queries";
import { adminAuditQuerySchema } from "@/server/admin/schemas";

interface AdminAuditPageProps {
  readonly searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function AdminAuditPage({
  searchParams,
}: AdminAuditPageProps) {
  const params = (await searchParams) ?? {};
  const query = adminAuditQuerySchema.parse({
    source: getParam(params.source) ?? "all",
    action: getParam(params.action),
    entityType: getParam(params.entityType),
    requestId: getParam(params.requestId),
    cursorCreatedAt: getParam(params.cursorCreatedAt),
  });
  const events = await listAdminAuditEvents(query);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Audit timeline"
        description="Immutable platform, workspace, and admin-auth events in one operational view."
        actions={<AuditFilters defaultSource={query.source} />}
      />

      <section className="space-y-3">
        {events.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-600">
            No audit events match this filter.
          </div>
        ) : (
          events.map((event) => (
            <article
              key={`${event.source}-${event.id}`}
              className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="info">{event.source}</Badge>
                    <Badge>{event.entityType}</Badge>
                    <h2 className="text-base font-semibold text-slate-950">
                      {event.action}
                    </h2>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">
                    Actor: {event.actorLabel}
                    {event.workspaceLabel ? ` · Workspace: ${event.workspaceLabel}` : ""}
                  </p>
                  <p className="mt-1 break-all text-xs text-slate-500">
                    Entity: {event.entityId ?? "none"} · Request:{" "}
                    {event.requestId ?? "none"}
                  </p>
                </div>
                <time className="shrink-0 text-xs text-slate-500">
                  {formatDate(event.createdAt)}
                </time>
              </div>
            </article>
          ))
        )}
      </section>
    </div>
  );
}

function AuditFilters({ defaultSource }: { readonly defaultSource: string }) {
  return (
    <form className="flex flex-wrap gap-2">
      <label className="sr-only" htmlFor="audit-source">
        Audit source
      </label>
      <select
        id="audit-source"
        name="source"
        defaultValue={defaultSource}
        className="min-h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 shadow-sm"
      >
        <option value="all">All sources</option>
        <option value="platform">Platform</option>
        <option value="workspace">Workspace</option>
        <option value="auth">Auth</option>
      </select>
      <input
        name="requestId"
        placeholder="Request ID"
        className="min-h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 shadow-sm"
      />
      <button
        type="submit"
        className="inline-flex min-h-11 items-center justify-center rounded-lg border border-sky-700 bg-sky-700 px-4 text-sm font-semibold text-white"
      >
        Filter
      </button>
    </form>
  );
}

function getParam(value: string | string[] | undefined): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function formatDate(value: Date): string {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}
