import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminResourcePage } from "@/components/admin/AdminResourcePage";

interface AdminSystemPageProps {
  readonly searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function AdminSystemPage({
  searchParams,
}: AdminSystemPageProps) {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="System"
        description="Admin users, session readiness, and operator control-plane configuration."
        actions={
          <Link
            href="/admin/link-checks"
            className="inline-flex min-h-11 items-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 shadow-sm hover:bg-sky-50 hover:text-sky-900"
          >
            Open link checks
          </Link>
        }
      />
      <AdminResourcePage
        config={{
          resource: "admin-users",
          title: "Admin users",
          description: "Dedicated operator accounts and their auth footprint.",
          emptyTitle: "No admin users found",
          emptyDescription: "The first admin is created from /admin/register.",
        }}
        searchParams={await searchParams}
      />
    </div>
  );
}
