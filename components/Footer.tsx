import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface FooterProps {
  variant?: "default" | "compact";
}

export function Footer({ variant = "default" }: FooterProps) {
  const isCompact = variant === "compact";

  return (
    <footer className="border-t border-slate-200 bg-slate-50">
      <div
        className={cn(
          "mx-auto w-full max-w-7xl px-4 text-sm text-slate-600 sm:px-6 lg:px-8",
          isCompact ? "py-4" : "py-8"
        )}
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <p>
            Designed and developed by{" "}
            <a
              href="https://bespoketech.com.ng"
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-sky-700 underline-offset-4 hover:underline"
            >
              Bespoke Technologies
            </a>
            .
          </p>
          <nav
            aria-label="Footer navigation"
            className={cn("flex flex-wrap gap-3", isCompact && "text-xs")}
          >
            <Link
              href="/about"
              className="font-medium text-slate-700 hover:text-sky-800"
            >
              About
            </Link>
            <Link
              href="/docs"
              className="font-medium text-slate-700 hover:text-sky-800"
            >
              Docs
            </Link>
            <Link
              href="/support"
              className="font-medium text-slate-700 hover:text-sky-800"
            >
              Support
            </Link>
            <Link
              href="/privacy"
              className="font-medium text-slate-700 hover:text-sky-800"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="font-medium text-slate-700 hover:text-sky-800"
            >
              Terms
            </Link>
            <a
              href="https://bespoketech.com.ng"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 font-medium text-slate-700 hover:text-sky-800"
            >
              bespoketech.com.ng
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          </nav>
        </div>
      </div>
    </footer>
  );
}
