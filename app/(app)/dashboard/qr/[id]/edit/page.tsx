import { PageShell } from "@/components/PageShell";
import { QRCodeEditClient } from "@/components/dashboard/QRCodeEditClient";

interface QRCodeEditPageProps {
  readonly params: Promise<{ readonly id: string }>;
}

export default async function QRCodeEditPage({ params }: QRCodeEditPageProps) {
  const { id } = await params;

  return (
    <PageShell
      title="Edit QR code"
      description="Update this QR's destination and design safely."
    >
      <QRCodeEditClient qrCodeId={id} />
    </PageShell>
  );
}

