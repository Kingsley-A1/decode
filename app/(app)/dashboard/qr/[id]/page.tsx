import { PageShell } from "@/components/PageShell";
import { QRCodeDetailClient } from "@/components/dashboard/QRCodeDetailClient";

interface QRCodeDetailPageProps {
  readonly params: Promise<{ readonly id: string }>;
}

export default async function QRCodeDetailPage({
  params,
}: QRCodeDetailPageProps) {
  const { id } = await params;

  return (
    <PageShell
      eyebrow="QR detail"
      title="Saved QR code"
      description="Review destination, mode, scan analytics, and operational controls for a saved QR code."
    >
      <QRCodeDetailClient qrCodeId={id} />
    </PageShell>
  );
}

