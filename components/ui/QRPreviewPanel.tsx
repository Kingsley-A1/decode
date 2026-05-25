import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface QRPreviewPanelProps {
  children: ReactNode;
  isLoading?: boolean;
  action?: ReactNode;
  variant?: "card" | "bare";
  className?: string;
  previewClassName?: string;
}

export function QRPreviewPanel({
  children,
  isLoading = false,
  action,
  variant = "card",
  className,
  previewClassName,
}: QRPreviewPanelProps) {
  return (
    <section
      className={cn(
        variant === "card"
          ? "rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          : "p-0",
        className
      )}
      aria-label="QR preview"
    >
      <div
        className={cn(
          "relative mx-auto flex aspect-square w-full max-w-[320px] items-center justify-center rounded-xl border border-slate-200 bg-white p-5 shadow-[0_20px_60px_rgba(0,122,255,0.12)]",
          isLoading && "animate-pulse",
          previewClassName
        )}
      >
        {children}
      </div>
      {action && <div className="mt-4">{action}</div>}
    </section>
  );
}
