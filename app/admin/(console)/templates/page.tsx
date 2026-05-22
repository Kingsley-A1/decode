import { AdminTemplateConsole } from "@/components/admin/AdminTemplateConsole";
import { loadTemplateConsoleData } from "@/app/admin/(console)/templates/template-console-data";

interface AdminTemplatesPageProps {
  readonly searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function AdminTemplatesPage({
  searchParams,
}: AdminTemplatesPageProps) {
  const data = await loadTemplateConsoleData(await searchParams);

  return (
    <AdminTemplateConsole
      rows={data.rows}
      total={data.total}
      nextCursor={data.nextCursor}
      backendUnavailable={data.backendUnavailable}
      query={data.query}
      mode="list"
    />
  );
}
