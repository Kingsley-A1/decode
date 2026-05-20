import { AdminResourcePage } from "@/components/admin/AdminResourcePage";

interface AdminAssetsPageProps {
  readonly searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function AdminAssetsPage({
  searchParams,
}: AdminAssetsPageProps) {
  return (
    <AdminResourcePage
      config={{
        resource: "assets",
        title: "Assets",
        description: "Uploaded logo and landing-page media inventory without exposing storage object keys.",
        emptyTitle: "No assets found",
        emptyDescription: "Assets appear after signed uploads are created and confirmed.",
      }}
      searchParams={await searchParams}
    />
  );
}
