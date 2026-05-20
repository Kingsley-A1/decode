import { AdminResourcePage } from "@/components/admin/AdminResourcePage";

interface AdminLinkChecksPageProps {
  readonly searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function AdminLinkChecksPage({
  searchParams,
}: AdminLinkChecksPageProps) {
  return (
    <AdminResourcePage
      config={{
        resource: "link-checks",
        title: "Link Checks",
        description: "Cached URL safety verdicts used by verifier and QR workflows.",
        emptyTitle: "No link checks found",
        emptyDescription: "Link checks appear after URLs are verified server-side.",
      }}
      searchParams={await searchParams}
    />
  );
}
