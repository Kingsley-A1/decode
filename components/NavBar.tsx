"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Menu, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/Logo";
import {
  isActivePath,
  menuNavItems,
  primaryNavItems,
} from "@/components/navigation";

export function NavBar() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isMenuOpen) return;

    const previousActiveElement = document.activeElement;
    const fallbackFocusElement = menuButtonRef.current;
    const firstLink = dialogRef.current?.querySelector<HTMLElement>(
      "a[href], button:not([disabled])"
    );

    firstLink?.focus();
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "";
      if (previousActiveElement instanceof HTMLElement) {
        previousActiveElement.focus();
      } else {
        fallbackFocusElement?.focus();
      }
    };
  }, [isMenuOpen]);

  const handleDialogKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      setIsMenuOpen(false);
      return;
    }

    if (event.key !== "Tab") return;

    const focusable = Array.from(
      dialogRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      ) ?? []
    );

    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-xl">
      <div className="mx-auto grid min-h-16 w-full max-w-7xl grid-cols-[auto_1fr_auto] items-center gap-3 px-4 sm:px-6 lg:px-8">
        <div className="min-w-0 xl:min-w-44">
          <Logo size="md" showText />
        </div>

        <nav
          className="hidden items-center justify-center gap-1 xl:flex"
          aria-label="Primary navigation"
        >
          {primaryNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = isActivePath(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "inline-flex min-h-11 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-sky-50 hover:text-sky-800",
                  isActive && "bg-sky-100 text-sky-900"
                )}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="flex min-w-0 items-center justify-end gap-2 xl:min-w-44">
          <Link
            href="/generate"
            className="hidden min-h-11 items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-sky-600/20 transition-colors hover:bg-sky-700 sm:inline-flex"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            New QR
          </Link>

          <button
            ref={menuButtonRef}
            type="button"
            onClick={() => setIsMenuOpen(true)}
            aria-label="Open navigation sidebar"
            aria-expanded={isMenuOpen}
            aria-controls="mobile-navigation"
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm transition-colors hover:border-sky-300 hover:text-sky-800"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>

      {isMenuOpen && (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            aria-label="Dismiss navigation sidebar"
            className="absolute inset-0 bg-slate-950/40"
            onClick={() => setIsMenuOpen(false)}
          />
          <div
            id="mobile-navigation"
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation sidebar"
            onKeyDown={handleDialogKeyDown}
            className="absolute left-0 top-0 flex h-dvh w-full max-w-xs flex-col border-r border-slate-200 bg-white shadow-2xl sm:max-w-sm"
          >
            <div className="flex min-h-16 items-center justify-between border-b border-slate-200 px-4">
              <Logo size="sm" showText />
              <button
                type="button"
                onClick={() => setIsMenuOpen(false)}
                aria-label="Close navigation menu"
                className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-slate-200 text-slate-700 transition-colors hover:border-sky-300 hover:text-sky-800"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <nav
              className="flex flex-col gap-1 overflow-y-auto p-4"
              aria-label="Priority navigation"
            >
              {menuNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = isActivePath(pathname, item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMenuOpen(false)}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "flex min-h-12 items-center gap-3 rounded-lg px-3 text-base font-semibold text-slate-700 transition-colors hover:bg-sky-50 hover:text-sky-800",
                      isActive && "bg-sky-100 text-sky-900"
                    )}
                  >
                    <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="mt-auto border-t border-slate-200 p-4">
              <Link
                href="/generate"
                onClick={() => setIsMenuOpen(false)}
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-sky-600 px-4 py-3 text-sm font-semibold text-white shadow-sm shadow-sky-600/20 transition-colors hover:bg-sky-700"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                Create new QR
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
