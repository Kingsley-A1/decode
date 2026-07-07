"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Footer } from "@/components/Footer";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { NavBar } from "@/components/NavBar";
import { cn } from "@/lib/utils";

export type AppShellChrome = "default" | "workspace";

interface AppShellProps {
  children: ReactNode;
  chrome?: AppShellChrome;
}

const workspaceRoutePrefixes = [
  "/generate",
  "/dashboard",
  "/landing-pages",
  "/me",
] as const;

function getRouteChrome(
  pathname: string | null,
  preferredChrome: AppShellChrome
): AppShellChrome {
  if (preferredChrome === "workspace") return "workspace";
  if (!pathname) return preferredChrome;

  return workspaceRoutePrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  )
    ? "workspace"
    : preferredChrome;
}

export function AppShell({ children, chrome = "default" }: AppShellProps) {
  const pathname = usePathname();
  const activeChrome = getRouteChrome(pathname, chrome);
  const isWorkspace = activeChrome === "workspace";
  const isWideDocumentation = pathname === "/api";

  return (
    <div
      className="min-h-screen bg-[var(--background)] pb-[calc(3.5rem+env(safe-area-inset-bottom))] text-[var(--foreground)] md:pb-0"
      data-app-shell-chrome={activeChrome}
    >
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-white focus:px-4 focus:py-3 focus:text-sm focus:font-semibold focus:text-slate-950 focus:shadow-lg"
      >
        Skip to main content
      </a>
      <NavBar />
      <div
        className={cn(
          "mx-auto w-full px-4 sm:px-6 lg:px-8",
          isWorkspace || isWideDocumentation
            ? "max-w-none py-4 sm:py-5 lg:py-6"
            : "max-w-7xl py-6 sm:py-8 lg:py-10"
        )}
      >
        <main id="main-content" className="min-w-0">
          {children}
        </main>
      </div>
      {isWorkspace ? <Footer variant="compact" /> : <Footer />}
      <MobileBottomNav />
    </div>
  );
}
