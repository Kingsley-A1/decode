import { PageShell } from "@/components/PageShell";
import { ShortLinkConsole } from "@/components/short-links/ShortLinkConsole";

export default function ShortenPage() {
  return (
    <PageShell
      title="Shorten a link"
      description="Shorten links safely with automatic verification."
    >
      <ShortLinkConsole />
    </PageShell>
  );
}
