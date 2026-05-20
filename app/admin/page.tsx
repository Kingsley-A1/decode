import { redirect } from "next/navigation";
import { getOptionalAdminSession } from "@/server/admin/auth";

export default async function AdminIndexPage() {
  const admin = await getOptionalAdminSession();

  redirect(admin ? "/admin/overview" : "/admin/login");
}
