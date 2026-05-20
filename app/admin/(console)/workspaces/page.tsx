import { AdminResourcePage } from "@/components/admin/AdminResourcePage";

interface AdminWorkspacesPageProps {
  readonly searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function AdminWorkspacesPage({
  searchParams,
}: AdminWorkspacesPageProps) {
  return (
    <AdminResourcePage
      config={{
        resource: "workspaces",
        title: "Workspaces",
        description: "Workspace ownership, member counts, QR volume, scans, and audit activity.",
        emptyTitle: "No workspaces found",
        emptyDescription: "Workspaces appear after account creation.",
      }}
      searchParams={await searchParams}
    />
  );
}
