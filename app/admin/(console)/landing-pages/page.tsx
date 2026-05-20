import { AdminResourcePage } from "@/components/admin/AdminResourcePage";

interface AdminLandingPagesPageProps {
  readonly searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function AdminLandingPagesPage({
  searchParams,
}: AdminLandingPagesPageProps) {
  return (
    <AdminResourcePage
      config={{
        resource: "landing-pages",
        title: "Landing Pages",
        description: "Editable QR landing pages by workspace, QR attachment, type, and publication status.",
        emptyTitle: "No landing pages found",
        emptyDescription: "Landing pages appear after teams publish dynamic QR destinations.",
      }}
      searchParams={await searchParams}
    />
  );
}
