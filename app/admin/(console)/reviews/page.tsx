import { AdminResourcePage } from "@/components/admin/AdminResourcePage";

interface AdminReviewsPageProps {
  readonly searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function AdminReviewsPage({
  searchParams,
}: AdminReviewsPageProps) {
  return (
    <AdminResourcePage
      config={{
        resource: "reviews",
        title: "Reviews",
        description: "Review inventory and moderation status for public social proof.",
        emptyTitle: "No reviews found",
        emptyDescription: "Reviews appear after public review submissions.",
      }}
      searchParams={await searchParams}
    />
  );
}
