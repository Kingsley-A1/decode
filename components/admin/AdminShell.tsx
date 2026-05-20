import type { ReactNode } from "react";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { Logo } from "@/components/Logo";
import { AdminLogoutButton } from "@/components/admin/AdminLogoutButton";
import { adminNavigationItems } from "@/components/admin/admin-navigation";
import type { AdminSessionUser } from "@/server/admin/auth";

interface AdminShellProps {
  readonly admin: AdminSessionUser;
  readonly children: ReactNode;
}

export function AdminShell({ admin, children }: AdminShellProps) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <a
        href="#admin-main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[80] focus:rounded-lg focus:bg-white focus:px-4 focus:py-3 focus:text-sm focus:font-semibold focus:text-slate-950 focus:shadow-lg"
      >
        Skip to admin content
      </a>
      <div className="grid min-h-screen lg:grid-cols-[280px_1fr]">
        <aside className="border-b border-slate-200 bg-white lg:border-b-0 lg:border-r">
          <div className="flex min-h-16 items-center justify-between gap-3 border-b border-slate-200 px-4">
            <Logo size="sm" showText />
            <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-800">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
              Admin
            </span>
          </div>
          <nav
            aria-label="Admin navigation"
            className="grid gap-1 overflow-x-auto p-3 sm:grid-cols-2 lg:block lg:overflow-x-visible"
          >
            {adminNavigationItems.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex min-h-12 min-w-48 items-start gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-700 transition-colors hover:bg-sky-50 hover:text-sky-900 lg:min-w-0"
                >
                  <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  <span className="min-w-0">
                    <span className="block font-semibold">{item.label}</span>
                    <span className="mt-0.5 hidden text-xs leading-5 text-slate-500 lg:block">
                      {item.description}
                    </span>
                  </span>
                </Link>
              );
            })}
          </nav>
        </aside>

        <div className="min-w-0">
          <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-xl">
            <div className="flex min-h-16 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-normal text-slate-500">
                  Decode control plane
                </p>
                <p className="truncate text-sm font-semibold text-slate-950">
                  {admin.name} · {admin.role}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="hidden rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600 sm:inline-flex">
                  {process.env.NEXT_PUBLIC_VERCEL_ENV ??
                    process.env.VERCEL_ENV ??
                    "development"}
                </span>
                <AdminLogoutButton />
              </div>
            </div>
          </header>

          <main
            id="admin-main"
            className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8"
          >
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
