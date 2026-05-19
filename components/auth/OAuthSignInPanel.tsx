"use client";

import { signIn } from "next-auth/react";
import { Github, LogIn } from "lucide-react";
import { Button } from "@/components/ui";

interface OAuthSignInPanelProps {
  readonly callbackUrl?: string;
}

export function OAuthSignInPanel({
  callbackUrl = "/me",
}: OAuthSignInPanelProps) {
  const handleGoogleSignIn = () => {
    void signIn("google", { callbackUrl });
  };

  const handleGithubSignIn = () => {
    void signIn("github", { callbackUrl });
  };

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-normal text-sky-700">
          Account access
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-slate-950">
          Sign in to create your Decode account
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          OAuth requires explicit provider consent. After you approve Google or
          GitHub sign-in, Decode stores your user record and creates a default
          workspace for saved QR codes, pages, analytics, and reviews.
        </p>
      </div>
      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <Button
          type="button"
          variant="primary"
          onClick={handleGoogleSignIn}
          leftIcon={<LogIn className="h-4 w-4" aria-hidden="true" />}
        >
          Continue with Google
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={handleGithubSignIn}
          leftIcon={<Github className="h-4 w-4" aria-hidden="true" />}
        >
          Continue with GitHub
        </Button>
      </div>
    </section>
  );
}
