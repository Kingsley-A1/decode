"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { bottomNavItems, isActivePath } from "@/components/navigation";
import { cn } from "@/lib/utils";

/**
 * Fixed, thumb-reachable navigation for phones. It mirrors the top bar's four
 * core destinations (Links, Pages, Generate, Scan) so mobile users never have
 * to open the full menu for everyday actions. Hidden from `md` up, where the
 * header already exposes navigation.
 */
export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary mobile navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden"
    >
      <ul className="mx-auto flex max-w-md items-stretch">
        {bottomNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = isActivePath(pathname, item.href);

          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-1 px-1 py-2 text-[0.6875rem] font-medium transition-colors",
                  isActive
                    ? "text-sky-800"
                    : "text-slate-500 hover:text-sky-800"
                )}
              >
                <span
                  className={cn(
                    "inline-flex h-8 w-12 items-center justify-center rounded-full transition-colors",
                    isActive && "bg-sky-100"
                  )}
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
