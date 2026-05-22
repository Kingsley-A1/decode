import { AdminTemplateConsole } from "@/components/admin/AdminTemplateConsole";
import {
  loadTemplateConsoleData,
  loadTemplateConsoleTemplate,
} from "@/app/admin/(console)/templates/template-console-data";

interface AdminTemplateEditPageProps {
  readonly params: Promise<{ readonly id: string }>;
  readonly searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function AdminTemplateEditPage({
  params,
  searchParams,
}: AdminTemplateEditPageProps) {
  const [{ id }, data] = await Promise.all([
    params,
    loadTemplateConsoleData(await searchParams),
  ]);
  const template = await loadTemplateConsoleTemplate(id);

  return (
    <AdminTemplateConsole
      rows={data.rows}
      total={data.total}
      nextCursor={data.nextCursor}
      backendUnavailable={data.backendUnavailable}
      query={data.query}
      mode="edit"
      selectedTemplate={template}
    />
  );
}
