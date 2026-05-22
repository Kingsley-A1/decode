import Link from "next/link";
import { ImagePlus } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";

export default function AdminTemplateAssetsPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Template Assets"
        description="Template assets are uploaded and attached inside the template editor so every file stays tied to a reviewed template definition."
      />

      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <ImagePlus className="h-10 w-10 text-sky-700" aria-hidden="true" />
        <h2 className="mt-4 text-lg font-semibold text-slate-950">
          Upload assets from a template
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Open a template draft, add an asset requirement, and use the owned
          upload control. Uploaded assets are stored separately from user media
          and served through the public template asset endpoint.
        </p>
        <Link
          href="/admin/templates/new"
          className="mt-5 inline-flex min-h-11 items-center justify-center rounded-lg border border-sky-700 bg-sky-700 px-4 text-sm font-semibold text-white shadow-sm shadow-sky-700/20 hover:border-sky-800 hover:bg-sky-800"
        >
          Create template
        </Link>
      </section>
    </div>
  );
}
