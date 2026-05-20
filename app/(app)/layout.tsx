import type { ReactNode } from "react";
import { AppShell } from "@/components/AppShell";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";
import { ThemeProvider } from "@/context/ThemeContext";

interface PublicAppLayoutProps {
  readonly children: ReactNode;
}

export default function PublicAppLayout({ children }: PublicAppLayoutProps) {
  return (
    <ThemeProvider>
      <AppShell>{children}</AppShell>
      <PWAInstallPrompt />
      <ServiceWorkerRegistration />
    </ThemeProvider>
  );
}
