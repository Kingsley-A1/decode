import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Code2,
  Database,
  FileText,
  KeyRound,
  LockKeyhole,
  QrCode,
  ShieldCheck,
  TerminalSquare,
} from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { Badge } from "@/components/ui";
import {
  ApiCodePanel,
  type ApiCodeVariant,
  type ApiRunRequest,
} from "./ApiCodePanel";

export const metadata: Metadata = {
  title: "API Documentation | Decode",
  description:
    "Decode API documentation for QR codes, dynamic redirects, landing pages, uploads, link verification, scan decoding, reviews, and admin integrations.",
};

interface EndpointDoc {
  readonly method: string;
  readonly path: string;
  readonly auth: "Public" | "User session" | "Admin session" | "NextAuth";
  readonly purpose: string;
  readonly notes: string;
}

interface EndpointGroup {
  readonly title: string;
  readonly description: string;
  readonly icon: typeof QrCode;
  readonly endpoints: readonly EndpointDoc[];
}

interface ExampleDoc {
  readonly title: string;
  readonly description: string;
  readonly code: string;
  readonly language?: string;
  readonly variants?: readonly ApiCodeVariant[];
  readonly runRequest?: ApiRunRequest;
}

interface DocNavItem {
  readonly href: string;
  readonly label: string;
}

const responseShape = `{
  "ok": true,
  "data": {},
  "requestId": "req_..."
}

{
  "ok": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed.",
    "fields": {
      "content.url": ["Enter a valid URL."]
    }
  },
  "requestId": "req_..."
}`;

const integrationRules = [
  "Send JSON requests with Content-Type: application/json unless the endpoint explicitly accepts multipart image data.",
  "Forward x-request-id from your own system when you need cross-system tracing. Decode will echo it back as requestId and x-request-id.",
  "Browser workspace APIs use the signed-in Decode session cookie. Third-party server jobs should integrate through a signed-in operator workflow until API keys are introduced.",
  "Public utility APIs can be called from other apps, but production callers should debounce user input and handle validation errors.",
  "Dynamic QR codes encode a Decode redirect URL. The redirect endpoint resolves the latest destination or published landing page.",
  "Admin APIs are for the Decode back office only. Do not expose admin session cookies to client-side third-party code.",
  "Use https://decode.com.ng as the production base URL. Treat localhost and preview URLs as development-only integration targets.",
] as const;

const docNavItems: readonly DocNavItem[] = [
  { href: "#overview", label: "Overview" },
  { href: "#response-shape", label: "Response shape" },
  { href: "#endpoint-reference", label: "Endpoints" },
  { href: "#examples", label: "Examples" },
  { href: "#access-model", label: "Access model" },
] as const;

const staticQrRequestBody = {
  mode: "static",
  save: false,
  type: "url",
  title: "Partner site",
  content: { url: "https://partner.example/catalog" },
  design: {
    foregroundColor: "#0F172A",
    backgroundColor: "#FFFFFF",
    frameColor: "#2563EB",
    frameStyle: "classic",
  },
};

const verifyLinkRequestBody = {
  url: "https://example.com/promo",
  skipProbe: true,
};

const dynamicQrRequestBody = {
  mode: "dynamic",
  save: true,
  type: "url",
  title: "Campaign landing page",
  content: { url: "https://partner.example/campaign" },
  design: {
    foregroundColor: "#0F172A",
    backgroundColor: "#FFFFFF",
    frameColor: "#2563EB",
    frameStyle: "scan-me",
  },
};

const renderQrRequestBody = { format: "png" };

const presignRequestBody = {
  purpose: "landing_page_media",
  contentType: "image/webp",
  fileSizeBytes: 148000,
};

const staticQrVariants = createJsonRequestVariants({
  path: "/api/qr-codes",
  method: "POST",
  body: staticQrRequestBody,
});

const verifyLinkVariants = createJsonRequestVariants({
  path: "/api/links/verify",
  method: "POST",
  body: verifyLinkRequestBody,
  headers: { "x-request-id": "partner-check-001" },
});

const dynamicQrVariants = createJsonRequestVariants({
  path: "/api/qr-codes",
  method: "POST",
  body: dynamicQrRequestBody,
  credentials: true,
});

const renderQrVariants = createJsonRequestVariants({
  path: "/api/qr-codes/qr_123/render",
  method: "POST",
  body: renderQrRequestBody,
  credentials: true,
});

const uploadMediaVariants = createJsonRequestVariants({
  path: "/api/assets/presign",
  method: "POST",
  body: presignRequestBody,
  credentials: true,
  followUpCode: {
    js: 'await fetch("/api/assets/asset_123/confirm", { method: "POST", credentials: "include" });',
    ts: 'await fetch("/api/assets/asset_123/confirm", { method: "POST", credentials: "include" });',
    py: 'requests.post("https://decode.com.ng/api/assets/asset_123/confirm", timeout=15)',
  },
});

const scanImageVariants: readonly ApiCodeVariant[] = [
  {
    id: "js",
    label: "JS",
    language: "javascript",
    code: `const formData = new FormData();
formData.append("file", fileInput.files[0]);

const response = await fetch("https://decode.com.ng/api/scans/image", {
  method: "POST",
  body: formData
});

const result = await response.json();
console.log(result);`,
  },
  {
    id: "ts",
    label: "TS",
    language: "typescript",
    code: `type DecodeApiResponse<T> = {
  ok: boolean;
  data?: T;
  error?: { message: string };
  requestId?: string;
};

const file = fileInput.files?.[0];
if (!file) throw new Error("Choose an image first.");

const formData = new FormData();
formData.append("file", file);

const response = await fetch("https://decode.com.ng/api/scans/image", {
  method: "POST",
  body: formData
});

const result = (await response.json()) as DecodeApiResponse<unknown>;
console.log(result);`,
  },
  {
    id: "py",
    label: "PY",
    language: "python",
    code: `import requests

with open("qr-screenshot.png", "rb") as image:
    response = requests.post(
        "https://decode.com.ng/api/scans/image",
        files={"file": image},
        timeout=15,
    )

print(response.status_code)
print(response.json())`,
  },
];

const endpointGroups: readonly EndpointGroup[] = [
  {
    title: "QR codes and dynamic redirects",
    description:
      "Create static payloads, publish dynamic redirects, render saved exports, update destinations, archive codes, and read QR analytics.",
    icon: QrCode,
    endpoints: [
      {
        method: "GET",
        path: "/api/qr-codes",
        auth: "User session",
        purpose: "List saved QR codes for the current workspace.",
        notes: "Supports workspaceId, take, and cursor query parameters.",
      },
      {
        method: "POST",
        path: "/api/qr-codes",
        auth: "Public",
        purpose: "Create a QR payload. If save=true, a user session is required.",
        notes:
          "Dynamic QR creation returns the server assigned payload.value and redirect URL. Export dynamic codes only after publish succeeds.",
      },
      {
        method: "GET",
        path: "/api/qr-codes/{id}",
        auth: "User session",
        purpose: "Read a saved QR code detail record and QR-specific analytics.",
        notes: "Returns qrCode plus scan trend, device, referrer, and recent scan summaries.",
      },
      {
        method: "PATCH",
        path: "/api/qr-codes/{id}",
        auth: "User session",
        purpose: "Update a dynamic QR destination URL.",
        notes: "Static and archived QR codes reject destination changes.",
      },
      {
        method: "GET",
        path: "/api/qr-codes/{id}/analytics",
        auth: "User session",
        purpose: "Read analytics for a single saved QR code.",
        notes: "Useful for dashboard widgets or lightweight refreshes.",
      },
      {
        method: "POST",
        path: "/api/qr-codes/{id}/archive",
        auth: "User session",
        purpose: "Archive a saved QR code and write an audit log.",
        notes: "Archived codes leave the active dashboard list.",
      },
      {
        method: "POST",
        path: "/api/qr-codes/{id}/render",
        auth: "User session",
        purpose: "Render a saved QR code export and return a signed download URL.",
        notes: "Used by dynamic QR download so client code never renders placeholders.",
      },
      {
        method: "GET",
        path: "/r/{slug}",
        auth: "Public",
        purpose: "Resolve a published dynamic QR code.",
        notes:
          "Returns a published landing page when attached, otherwise redirects to destinationUrl.",
      },
    ],
  },
  {
    title: "Link safety, scan, decode, and reviews",
    description:
      "Public utility APIs for URL evidence, QR image decoding, text transforms, and product reviews.",
    icon: ShieldCheck,
    endpoints: [
      {
        method: "POST",
        path: "/api/links/verify",
        auth: "Public",
        purpose: "Verify URL safety using heuristics, network probing, and optional Safe Browsing.",
        notes: "Pass skipProbe=true for optimistic UI checks that avoid external lookups.",
      },
      {
        method: "POST",
        path: "/api/scans/image",
        auth: "Public",
        purpose: "Decode a QR code from an uploaded image.",
        notes: "Use multipart/form-data with an image file field.",
      },
      {
        method: "POST",
        path: "/api/decode",
        auth: "Public",
        purpose: "Encode or decode supported text transformations.",
        notes: "Used by the Decode utility surface.",
      },
      {
        method: "GET",
        path: "/api/reviews",
        auth: "Public",
        purpose: "List approved product reviews.",
        notes: "Supports review surfaces without exposing admin moderation tools.",
      },
      {
        method: "POST",
        path: "/api/reviews",
        auth: "Public",
        purpose: "Submit a product review for moderation.",
        notes: "Validates public fields before queuing review data.",
      },
    ],
  },
  {
    title: "Landing pages and assets",
    description:
      "Build and publish mobile landing pages, select templates, and upload media through presigned asset workflows.",
    icon: FileText,
    endpoints: [
      {
        method: "GET",
        path: "/api/landing-page-templates",
        auth: "Public",
        purpose: "List available user-facing landing page templates.",
        notes: "Use category and search query parameters for discovery.",
      },
      {
        method: "GET",
        path: "/api/landing-page-template-assets/{id}",
        auth: "Public",
        purpose: "Serve a template asset record.",
        notes: "Used by template previews and first-party media references.",
      },
      {
        method: "POST",
        path: "/api/landing-pages",
        auth: "User session",
        purpose: "Create a draft or published landing page attached to a dynamic QR.",
        notes: "Requires a dynamic QR code that can receive a landing page.",
      },
      {
        method: "GET",
        path: "/api/landing-pages/{id}",
        auth: "User session",
        purpose: "Read a landing page draft or published page for editing.",
        notes: "Workspace access checks apply.",
      },
      {
        method: "PATCH",
        path: "/api/landing-pages/{id}",
        auth: "User session",
        purpose: "Update landing page status, type, title, or content.",
        notes: "Archived landing pages cannot be edited.",
      },
      {
        method: "POST",
        path: "/api/assets/presign",
        auth: "User session",
        purpose: "Create a presigned upload target for R2-backed media.",
        notes: "Follow with a direct object upload, then confirm the asset.",
      },
      {
        method: "GET",
        path: "/api/assets/{id}",
        auth: "User session",
        purpose: "Read an asset record owned by the workspace.",
        notes: "Use for upload status and media metadata.",
      },
      {
        method: "DELETE",
        path: "/api/assets/{id}",
        auth: "User session",
        purpose: "Delete or mark an asset unavailable.",
        notes: "Workspace access checks apply.",
      },
      {
        method: "POST",
        path: "/api/assets/{id}/confirm",
        auth: "User session",
        purpose: "Confirm that a presigned upload finished successfully.",
        notes: "Finalizes file size, status, and storage metadata.",
      },
    ],
  },
  {
    title: "Workspace dashboard and authentication",
    description:
      "Session-bound endpoints for dashboard summaries, OAuth session handling, and account-level workspace data.",
    icon: Database,
    endpoints: [
      {
        method: "GET",
        path: "/api/dashboard/summary",
        auth: "User session",
        purpose: "Read workspace dashboard counts, QR rows, and scan summaries.",
        notes: "Returns real workspace data, not demo data.",
      },
      {
        method: "ANY",
        path: "/api/auth/[...nextauth]",
        auth: "NextAuth",
        purpose: "OAuth sign-in, callback, and session management.",
        notes: "Managed by NextAuth. Third-party integrations should not call this directly except through browser sign-in.",
      },
    ],
  },
  {
    title: "Admin console APIs",
    description:
      "Privileged back-office APIs for moderation, audit, template management, workspaces, and system views.",
    icon: LockKeyhole,
    endpoints: [
      {
        method: "POST",
        path: "/api/admin/auth/login",
        auth: "Public",
        purpose: "Create an admin session.",
        notes: "Requires valid admin credentials and applies admin auth controls.",
      },
      {
        method: "POST",
        path: "/api/admin/auth/logout",
        auth: "Admin session",
        purpose: "End the current admin session.",
        notes: "Clears the admin cookie.",
      },
      {
        method: "POST",
        path: "/api/admin/auth/register",
        auth: "Public",
        purpose: "Register an admin account when policy allows it.",
        notes:
          "Same-origin protected and requires the configured admin registration code.",
      },
      {
        method: "GET",
        path: "/api/admin/auth/session",
        auth: "Admin session",
        purpose: "Read the current admin session state.",
        notes: "Used by the admin shell.",
      },
      {
        method: "GET",
        path: "/api/admin/overview",
        auth: "Admin session",
        purpose: "Read admin dashboard totals and operating metrics.",
        notes: "Back-office only.",
      },
      {
        method: "GET",
        path: "/api/admin/audit",
        auth: "Admin session",
        purpose: "List audit log records.",
        notes: "Use for operational traceability.",
      },
      {
        method: "GET",
        path: "/api/admin/{resource}",
        auth: "Admin session",
        purpose: "Read generic admin resource tables.",
        notes: "Resource name selects the admin console dataset.",
      },
      {
        method: "PATCH",
        path: "/api/admin/admin-users/{id}",
        auth: "Admin session",
        purpose: "Update admin user state.",
        notes: "Used by admin user management.",
      },
      {
        method: "PATCH",
        path: "/api/admin/qr-codes/{id}",
        auth: "Admin session",
        purpose: "Moderate or update an admin-visible QR record.",
        notes: "Back-office state changes are audited.",
      },
      {
        method: "PATCH",
        path: "/api/admin/reviews/{id}",
        auth: "Admin session",
        purpose: "Moderate submitted reviews.",
        notes: "Controls public review visibility.",
      },
      {
        method: "GET, POST",
        path: "/api/admin/templates",
        auth: "Admin session",
        purpose: "List and create legacy/admin templates.",
        notes: "Template administration surface.",
      },
      {
        method: "GET, PATCH",
        path: "/api/admin/templates/{id}",
        auth: "Admin session",
        purpose: "Read or update a template.",
        notes: "Use publish/archive actions for lifecycle changes.",
      },
      {
        method: "POST",
        path: "/api/admin/templates/{id}/publish",
        auth: "Admin session",
        purpose: "Publish an admin template.",
        notes: "Moves a template to the public-ready state.",
      },
      {
        method: "POST",
        path: "/api/admin/templates/{id}/archive",
        auth: "Admin session",
        purpose: "Archive an admin template.",
        notes: "Removes it from normal selection paths.",
      },
      {
        method: "GET, POST",
        path: "/api/admin/landing-page-templates",
        auth: "Admin session",
        purpose: "List and create landing page templates.",
        notes: "Used by the landing page template console.",
      },
      {
        method: "GET, PATCH",
        path: "/api/admin/landing-page-templates/{id}",
        auth: "Admin session",
        purpose: "Read or update a landing page template.",
        notes: "Controls user-facing template content.",
      },
      {
        method: "POST",
        path: "/api/admin/landing-page-template-assets",
        auth: "Admin session",
        purpose: "Upload or register template assets.",
        notes: "Back-office asset ingestion.",
      },
      {
        method: "POST",
        path: "/api/admin/workspaces/{id}/review",
        auth: "Admin session",
        purpose: "Review workspace state.",
        notes: "Used by operational moderation.",
      },
    ],
  },
];

const examples: readonly ExampleDoc[] = [
  {
    title: "Create a static QR payload",
    description:
      "Static QR generation can be called without a user session when save is false. The response payload.value is the content to render or encode.",
    code: staticQrVariants[0].code,
    variants: staticQrVariants,
    runRequest: {
      method: "POST",
      url: "/api/qr-codes",
      headers: { "Content-Type": "application/json" },
      body: staticQrRequestBody,
    },
  },
  {
    title: "Verify a link from another app",
    description:
      "Use this before opening URLs that came from QR scans, contact forms, or user-generated content. Set skipProbe=false from trusted server jobs when network probing is allowed.",
    code: verifyLinkVariants[0].code,
    variants: verifyLinkVariants,
    runRequest: {
      method: "POST",
      url: "/api/links/verify",
      headers: {
        "Content-Type": "application/json",
        "x-request-id": "docs-link-check-001",
      },
      body: verifyLinkRequestBody,
    },
  },
  {
    title: "Create a dynamic QR code after browser sign-in",
    description:
      "Dynamic QR codes must be saved by an authenticated Decode user so the redirect can be managed later.",
    code: dynamicQrVariants[0].code,
    variants: dynamicQrVariants,
  },
  {
    title: "Render a saved dynamic QR export",
    description:
      "Use the render endpoint after publish. It produces a signed download URL for the saved payload.",
    code: renderQrVariants[0].code,
    variants: renderQrVariants,
  },
  {
    title: "Decode a QR image upload",
    description:
      "Use this endpoint when another product accepts QR screenshots or camera captures and needs the embedded value back.",
    code: scanImageVariants[0].code,
    variants: scanImageVariants,
  },
  {
    title: "Upload landing page media",
    description:
      "Ask Decode for an upload target, put the file into storage, then confirm the asset before attaching it to page content.",
    code: uploadMediaVariants[0].code,
    variants: uploadMediaVariants,
  },
];

export default function ApiDocsPage() {
  const endpointCount = endpointGroups.reduce(
    (total, group) => total + group.endpoints.length,
    0
  );

  return (
    <PageShell
      eyebrow="API"
      title="Decode API documentation"
      description="A compact integration reference for QR codes, redirects, landing pages, scans, link checks, reviews, and admin workflows."
      actions={
        <>
          <Badge variant="info">Base URL https://decode.com.ng</Badge>
          <Link
            href="/docs"
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm transition-colors hover:border-sky-300 hover:bg-sky-50 hover:text-sky-900"
          >
            Product docs
          </Link>
        </>
      }
    >
      <div className="grid min-w-0 gap-6 xl:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="hidden xl:block">
          <div className="sticky top-24 space-y-4">
            <nav
              aria-label="API documentation sections"
              className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
            >
              <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-normal text-slate-500">
                Reference
              </p>
              <div className="space-y-1">
                {docNavItems.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    className="block rounded-lg px-2 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-sky-50 hover:text-sky-800"
                  >
                    {item.label}
                  </a>
                ))}
              </div>
            </nav>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-normal text-slate-500">
                Production base URL
              </p>
              <code className="mt-2 block break-all rounded-lg bg-white px-3 py-2 text-xs font-semibold text-slate-800 ring-1 ring-slate-200">
                https://decode.com.ng
              </code>
            </div>
          </div>
        </aside>

        <div className="min-w-0 space-y-8">
          <section
            id="overview"
            className="grid scroll-mt-28 gap-4 lg:grid-cols-3"
            aria-label="API summary"
          >
            <SummaryTile
              icon={Code2}
              label="Response contract"
              value="ok, data, error, requestId"
            />
            <SummaryTile
              icon={KeyRound}
              label="Authentication"
              value="public, user session, admin session"
            />
            <SummaryTile
              icon={BadgeCheck}
              label="Documented endpoints"
              value={`${endpointCount} endpoints and actions`}
            />
          </section>

          <section
            id="response-shape"
            className="grid scroll-mt-28 gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]"
          >
            <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <TerminalSquare
                  className="h-5 w-5 text-sky-700"
                  aria-hidden="true"
                />
                <h2 className="text-xl font-semibold text-slate-950">
                  Standard response shape
                </h2>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Decode APIs use one JSON envelope so client code can handle
                success, validation, and server errors consistently.
              </p>
              <ApiCodePanel
                code={responseShape}
                label="JSON envelope"
                language="json"
              />
            </article>

            <article className="rounded-xl border border-slate-200 bg-slate-50 p-5">
              <h2 className="text-xl font-semibold text-slate-950">
                Integration rules
              </h2>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-700">
                {integrationRules.map((rule) => (
                  <li key={rule} className="flex gap-2">
                    <ShieldCheck
                      className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600"
                      aria-hidden="true"
                    />
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </article>
          </section>

          <section
            id="endpoint-reference"
            aria-labelledby="endpoint-reference-title"
            className="scroll-mt-28 space-y-5"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2
                  id="endpoint-reference-title"
                  className="text-2xl font-semibold text-slate-950"
                >
                  Endpoint reference
                </h2>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Routes are grouped by operating domain. User session routes are
                  intended for authenticated browser integrations inside Decode.
                </p>
              </div>
              <Badge variant="info">v1 internal API</Badge>
            </div>

            <div className="space-y-5">
              {endpointGroups.map((group) => (
                <EndpointSection key={group.title} group={group} />
              ))}
            </div>
          </section>

          <section
            id="examples"
            aria-labelledby="examples-title"
            className="scroll-mt-28 space-y-5"
          >
            <div>
              <h2
                id="examples-title"
                className="text-2xl font-semibold text-slate-950"
              >
                Integration examples
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Copy any request, or run safe public examples directly from this
                page. Session-bound write examples are shown for implementation
                shape and keep Run disabled.
              </p>
            </div>
            <div className="grid items-start gap-4 lg:grid-cols-2">
              {examples.map((example) => (
                <article
                  key={example.title}
                  className="self-start rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <h3 className="text-lg font-semibold text-slate-950">
                        {example.title}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {example.description}
                      </p>
                    </div>
                    <Badge variant={example.runRequest ? "success" : "neutral"}>
                      {example.runRequest ? "Runnable" : "Copy only"}
                    </Badge>
                  </div>
                  <ApiCodePanel
                    code={example.code}
                    label={example.title}
                    language={example.language}
                    variants={example.variants}
                    runRequest={example.runRequest}
                  />
                </article>
              ))}
            </div>
          </section>

          <section
            id="access-model"
            className="scroll-mt-28 rounded-xl border border-sky-200 bg-sky-50 p-5"
          >
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-950">
                  Need a partner API key flow?
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-700">
                  The current authenticated workspace API is session-first. For
                  server-to-server access, add scoped API keys, rate limits,
                  audit events, and per-workspace permissions before exposing
                  saved QR or asset write endpoints outside Decode.
                </p>
              </div>
              <Link
                href="/support"
                className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-sky-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-sky-800"
              >
                Discuss access
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </section>
        </div>
      </div>
    </PageShell>
  );
}

function createJsonRequestVariants({
  path,
  method,
  body,
  headers = {},
  credentials = false,
  followUpCode,
}: {
  readonly path: string;
  readonly method: string;
  readonly body?: unknown;
  readonly headers?: Record<string, string>;
  readonly credentials?: boolean;
  readonly followUpCode?: {
    readonly js?: string;
    readonly ts?: string;
    readonly py?: string;
  };
}): readonly ApiCodeVariant[] {
  const headersWithJson = { "Content-Type": "application/json", ...headers };
  const bodyJson = body === undefined ? "" : JSON.stringify(body, null, 2);
  const jsHeaders = JSON.stringify(headersWithJson, null, 2).replace(
    /\n/g,
    "\n  "
  );
  const pyHeaders = JSON.stringify(headersWithJson, null, 2);
  const fetchOptions = [
    `method: "${method}"`,
    `headers: ${jsHeaders}`,
    credentials ? `credentials: "include"` : undefined,
    body === undefined ? undefined : "body: JSON.stringify(payload)",
  ].filter(isPresent);
  const fetchOptionsText = fetchOptions
    .map((line) => `  ${line}`)
    .join(",\n");

  return [
    {
      id: "js",
      label: "JS",
      language: "javascript",
      code: [
        body === undefined ? undefined : `const payload = ${bodyJson};`,
        `const response = await fetch("${path}", {\n${fetchOptionsText}\n});`,
        "const result = await response.json();",
        "console.log(result);",
        followUpCode?.js,
      ]
        .filter(isPresent)
        .join("\n\n"),
    },
    {
      id: "ts",
      label: "TS",
      language: "typescript",
      code: [
        `type DecodeApiResponse<T> = {\n  ok: boolean;\n  data?: T;\n  error?: { message: string };\n  requestId?: string;\n};`,
        body === undefined
          ? undefined
          : `const payload = ${bodyJson} satisfies Record<string, unknown>;`,
        `const response = await fetch("${path}", {\n${fetchOptionsText}\n});`,
        "const result = (await response.json()) as DecodeApiResponse<unknown>;",
        "console.log(result);",
        followUpCode?.ts,
      ]
        .filter(isPresent)
        .join("\n\n"),
    },
    {
      id: "py",
      label: "PY",
      language: "python",
      code: [
        "import json",
        "import requests",
        body === undefined ? undefined : `payload = json.loads('''${bodyJson}''')`,
        `response = requests.request(\n    "${method}",\n    "https://decode.com.ng${path}",\n    headers=${pyHeaders},${body === undefined ? "" : "\n    json=payload,"}\n    timeout=15,\n)`,
        "print(response.status_code)",
        "print(response.json())",
        followUpCode?.py,
      ]
        .filter(isPresent)
        .join("\n\n"),
    },
  ];
}

function isPresent(value: string | undefined): value is string {
  return typeof value === "string" && value.length > 0;
}

function SummaryTile({
  icon: Icon,
  label,
  value,
}: {
  readonly icon: typeof Code2;
  readonly label: string;
  readonly value: string;
}) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <span className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-sky-50 text-sky-700">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <p className="mt-4 text-sm font-semibold uppercase tracking-normal text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-lg font-semibold text-slate-950">{value}</p>
    </article>
  );
}

function EndpointSection({ group }: { readonly group: EndpointGroup }) {
  const Icon = group.icon;

  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 gap-3">
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-700">
              <Icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h3 className="text-xl font-semibold text-slate-950">
                {group.title}
              </h3>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                {group.description}
              </p>
            </div>
          </div>
          <Badge variant="neutral">{group.endpoints.length} routes</Badge>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] border-collapse text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-normal text-slate-500">
            <tr>
              <th scope="col" className="px-5 py-3 font-semibold">
                Method
              </th>
              <th scope="col" className="px-5 py-3 font-semibold">
                Path
              </th>
              <th scope="col" className="px-5 py-3 font-semibold">
                Auth
              </th>
              <th scope="col" className="px-5 py-3 font-semibold">
                Purpose
              </th>
              <th scope="col" className="px-5 py-3 font-semibold">
                Notes
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {group.endpoints.map((endpoint) => (
              <tr
                key={`${endpoint.method}-${endpoint.path}`}
                className="transition-colors hover:bg-slate-50"
              >
                <td className="whitespace-nowrap px-5 py-4 align-top">
                  <span
                    className={`rounded-md border px-2 py-1 font-mono text-xs font-semibold ${getMethodBadgeClassName(
                      endpoint.method
                    )}`}
                  >
                    {endpoint.method}
                  </span>
                </td>
                <td className="px-5 py-4 align-top">
                  <code className="break-all rounded-md bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-800">
                    {endpoint.path}
                  </code>
                </td>
                <td className="whitespace-nowrap px-5 py-4 align-top text-slate-700">
                  {endpoint.auth}
                </td>
                <td className="px-5 py-4 align-top text-slate-700">
                  {endpoint.purpose}
                </td>
                <td className="px-5 py-4 align-top text-slate-600">
                  {endpoint.notes}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function getMethodBadgeClassName(method: string): string {
  if (method.includes("POST")) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (method.includes("PATCH")) {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }

  if (method.includes("DELETE")) {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }

  return "border-sky-200 bg-sky-50 text-sky-700";
}
