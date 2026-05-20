"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Footer } from "@/components/Footer";
import { NavBar } from "@/components/NavBar";
import { TrustedBy } from "@/components/TrustedBy";
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

  return (
    <div
      className="min-h-screen bg-[var(--background)] text-[var(--foreground)]"
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
          "mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8",
          isWorkspace ? "py-4 sm:py-5 lg:py-6" : "py-6 sm:py-8 lg:py-10"
        )}
      >
        <main id="main-content" className="min-w-0">
          {children}
        </main>
      </div>
      {isWorkspace ? (
        <Footer variant="compact" />
      ) : (
        <>
          <TrustedBy />
          <Footer />
        </>
      )}
    </div>
  );
}
