import Link from "next/link";
import { Logo } from "@/components/Logo";
import { AdminAuthForm } from "@/components/admin/AdminAuthForm";

interface AdminAuthPageProps {
  readonly mode: "login" | "register";
}

export function AdminAuthPage({ mode }: AdminAuthPageProps) {
  const isRegister = mode === "register";

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-950">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-md flex-col justify-center">
        <div className="mb-8">
          <Logo size="md" showText />
        </div>
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 space-y-2">
            <p className="text-sm font-semibold uppercase tracking-normal text-sky-700">
              Decode admin
            </p>
            <h1 className="text-2xl font-semibold text-slate-950">
              {isRegister ? "Register admin account" : "Sign in to admin"}
            </h1>
            <p className="text-sm leading-6 text-slate-600">
              {isRegister
                ? "Use credentials and the shared registration code to join the internal control plane."
                : "Use dedicated admin credentials. Customer OAuth accounts are intentionally separate."}
            </p>
          </div>

          <AdminAuthForm mode={mode} />
        </section>

        <p className="mt-5 text-center text-sm text-slate-600">
          {isRegister ? "Already registered?" : "Need admin access?"}{" "}
          <Link
            href={isRegister ? "/admin/login" : "/admin/register"}
            className="font-semibold text-sky-700 underline-offset-4 hover:underline"
          >
            {isRegister ? "Sign in" : "Register"}
          </Link>
        </p>
      </div>
    </main>
  );
}
