import type { ReactNode } from "react";
import { Alert } from "@/components/ui/Alert";

interface ToastProps {
  message: ReactNode;
  variant?: "info" | "success" | "warning" | "danger";
}

export function Toast({ message, variant = "info" }: ToastProps) {
  return (
    <div className="fixed bottom-6 right-6 z-50 w-[min(24rem,calc(100vw-2rem))]">
      <Alert variant={variant}>{message}</Alert>
    </div>
  );
}
