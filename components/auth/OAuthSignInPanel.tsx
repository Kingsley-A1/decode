"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { Github, Loader2, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface OAuthSignInPanelProps {
  readonly callbackUrl?: string;
  readonly title?: string;
  readonly description?: string;
  readonly className?: string;
  readonly onBeforeSignIn?: () => void;
}

type OAuthProvider = "google" | "github";

interface ProviderOption {
  readonly id: OAuthProvider;
  readonly label: string;
  readonly description: string;
  readonly icon: ReactNode;
  readonly className: string;
  readonly iconWrapClassName: string;
  readonly labelClassName: string;
  readonly descriptionClassName: string;
}

const providerOptions: readonly ProviderOption[] = [
  {
    id: "google",
    label: "Continue with Google",
    description: "Use a Google account",
    icon: <GoogleIcon />,
    className:
      "border-slate-300 bg-white shadow-sm hover:border-slate-400 hover:bg-slate-50",
    iconWrapClassName: "border-slate-200 bg-white",
    labelClassName: "text-slate-950",
    descriptionClassName: "text-slate-600",
  },
  {
    id: "github",
    label: "Continue with GitHub",
    description: "Use a GitHub account",
    icon: <Github className="h-5 w-5" aria-hidden="true" />,
    className:
      "border-slate-950 bg-slate-950 shadow-sm shadow-slate-950/15 hover:border-slate-800 hover:bg-slate-800",
    iconWrapClassName: "border-white/10 bg-white text-slate-950",
    labelClassName: "text-slate-50",
    descriptionClassName: "text-slate-200",
  },
];

export function OAuthSignInPanel({
  callbackUrl = "/me",
  title = "Sign in to continue",
  description = "Use Google or GitHub to access your Decode workspace.",
  className,
  onBeforeSignIn,
}: OAuthSignInPanelProps) {
  const [pendingProvider, setPendingProvider] = useState<OAuthProvider | null>(
    null
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSignIn = async (provider: OAuthProvider) => {
    if (pendingProvider) return;

    setPendingProvider(provider);
    setErrorMessage(null);

    try {
      onBeforeSignIn?.();
      await signIn(provider, { callbackUrl });
    } catch {
      setErrorMessage(
        "We could not start the provider sign-in. Check your connection and try again."
      );
      setPendingProvider(null);
    }
  };

  return (
    <section
      className={cn(
        "rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5",
        className
      )}
      aria-labelledby="oauth-sign-in-title"
      aria-describedby="oauth-sign-in-description oauth-sign-in-trust"
      aria-busy={Boolean(pendingProvider)}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2
            id="oauth-sign-in-title"
            className="text-lg font-semibold leading-7 text-slate-950"
          >
            {title}
          </h2>
          <p
            id="oauth-sign-in-description"
            className="mt-1 text-sm leading-6 text-slate-600"
          >
            {description}
          </p>
        </div>
        <span className="inline-flex min-h-8 shrink-0 items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
          <ShieldCheck className="h-4 w-4" aria-hidden="true" />
          OAuth
        </span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {providerOptions.map((provider) => (
          <ProviderButton
            key={provider.id}
            provider={provider}
            isLoading={pendingProvider === provider.id}
            isDisabled={Boolean(pendingProvider)}
            onClick={() => void handleSignIn(provider.id)}
          />
        ))}
      </div>

      {errorMessage && (
        <p
          className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm leading-6 text-rose-800"
          role="alert"
        >
          {errorMessage}
        </p>
      )}

      <p
        id="oauth-sign-in-trust"
        className="mt-3 flex items-start gap-2 text-xs leading-5 text-slate-500"
      >
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-sky-700" aria-hidden="true" />
        Decode receives account identity only after provider consent.
      </p>
    </section>
  );
}

function ProviderButton({
  provider,
  isLoading,
  isDisabled,
  onClick,
}: {
  readonly provider: ProviderOption;
  readonly isLoading: boolean;
  readonly isDisabled: boolean;
  readonly onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isDisabled}
      className={cn(
        "group flex min-h-12 w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-amber-400 disabled:cursor-not-allowed disabled:opacity-60",
        provider.className
      )}
      aria-label={provider.label}
    >
      <span
        className={cn(
          "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border",
          provider.iconWrapClassName
        )}
      >
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
        ) : (
          provider.icon
        )}
      </span>
      <span className="min-w-0">
        <span
          className={cn(
            "block text-sm font-semibold leading-5",
            provider.labelClassName
          )}
        >
          {isLoading ? "Opening provider" : provider.label}
        </span>
        <span
          className={cn("block text-xs leading-5", provider.descriptionClassName)}
        >
          {provider.description}
        </span>
      </span>
    </button>
  );
}

function GoogleIcon() {
  return (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="#4285F4"
        d="M22.6 12.23c0-.78-.07-1.53-.2-2.23H12v4.22h5.94a5.08 5.08 0 0 1-2.2 3.33v2.77h3.56c2.08-1.92 3.3-4.74 3.3-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.67l-3.56-2.77c-.99.66-2.25 1.05-3.72 1.05-2.86 0-5.29-1.93-6.16-4.53H2.17v2.84A10.99 10.99 0 0 0 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.08A6.6 6.6 0 0 1 5.5 12c0-.72.12-1.43.34-2.08V7.08H2.17A10.99 10.99 0 0 0 1 12c0 1.77.42 3.45 1.17 4.92l3.67-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.39c1.62 0 3.07.56 4.21 1.65l3.16-3.16C17.45 2.09 14.97 1 12 1A10.99 10.99 0 0 0 2.17 7.08l3.67 2.84C6.71 7.32 9.14 5.39 12 5.39z"
      />
    </svg>
  );
}
