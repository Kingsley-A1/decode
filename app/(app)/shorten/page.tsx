import { PageShell } from "@/components/PageShell";
import { ShortLinkConsole } from "@/components/short-links/ShortLinkConsole";

export default function ShortenPage() {
  return (
    <PageShell
      eyebrow="Short links"
      title="Shorten a link"
      description="Decode verifies every destination, refuses malicious URLs, and only issues a short link when it can guarantee the result is at least 3× shorter than your original."
    >
      <ShortLinkConsole />
    </PageShell>
  );
}
