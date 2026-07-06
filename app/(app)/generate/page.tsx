import { PageShell } from "@/components/PageShell";
import { QRGenerator } from "@/components/QRGenerator";
import { sanitizeReturnTo } from "@/lib/redirects";

interface GeneratePageProps {
  readonly searchParams?: Promise<{
    readonly mode?: string | readonly string[];
    readonly returnTo?: string | readonly string[];
  }>;
}

export default async function GeneratePage({ searchParams }: GeneratePageProps) {
  const params = await searchParams;
  const modeParam = Array.isArray(params?.mode) ? params.mode[0] : params?.mode;
  const returnToParam = Array.isArray(params?.returnTo)
    ? params.returnTo[0]
    : params?.returnTo;
  const initialMode = modeParam === "dynamic" ? "dynamic" : "static";
  const returnTo = returnToParam
    ? sanitizeReturnTo(returnToParam, "/landing-pages")
    : null;

  return (
    <PageShell
      title="Generate QR codes"
      description="Create scan-ready static and dynamic QR codes."
      variant="workspace"
    >
      <QRGenerator initialMode={initialMode} returnTo={returnTo} />
    </PageShell>
  );
}
