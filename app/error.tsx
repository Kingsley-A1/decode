"use client";

import * as Sentry from "@sentry/nextjs";
import { RefreshCw } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui";

export default function AppError({
  error,
  reset,
}: {
  readonly error: Error & { readonly digest?: string };
  readonly reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error, {
      tags: {
        boundary: "app",
        digest: error.digest ?? "missing",
      },
    });
  }, [error]);

  return (
    <section className="mx-auto max-w-2xl rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm sm:p-8">
      <p className="text-sm font-semibold uppercase text-sky-700">
        Workspace error
      </p>
      <h1 className="mt-3 text-3xl font-semibold text-slate-950">
        This page could not finish loading.
      </h1>
      <p className="mt-3 text-base leading-7 text-slate-600">
        Retry the page. If it repeats, the captured error digest can be matched
        in monitoring without exposing sensitive request details.
      </p>
      {error.digest && (
        <p className="mt-4 break-all rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600">
          Error digest: {error.digest}
        </p>
      )}
      <Button
        variant="primary"
        onClick={reset}
        className="mt-6"
        leftIcon={<RefreshCw className="h-4 w-4" aria-hidden="true" />}
      >
        Try again
      </Button>
    </section>
  );
}
