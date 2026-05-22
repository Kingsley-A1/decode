import { redirect } from "next/navigation";

interface AdminTemplateEditRedirectPageProps {
  readonly params: Promise<{ readonly id: string }>;
}

export default async function AdminTemplateEditRedirectPage({
  params,
}: AdminTemplateEditRedirectPageProps) {
  const { id } = await params;

  redirect(`/admin/templates/${id}`);
}
