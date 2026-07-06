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
      title="Saved QR code"
      description="Review destination, analytics, and controls for this QR."
    >
      <QRCodeDetailClient qrCodeId={id} />
    </PageShell>
  );
}

