import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageShellProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  variant?: "default" | "workspace";
}

export function PageShell({
  title,
  description,
  actions,
  children,
  className,
  variant = "default",
}: PageShellProps) {
  const isWorkspace = variant === "workspace";

  return (
    <section className={cn(isWorkspace ? "space-y-4" : "space-y-6", className)}>
      <div
        className={cn(
          "flex flex-col border-b border-slate-200 md:flex-row md:justify-between",
          isWorkspace
            ? "gap-3 pb-3 md:items-center"
            : "gap-4 pb-6 md:items-end"
        )}
      >
        <div className={cn("max-w-3xl", isWorkspace ? "space-y-1" : "space-y-2")}>
          <h1
            className={cn(
              "font-semibold leading-tight text-sky-700",
              isWorkspace ? "text-2xl sm:text-3xl" : "text-3xl sm:text-4xl"
            )}
          >
            {title}
          </h1>
          {description && (
            <p
              className={cn(
                "max-w-2xl text-slate-600",
                isWorkspace ? "text-sm leading-6" : "text-base leading-7"
              )}
            >
              {description}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>
        )}
      </div>
      {children}
    </section>
  );
}
