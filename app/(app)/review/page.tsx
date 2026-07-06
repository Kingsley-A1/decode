import { ReviewClient } from "@/components/reviews/ReviewClient";
import { PageShell } from "@/components/PageShell";

export default function ReviewPage() {
  return (
    <PageShell
      title="Reviews"
      description="Read and submit real reviews for Decode."
    >
      <ReviewClient />
    </PageShell>
  );
}
