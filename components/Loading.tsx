import { cn } from "@/lib/utils";

interface LoadingProps {
  readonly label?: string;
  readonly className?: string;
}

export function Loading({
  label = "Loading",
  className,
}: LoadingProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex min-h-40 items-center justify-center px-4 py-8 text-center",
        className
      )}
    >
      <div className="inline-flex items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm">
        <span
          className="h-4 w-4 rounded-full border-2 border-slate-200 border-t-sky-700 motion-safe:animate-spin"
          aria-hidden="true"
        />
        <span>{label}</span>
      </div>
    </div>
  );
}
