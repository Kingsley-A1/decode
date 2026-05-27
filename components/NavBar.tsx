"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Menu, Plus, UserRound, X } from "lucide-react";
import { getFreshClientSession } from "@/lib/client-auth";
import { getCurrentRelativeUrl, withReturnTo } from "@/lib/redirects";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/Logo";
import {
  isActivePath,
  menuNavItems,
  primaryNavItems,
} from "@/components/navigation";

type HeaderAuthState =
  | "checking"
  | "authenticated"
  | "registered"
  | "new";

const knownUserStorageKey = "decode:auth:known-user:v1";

export function NavBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [authState, setAuthState] = useState<HeaderAuthState>("checking");
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;

    const syncAuthState = async () => {
      const session = await getFreshClientSession();
      if (!isMounted) return;

      if (session?.user) {
        rememberKnownUser();
        setAuthState("authenticated");
        return;
      }

      setAuthState(getSignedOutAuthState());
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void syncAuthState();
      }
    };
    const handleFocus = () => {
      void syncAuthState();
    };

    void syncAuthState();
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      isMounted = false;
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [pathname]);

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
  const currentUrl = getCurrentRelativeUrl({ pathname, search: searchParams });
  const loginHref = withReturnTo("/me?intent=login", currentUrl);
  const signupHref = withReturnTo("/me?intent=signup", currentUrl);

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
          {authState === "authenticated" ? (
            <Link
              href="/me"
              aria-label="Open profile"
              title="Profile"
              className="hidden h-11 w-11 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm transition-colors hover:border-sky-300 hover:text-sky-800 sm:inline-flex"
            >
              <UserRound className="h-5 w-5" aria-hidden="true" />
            </Link>
          ) : authState === "registered" ? (
            <Link
              href={loginHref}
              className="inline-flex min-h-11 items-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:border-sky-300 hover:text-sky-800"
            >
              Login
            </Link>
          ) : authState === "new" ? (
            <Link
              href={signupHref}
              className="inline-flex min-h-11 items-center rounded-lg bg-sky-700 px-3 py-2 text-sm font-semibold text-white shadow-sm shadow-sky-700/20 transition-colors hover:bg-sky-800"
            >
              Sign up
            </Link>
          ) : (
            <span
              className="hidden h-11 w-20 rounded-lg bg-slate-100 md:inline-block"
              aria-hidden="true"
            />
          )}

          <Link
            href="/generate"
            aria-label="New QR"
            aria-current={
              isActivePath(pathname, "/generate") ? "page" : undefined
            }
            className={cn(
              "inline-flex h-11 w-11 items-center justify-center rounded-lg shadow-sm transition-colors sm:hidden",
              authState !== "authenticated" && "hidden",
              isActivePath(pathname, "/generate")
                ? "border border-sky-200 bg-sky-100 text-sky-900"
                : "bg-sky-700 text-white shadow-sky-700/20 hover:bg-sky-800"
            )}
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
          </Link>

          <Link
            href="/generate"
            className="hidden min-h-11 items-center gap-2 rounded-lg bg-sky-700 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-sky-700/20 transition-colors hover:bg-sky-800 sm:inline-flex"
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
              {authState === "authenticated" ? (
                <Link
                  href="/me"
                  onClick={() => setIsMenuOpen(false)}
                  className="mb-2 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:border-sky-300 hover:text-sky-800"
                >
                  <UserRound className="h-4 w-4" aria-hidden="true" />
                  Profile
                </Link>
              ) : authState === "registered" ? (
                <Link
                  href={loginHref}
                  onClick={() => setIsMenuOpen(false)}
                  className="mb-2 inline-flex min-h-12 w-full items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:border-sky-300 hover:text-sky-800"
                >
                  Login
                </Link>
              ) : authState === "new" ? (
                <Link
                  href={signupHref}
                  onClick={() => setIsMenuOpen(false)}
                  className="mb-2 inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-sky-700 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-sky-800"
                >
                  Sign up
                </Link>
              ) : (
                <span
                  className="mb-2 block h-12 w-full rounded-lg bg-slate-100"
                  aria-hidden="true"
                />
              )}
              <Link
                href="/generate"
                onClick={() => setIsMenuOpen(false)}
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-sky-700 px-4 py-3 text-sm font-semibold text-white shadow-sm shadow-sky-700/20 transition-colors hover:bg-sky-800"
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

function getSignedOutAuthState(): HeaderAuthState {
  return hasKnownUserMarker() ? "registered" : "new";
}

function hasKnownUserMarker(): boolean {
  try {
    return window.localStorage.getItem(knownUserStorageKey) === "true";
  } catch {
    return false;
  }
}

function rememberKnownUser(): void {
  try {
    window.localStorage.setItem(knownUserStorageKey, "true");
  } catch {
    // Storage can be unavailable in hardened browsers. The session state still wins.
  }
}
