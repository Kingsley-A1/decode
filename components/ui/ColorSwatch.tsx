import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface ColorSwatchProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  color: string;
  label: string;
  isSelected?: boolean;
}

export function ColorSwatch({
  color,
  label,
  isSelected = false,
  className,
  ...props
}: ColorSwatchProps) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={isSelected}
      title={label}
      className={cn(
        "h-11 w-11 rounded-full border-2 shadow-sm transition-transform hover:scale-105",
        isSelected
          ? "scale-105 border-sky-600 ring-2 ring-sky-200"
          : "border-slate-200",
        className
      )}
      style={{ backgroundColor: color }}
      {...props}
    />
  );
}
