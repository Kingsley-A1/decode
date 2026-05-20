"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  readonly error: Error & { readonly digest?: string };
  readonly reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error, {
      tags: {
        boundary: "global",
        digest: error.digest ?? "missing",
      },
    });
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-950 antialiased">
        <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-6 py-16">
          <p className="text-sm font-semibold uppercase text-sky-700">
            Decode
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">
            Something went wrong.
          </h1>
          <p className="mt-4 text-base leading-7 text-slate-600">
            The error has been captured for review. Retry the action, and use
            the request ID from the failed API response when reporting a
            repeatable issue.
          </p>
          <button
            type="button"
            onClick={reset}
            className="mt-8 min-h-11 rounded-lg bg-sky-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-800 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
