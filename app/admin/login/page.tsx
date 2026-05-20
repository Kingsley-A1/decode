import { redirect } from "next/navigation";
import { AdminAuthPage } from "@/components/admin/AdminAuthPage";
import { getOptionalAdminSession } from "@/server/admin/auth";

export default async function AdminLoginPage() {
  const admin = await getOptionalAdminSession();
  if (admin) redirect("/admin/overview");

  return <AdminAuthPage mode="login" />;
}
