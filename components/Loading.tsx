import { Logo } from "@/components/Logo";
import { cn } from "@/lib/utils";

interface LoadingProps {
  readonly label?: string;
  readonly className?: string;
}

export function Loading({
  label = "Loading DECODE",
  className,
}: LoadingProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex min-h-64 flex-col items-center justify-center gap-4 rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm",
        className
      )}
    >
      <div className="relative">
        <div className="absolute inset-0 rounded-2xl bg-sky-200/70 blur-xl" />
        <div className="relative rounded-2xl bg-white p-2 shadow-sm ring-1 ring-sky-100">
          <Logo size="lg" showText={false} linkToHome={false} />
        </div>
        <div className="absolute -inset-2 rounded-3xl border-2 border-sky-300 border-t-sky-700 motion-safe:animate-spin" />
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-950">{label}</p>
        <p className="mt-1 text-sm text-slate-600">
          Preparing a secure workspace.
        </p>
      </div>
    </div>
  );
}

