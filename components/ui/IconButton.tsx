import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Button } from "@/components/ui/Button";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  "aria-label": string;
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "danger" | "success";
}

export function IconButton({
  children,
  variant = "secondary",
  ...props
}: IconButtonProps) {
  return (
    <Button variant={variant} size="icon" {...props}>
      {children}
    </Button>
  );
}
