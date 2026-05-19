import type { HTMLAttributes, ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Info, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "info" | "success" | "warning" | "danger";
  title?: string;
  icon?: ReactNode;
}

const variantClasses = {
  info: "border-sky-200 bg-sky-50 text-sky-900",
  success: "border-emerald-200 bg-emerald-50 text-emerald-900",
  warning: "border-amber-200 bg-amber-50 text-amber-900",
  danger: "border-rose-200 bg-rose-50 text-rose-900",
};

const defaultIcons = {
  info: <Info className="h-4 w-4" aria-hidden="true" />,
  success: <CheckCircle2 className="h-4 w-4" aria-hidden="true" />,
  warning: <ShieldAlert className="h-4 w-4" aria-hidden="true" />,
  danger: <AlertTriangle className="h-4 w-4" aria-hidden="true" />,
};

export function Alert({
  variant = "info",
  title,
  icon,
  className,
  children,
  ...props
}: AlertProps) {
  return (
    <div
      role={variant === "danger" ? "alert" : "status"}
      className={cn(
        "flex items-start gap-3 rounded-lg border p-3 text-sm leading-6",
        variantClasses[variant],
        className
      )}
      {...props}
    >
      <span className="mt-0.5 shrink-0">{icon ?? defaultIcons[variant]}</span>
      <div className="min-w-0">
        {title && <p className="font-semibold">{title}</p>}
        <div className="text-current/85">{children}</div>
      </div>
    </div>
  );
}
