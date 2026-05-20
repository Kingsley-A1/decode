"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { KeyRound, LogIn, UserPlus } from "lucide-react";
import { Alert, Button, Input } from "@/components/ui";

interface AdminAuthFormProps {
  readonly mode: "login" | "register";
}

interface AdminApiResponse {
  readonly ok: boolean;
  readonly error?: { readonly message: string };
}

export function AdminAuthForm({ mode }: AdminAuthFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const isRegister = mode === "register";

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const payload = Object.fromEntries(formData.entries());

    try {
      const response = await fetch(
        isRegister ? "/api/admin/auth/register" : "/api/admin/auth/login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const body = (await response.json()) as AdminApiResponse;

      if (!body.ok) {
        throw new Error(body.error?.message ?? "Admin authentication failed.");
      }

      router.replace("/admin/overview");
      router.refresh();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Admin authentication failed."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      {error && (
        <Alert variant="danger" title="Admin access failed">
          {error}
        </Alert>
      )}

      {isRegister && (
        <Input
          label="Full name"
          name="name"
          autoComplete="name"
          minLength={2}
          maxLength={120}
          required
        />
      )}

      <Input
        label="Admin email"
        name="email"
        type="email"
        autoComplete="email"
        maxLength={254}
        required
      />

      <Input
        label="Password"
        name="password"
        type="password"
        autoComplete={isRegister ? "new-password" : "current-password"}
        minLength={isRegister ? 12 : undefined}
        maxLength={128}
        required
      />

      {isRegister && (
        <>
          <Input
            label="Confirm password"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            minLength={12}
            maxLength={128}
            required
          />
          <Input
            label="Registration code"
            name="registrationCode"
            inputMode="numeric"
            pattern="\\d{6,10}"
            minLength={6}
            maxLength={10}
            required
            hint="Use the shared 6-10 digit admin registration code."
          />
        </>
      )}

      <Button
        type="submit"
        variant="primary"
        className="w-full"
        isLoading={isLoading}
        leftIcon={
          isRegister ? (
            <UserPlus className="h-4 w-4" aria-hidden="true" />
          ) : (
            <LogIn className="h-4 w-4" aria-hidden="true" />
          )
        }
      >
        {isRegister ? "Create admin account" : "Sign in"}
      </Button>

      <div className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
        <KeyRound className="mt-0.5 h-4 w-4 shrink-0 text-sky-700" aria-hidden="true" />
        <p>
          Admin uses dedicated credentials and an isolated session cookie. OAuth
          accounts cannot access this console.
        </p>
      </div>
    </form>
  );
}
