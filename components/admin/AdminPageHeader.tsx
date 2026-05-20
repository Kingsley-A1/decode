import type { ReactNode } from "react";

interface AdminPageHeaderProps {
  readonly title: string;
  readonly description: string;
  readonly eyebrow?: string;
  readonly actions?: ReactNode;
}

export function AdminPageHeader({
  title,
  description,
  eyebrow = "Admin",
  actions,
}: AdminPageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 md:flex-row md:items-end md:justify-between">
      <div className="max-w-3xl space-y-2">
        <p className="text-sm font-semibold uppercase tracking-normal text-sky-700">
          {eyebrow}
        </p>
        <h1 className="text-3xl font-semibold leading-tight text-slate-950 sm:text-4xl">
          {title}
        </h1>
        <p className="text-base leading-7 text-slate-600">{description}</p>
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
