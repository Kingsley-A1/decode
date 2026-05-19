import { ReviewClient } from "@/components/reviews/ReviewClient";
import { PageShell } from "@/components/PageShell";

export default function ReviewPage() {
  return (
    <PageShell
      eyebrow="Product feedback"
      title="Reviews"
      description="Read and submit database-backed reviews for Decode. No client-side testimonial mocks are used on this page."
    >
      <ReviewClient />
    </PageShell>
  );
}
