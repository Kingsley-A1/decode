import { AdminResourcePage } from "@/components/admin/AdminResourcePage";

interface AdminQRCodesPageProps {
  readonly searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function AdminQRCodesPage({
  searchParams,
}: AdminQRCodesPageProps) {
  return (
    <AdminResourcePage
      config={{
        resource: "qr-codes",
        title: "QR Codes",
        description: "Static and dynamic QR code inventory with scan totals and status.",
        emptyTitle: "No QR codes found",
        emptyDescription: "Saved QR codes appear after authenticated creation.",
      }}
      searchParams={await searchParams}
    />
  );
}
