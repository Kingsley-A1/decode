"use client";

import { useState, type ReactNode } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

type StatusVariant = "neutral" | "info" | "success" | "warning" | "danger";

interface MobilePreviewTrayProps {
  title: string;
  summary: ReactNode;
  preview: ReactNode;
  status: {
    label: string;
    variant: StatusVariant;
  };
  isLoading?: boolean;
  className?: string;
  "data-testid"?: string;
}

export function MobilePreviewTray({
  title,
  summary,
  preview,
  status,
  isLoading = false,
  className,
  "data-testid": testId,
}: MobilePreviewTrayProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <section
      aria-label="Mobile preview"
      data-testid={testId}
      className={cn(
        "rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm xl:hidden",
        className
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "flex shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white p-2 shadow-[0_10px_30px_rgba(0,122,255,0.10)]",
            isExpanded ? "h-40 w-40" : "h-16 w-16",
            isLoading && "animate-pulse"
          )}
        >
          {preview}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-900">
              {title}
            </p>
            <Badge variant={status.variant} className="shrink-0">
              {status.label}
            </Badge>
          </div>
          <p className="mt-1 line-clamp-1 break-all text-sm leading-5 text-slate-600">
            {summary}
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded((previous) => !previous)}
            aria-expanded={isExpanded}
            className="mt-1 px-0 text-sky-800 hover:bg-transparent hover:text-sky-900"
          >
            {isExpanded ? "Collapse preview" : "Expand preview"}
          </Button>
        </div>
      </div>
    </section>
  );
}
