import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface BuilderActionBarProps {
  mobile: ReactNode;
  desktop?: ReactNode;
  className?: string;
  mobileClassName?: string;
  desktopClassName?: string;
}

export function BuilderActionBar({
  mobile,
  desktop,
  className,
  mobileClassName,
  desktopClassName,
}: BuilderActionBarProps) {
  return (
    <div className={className}>
      {desktop && (
        <div
          className={cn(
            "hidden flex-col-reverse gap-2 sm:flex sm:flex-row sm:items-center sm:justify-between",
            desktopClassName
          )}
        >
          {desktop}
        </div>
      )}
      <div
        className={cn(
          "sticky bottom-0 z-20 -mx-4 mt-5 border-t border-slate-200 bg-white/95 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-[0_-12px_28px_rgba(15,23,42,0.08)] backdrop-blur sm:hidden",
          mobileClassName
        )}
      >
        {mobile}
      </div>
    </div>
  );
}
