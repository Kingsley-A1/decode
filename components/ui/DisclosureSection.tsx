"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface DisclosureSectionProps {
  title: string;
  description?: string;
  defaultOpen?: boolean;
  children: ReactNode;
  className?: string;
}

export function DisclosureSection({
  title,
  description,
  defaultOpen = false,
  children,
  className,
}: DisclosureSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <details
      className={cn(
        "group rounded-xl border border-slate-200 bg-white shadow-sm",
        className
      )}
      open={isOpen}
      onToggle={(event) => setIsOpen(event.currentTarget.open)}
    >
      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-left marker:hidden">
        <span className="min-w-0">
          <span className="block text-sm font-semibold text-slate-900">
            {title}
          </span>
          {description && (
            <span className="mt-1 block text-sm leading-5 text-slate-600">
              {description}
            </span>
          )}
        </span>
        <ChevronDown
          className="h-4 w-4 shrink-0 text-slate-500 transition-transform group-open:rotate-180"
          aria-hidden="true"
        />
      </summary>
      <div className="border-t border-slate-200 p-4">{children}</div>
    </details>
  );
}
