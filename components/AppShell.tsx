import type { ReactNode } from "react";
import { Footer } from "@/components/Footer";
import { NavBar } from "@/components/NavBar";
import { TrustedBy } from "@/components/TrustedBy";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-white focus:px-4 focus:py-3 focus:text-sm focus:font-semibold focus:text-slate-950 focus:shadow-lg"
      >
        Skip to main content
      </a>
      <NavBar />
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
        <main id="main-content" className="min-w-0">
          {children}
        </main>
      </div>
      <TrustedBy />
      <Footer />
    </div>
  );
}
