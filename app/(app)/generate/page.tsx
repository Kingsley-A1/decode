import { PageShell } from "@/components/PageShell";
import { QRGenerator } from "@/components/QRGenerator";

interface GeneratePageProps {
  readonly searchParams?: Promise<{
    readonly mode?: string | readonly string[];
  }>;
}

export default async function GeneratePage({ searchParams }: GeneratePageProps) {
  const params = await searchParams;
  const modeParam = Array.isArray(params?.mode) ? params.mode[0] : params?.mode;
  const initialMode = modeParam === "dynamic" ? "dynamic" : "static";

  return (
    <PageShell
      title="Generate QR codes"
      description="Create scan-ready static and dynamic QR codes."
      variant="workspace"
    >
      <QRGenerator showHeader={false} initialMode={initialMode} />
    </PageShell>
  );
}
