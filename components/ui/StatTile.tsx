import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface StatTileProps {
  label: string;
  value: string;
  icon?: ReactNode;
  className?: string;
}

export function StatTile({ label, value, icon, className }: StatTileProps) {
  return (
    <section
      className={cn(
        "rounded-xl border border-slate-200 bg-white p-4 shadow-sm",
        className
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-600">{label}</p>
        {icon && (
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-sky-50 text-sky-700">
            {icon}
          </span>
        )}
      </div>
      <p className="mt-4 text-2xl font-semibold text-slate-950">{value}</p>
    </section>
  );
}
