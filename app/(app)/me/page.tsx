import Image from "next/image";
import Link from "next/link";
import type { ComponentType } from "react";
import {
  Activity,
  ArrowRight,
  FileText,
  Link2,
  MessageSquareQuote,
  QrCode,
  ScanLine,
  UserRound,
} from "lucide-react";
import { auth } from "@/auth";
import { OAuthSignInPanel } from "@/components/auth/OAuthSignInPanel";
import { PageShell } from "@/components/PageShell";
import { Alert, Badge } from "@/components/ui";
import { sanitizeReturnTo } from "@/lib/redirects";
import { prisma } from "@/server/db/prisma";
import { QR_CODE_MODE } from "@/server/qr/constants";
import { getDefaultWorkspaceForUser } from "@/server/workspaces/repository";

interface AccountKpi {
  readonly label: string;
  readonly value: string;
  readonly href: string;
  readonly icon: ComponentType<{ className?: string }>;
  readonly description: string;
}

interface MePageProps {
  readonly searchParams?: Promise<{
    readonly intent?: string | string[];
    readonly returnTo?: string | string[];
  }>;
}

export default async function MePage({ searchParams }: MePageProps) {
  const params = await searchParams;
  const authIntent = params?.intent === "signup" ? "signup" : "login";
  const returnToParam = Array.isArray(params?.returnTo)
    ? params.returnTo[0]
    : params?.returnTo;
  const callbackUrl = sanitizeReturnTo(returnToParam, "/me");
  const session = await getSafeSession();

  if (!session?.user?.id) {
    return (
      <PageShell
        eyebrow="Me"
        title={
          authIntent === "signup"
            ? "Create your Decode account"
            : "Log in to Decode"
        }
        description={
          authIntent === "signup"
            ? "Create an account with OAuth to save QR codes, landing pages, and workspace data."
            : "Log in with your OAuth account to return to your Decode workspace."
        }
      >
        <OAuthSignInPanel
          callbackUrl={callbackUrl}
          title={
            authIntent === "signup"
              ? "Sign up with OAuth"
              : "Log in with OAuth"
          }
          description={
            authIntent === "signup"
              ? "Use Google or GitHub to create your Decode workspace."
              : "Use the provider linked to your Decode account."
          }
        />
        <section className="grid gap-4 md:grid-cols-3">
          {[
            "Saved QR codes and dynamic destinations",
            "Landing pages and media-linked campaigns",
            "Account-linked reviews and workspace analytics",
          ].map((item) => (
            <article
              key={item}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <h2 className="text-base font-semibold text-slate-950">
                {item}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Available after explicit OAuth sign-in and workspace creation.
              </p>
            </article>
          ))}
        </section>
      </PageShell>
    );
  }

  const data = await getAccountData(session.user.id);
  const displayName = data.user.name ?? data.user.email ?? "Decode user";
  const kpis = getAccountKpis(data);

  return (
    <PageShell
      eyebrow="Me"
      title="Your Decode account"
      description="Review your account identity, default workspace, and page-linked product KPIs."
      actions={
        <Link
          href="/generate"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-sky-700 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-sky-700/20 transition-colors hover:bg-sky-800"
        >
          Create QR
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      }
    >
      <section className="grid gap-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            {data.user.image ? (
              <Image
                src={data.user.image}
                alt={`${displayName} avatar`}
                width={72}
                height={72}
                className="h-[72px] w-[72px] rounded-2xl border border-slate-200 object-cover"
              />
            ) : (
              <span className="inline-flex h-[72px] w-[72px] items-center justify-center rounded-2xl border border-slate-200 bg-sky-50 text-sky-700">
                <UserRound className="h-8 w-8" aria-hidden="true" />
              </span>
            )}
            <div className="min-w-0">
              <Badge variant="success">Signed in</Badge>
              <h2 className="mt-3 truncate text-xl font-semibold text-slate-950">
                {displayName}
              </h2>
              {data.user.email && (
                <p className="mt-1 break-words text-sm text-slate-600">
                  {data.user.email}
                </p>
              )}
            </div>
          </div>
          <dl className="mt-6 grid gap-3 text-sm">
            <div className="rounded-lg bg-slate-50 p-4">
              <dt className="font-medium text-slate-600">Default workspace</dt>
              <dd className="mt-1 font-semibold text-slate-950">
                {data.workspace?.name ?? "No workspace yet"}
              </dd>
            </div>
            <div className="rounded-lg bg-slate-50 p-4">
              <dt className="font-medium text-slate-600">Account created</dt>
              <dd className="mt-1 font-semibold text-slate-950">
                {formatDate(data.user.createdAt)}
              </dd>
            </div>
          </dl>
        </article>

        <section className="space-y-4">
          {!data.workspace && (
            <Alert variant="warning" title="Workspace not found">
              Your account exists, but a default workspace was not found. Sign
              out and sign in again, or contact support with your account email.
            </Alert>
          )}
          <div className="grid grid-cols-2 gap-3">
            {kpis.map((item) => (
              <AccountKpiCard key={item.label} item={item} />
            ))}
          </div>
        </section>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-950">
          OAuth account behavior
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Decode cannot silently create an account from a visitor email. OAuth
          providers only share identity data after the user explicitly approves
          sign-in. Once approved, Decode persists the user and links workspace
          data through the database.
        </p>
      </section>
    </PageShell>
  );
}

async function getSafeSession() {
  try {
    return await auth();
  } catch {
    return null;
  }
}

async function getAccountData(userId: string) {
  const [user, workspace, authoredReviews] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        createdAt: true,
      },
    }),
    getDefaultWorkspaceForUser({ userId }),
    prisma.review.count({
      where: { userId, deletedAt: null, status: "published" },
    }),
  ]);
  const workspaceId = workspace?.id;

  if (!workspaceId) {
    return {
      user,
      workspace,
      counts: {
        qrCodes: 0,
        dynamicQRCodes: 0,
        landingPages: 0,
        scanEvents: 0,
        authoredReviews,
      },
    };
  }

  const [qrCodes, dynamicQRCodes, landingPages, scanEvents] =
    await Promise.all([
      prisma.qRCode.count({ where: { workspaceId, deletedAt: null } }),
      prisma.qRCode.count({
        where: {
          workspaceId,
          mode: QR_CODE_MODE.DYNAMIC,
          deletedAt: null,
        },
      }),
      prisma.landingPage.count({ where: { workspaceId, deletedAt: null } }),
      prisma.scanEvent.count({ where: { workspaceId } }),
    ]);

  return {
    user,
    workspace,
    counts: {
      qrCodes,
      dynamicQRCodes,
      landingPages,
      scanEvents,
      authoredReviews,
    },
  };
}

function AccountKpiCard({ item }: { readonly item: AccountKpi }) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className="group rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition-colors hover:border-sky-300 hover:bg-sky-50 sm:p-4"
    >
      <span className="flex items-start justify-between gap-2">
        <span className="min-w-0 break-words text-xs font-medium leading-5 text-slate-600 sm:text-sm">
          {item.label}
        </span>
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-700 transition-colors group-hover:bg-white sm:h-10 sm:w-10">
          <Icon className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
        </span>
      </span>
      <span className="mt-3 block break-words text-xl font-semibold text-slate-950 sm:mt-4 sm:text-2xl">
        {item.value}
      </span>
      <span className="mt-2 flex items-center gap-1 text-xs font-medium text-sky-700 sm:text-sm">
        {item.description}
        <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden="true" />
      </span>
    </Link>
  );
}

function getAccountKpis(data: Awaited<ReturnType<typeof getAccountData>>) {
  return [
    {
      label: "Saved QR codes",
      value: data.counts.qrCodes.toLocaleString(),
      href: "/dashboard",
      icon: QrCode,
      description: "Open dashboard",
    },
    {
      label: "Dynamic codes",
      value: data.counts.dynamicQRCodes.toLocaleString(),
      href: "/generate",
      icon: Activity,
      description: "Create dynamic QR",
    },
    {
      label: "Landing pages",
      value: data.counts.landingPages.toLocaleString(),
      href: "/landing-pages",
      icon: FileText,
      description: "Open pages",
    },
    {
      label: "Scan events",
      value: data.counts.scanEvents.toLocaleString(),
      href: "/scan",
      icon: ScanLine,
      description: "Scan QR",
    },
    {
      label: "Reviews",
      value: data.counts.authoredReviews.toLocaleString(),
      href: "/review",
      icon: MessageSquareQuote,
      description: "Open reviews",
    },
    {
      label: "Links",
      value: "Soon",
      href: "/links",
      icon: Link2,
      description: "View status",
    },
  ] satisfies readonly AccountKpi[];
}

function formatDate(value: Date): string {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(value);
}
