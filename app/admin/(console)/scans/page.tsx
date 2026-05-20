import { AdminResourcePage } from "@/components/admin/AdminResourcePage";

interface AdminScansPageProps {
  readonly searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function AdminScansPage({
  searchParams,
}: AdminScansPageProps) {
  return (
    <AdminResourcePage
      config={{
        resource: "scans",
        title: "Scans",
        description: "Privacy-preserving scan events with hashed network identifiers only.",
        emptyTitle: "No scans found",
        emptyDescription: "Scan events appear after published dynamic QR codes are opened.",
      }}
      searchParams={await searchParams}
    />
  );
}
