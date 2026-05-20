import { PageShell } from "@/components/PageShell";
import { QRCodeEditClient } from "@/components/dashboard/QRCodeEditClient";

interface QRCodeEditPageProps {
  readonly params: Promise<{ readonly id: string }>;
}

export default async function QRCodeEditPage({ params }: QRCodeEditPageProps) {
  const { id } = await params;

  return (
    <PageShell
      eyebrow="Destination editor"
      title="Edit QR code"
      description="Update dynamic destinations clearly while keeping static QR behavior explicit and safe."
    >
      <QRCodeEditClient qrCodeId={id} />
    </PageShell>
  );
}

