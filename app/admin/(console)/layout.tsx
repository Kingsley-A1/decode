import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { getOptionalAdminSession } from "@/server/admin/auth";

export const dynamic = "force-dynamic";

interface AdminConsoleLayoutProps {
  readonly children: ReactNode;
}

export default async function AdminConsoleLayout({
  children,
}: AdminConsoleLayoutProps) {
  const admin = await getOptionalAdminSession();
  if (!admin) redirect("/admin/login");

  return <AdminShell admin={admin}>{children}</AdminShell>;
}
