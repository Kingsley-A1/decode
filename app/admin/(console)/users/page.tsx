import { AdminResourcePage } from "@/components/admin/AdminResourcePage";

interface AdminUsersPageProps {
  readonly searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function AdminUsersPage({
  searchParams,
}: AdminUsersPageProps) {
  return (
    <AdminResourcePage
      config={{
        resource: "users",
        title: "Users",
        description: "Customer OAuth accounts and their platform footprint.",
        emptyTitle: "No users found",
        emptyDescription: "Users appear after OAuth sign-in creates accounts.",
      }}
      searchParams={await searchParams}
    />
  );
}
