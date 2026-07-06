"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  Archive,
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  Save,
  ShieldAlert,
} from "lucide-react";
import type { DashboardQRCode } from "@/components/dashboard/dashboard-data";
import {
  getApiErrorMessage,
  getModeLabel,
  getQRCodeDestinationLabel,
  getQRCodeHref,
  getStatusLabel,
  getTypeLabel,
  normalizeQRCode,
} from "@/components/dashboard/dashboard-utils";
import {
  Alert,
  Badge,
  Button,
  Dialog,
  EmptyState,
  Input,
  Skeleton,
  Textarea,
} from "@/components/ui";

// The contact-card fields editable in place. Labels mirror the generator's
// vCard form; the keys are the stored content keys the API expects.
const VCARD_FIELDS: readonly {
  readonly key: string;
  readonly label: string;
  readonly type?: string;
}[] = [
  { key: "firstName", label: "First name" },
  { key: "lastName", label: "Last name" },
  { key: "organization", label: "Organization" },
  { key: "title", label: "Title" },
  { key: "phone", label: "Phone", type: "tel" },
  { key: "email", label: "Email", type: "email" },
  { key: "website", label: "Website" },
  { key: "address", label: "Address" },
];

interface ApiResponse<TData> {
  readonly ok: boolean;
  readonly data?: TData;
  readonly error?: { readonly message: string };
}

interface QRCodeEditClientProps {
  readonly qrCodeId: string;
}

export function QRCodeEditClient({ qrCodeId }: QRCodeEditClientProps) {
  const [qrCode, setQRCode] = useState<DashboardQRCode | null>(null);
  const [destinationUrl, setDestinationUrl] = useState("");
  const [contentText, setContentText] = useState("");
  const [vcardFields, setVcardFields] = useState<Record<string, string>>({});
  const [isSavingContent, setIsSavingContent] = useState(false);
  const [contentStatus, setContentStatus] = useState<string | null>(null);
  const [contentError, setContentError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [isSavingTitle, setIsSavingTitle] = useState(false);
  const [titleStatus, setTitleStatus] = useState<string | null>(null);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);

  const loadQRCode = useCallback(async () => {
    setIsLoading(true);
    setNotice(null);

    try {
      const response = await fetchJson<ApiResponse<{ qrCode: unknown }>>(
        `/api/qr-codes/${encodeURIComponent(qrCodeId)}`
      );

      if (!response.ok) {
        throw new Error(response.error?.message ?? "Could not load QR code.");
      }

      const normalized = normalizeQRCode(response.data?.qrCode);
      if (!normalized) throw new Error("The QR code response was incomplete.");

      setQRCode(normalized);
      setDestinationUrl(normalized.destinationUrl ?? "");
      setTitle(normalized.title);
      const content = normalized.content ?? {};
      setContentText(readContentString(content, "text"));
      setVcardFields(
        Object.fromEntries(
          VCARD_FIELDS.map((field) => [
            field.key,
            readContentString(content, field.key),
          ])
        )
      );
    } catch (error) {
      setQRCode(null);
      setDestinationUrl("");
      setTitle("");
      setContentText("");
      setVcardFields({});
      setNotice(
        error instanceof Error
          ? error.message
          : "Could not load QR code."
      );
    } finally {
      setIsLoading(false);
    }
  }, [qrCodeId]);

  useEffect(() => {
    void loadQRCode();
  }, [loadQRCode]);

  const handleSave = async () => {
    if (!qrCode || qrCode.mode !== "dynamic") return;

    if (!isValidHttpUrl(destinationUrl)) {
      setSaveError("Enter a valid http or https destination URL.");
      return;
    }

    setIsSaving(true);
    setSaveStatus(null);
    setSaveError(null);

    try {
      const response = await fetchJson<ApiResponse<{ qrCode?: unknown }>>(
        `/api/qr-codes/${encodeURIComponent(qrCode.id)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ destinationUrl }),
        }
      );

      if (!response.ok) {
        throw new Error(response.error?.message ?? "Could not update destination.");
      }

      const normalized = normalizeQRCode(response.data?.qrCode);
      setQRCode((current) =>
        normalized ??
        (current
          ? {
              ...current,
              destinationUrl: normalizeHttpUrl(destinationUrl),
              updatedAt: new Date().toISOString(),
            }
          : current)
      );
      setSaveStatus("Dynamic destination updated.");
    } catch (error) {
      setSaveError(
        error instanceof Error
          ? error.message
          : "Could not update destination."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveContent = async () => {
    if (!qrCode || qrCode.mode !== "dynamic") return;

    const content = buildContentPayload(qrCode.type, contentText, vcardFields);
    if (!content) {
      setContentError(
        qrCode.type === "text"
          ? "Enter the text to encode."
          : "Enter a name or organization for the contact card."
      );
      return;
    }

    setIsSavingContent(true);
    setContentStatus(null);
    setContentError(null);

    try {
      const response = await fetchJson<ApiResponse<{ qrCode?: unknown }>>(
        `/api/qr-codes/${encodeURIComponent(qrCode.id)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content }),
        }
      );

      if (!response.ok) {
        throw new Error(response.error?.message ?? "Could not update content.");
      }

      const normalized = normalizeQRCode(response.data?.qrCode);
      if (normalized) setQRCode(normalized);
      setContentStatus("Hosted content updated. The printed QR is unchanged.");
    } catch (error) {
      setContentError(
        error instanceof Error ? error.message : "Could not update content."
      );
    } finally {
      setIsSavingContent(false);
    }
  };

  const handleVcardFieldChange = (key: string, value: string) => {
    setVcardFields((current) => ({ ...current, [key]: value }));
  };

  const handleSaveTitle = async () => {
    if (!qrCode) return;

    const trimmed = title.trim();
    if (!trimmed) {
      setTitleError("Enter a title.");
      return;
    }

    setIsSavingTitle(true);
    setTitleStatus(null);
    setTitleError(null);

    try {
      const response = await fetchJson<ApiResponse<{ qrCode?: unknown }>>(
        `/api/qr-codes/${encodeURIComponent(qrCode.id)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: trimmed }),
        }
      );

      if (!response.ok) {
        throw new Error(response.error?.message ?? "Could not update title.");
      }

      const normalized = normalizeQRCode(response.data?.qrCode);
      if (normalized) {
        setQRCode(normalized);
        setTitle(normalized.title);
      }
      setTitleStatus("Title updated.");
    } catch (error) {
      setTitleError(
        error instanceof Error ? error.message : "Could not update title."
      );
    } finally {
      setIsSavingTitle(false);
    }
  };

  const confirmArchive = async () => {
    if (!qrCode) return;

    setIsArchiving(true);
    setNotice(null);

    try {
      const response = await fetchJson<ApiResponse<{ qrCode?: unknown }>>(
        `/api/qr-codes/${encodeURIComponent(qrCode.id)}/archive`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        }
      );

      if (!response.ok) {
        throw new Error(response.error?.message ?? "Could not archive QR code.");
      }

      const normalized = normalizeQRCode(response.data?.qrCode);
      if (normalized) setQRCode(normalized);
      setShowArchiveDialog(false);
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : "Could not archive QR code."
      );
    } finally {
      setIsArchiving(false);
    }
  };

  if (isLoading) {
    return <EditSkeleton />;
  }

  if (!qrCode) {
    return (
      <EmptyState
        title="QR code not found"
        description={notice ?? "No matching saved QR code could be loaded."}
        icon={<ShieldAlert className="h-6 w-6" aria-hidden="true" />}
        action={
          <Link
            href="/dashboard"
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-sky-700 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-sky-700/20 transition-colors hover:bg-sky-800"
          >
            Back to dashboard
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Link
          href={getQRCodeHref(qrCode)}
          className="inline-flex min-h-11 w-fit items-center gap-2 rounded-lg px-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-950"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          QR detail
        </Link>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/dashboard"
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition-colors hover:border-sky-300 hover:bg-sky-50 hover:text-sky-900"
          >
            Dashboard
          </Link>
          <Button
            variant="danger"
            onClick={() => setShowArchiveDialog(true)}
            isLoading={isArchiving}
            leftIcon={<Archive className="h-4 w-4" aria-hidden="true" />}
          >
            Archive
          </Button>
        </div>
      </div>

      {notice && (
        <Alert variant="warning" title="QR edit notice">
          {notice}
        </Alert>
      )}

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={qrCode.mode === "dynamic" ? "info" : "neutral"}>
            {getModeLabel(qrCode.mode)}
          </Badge>
          <Badge variant={qrCode.status === "published" ? "success" : "warning"}>
            {getStatusLabel(qrCode.status)}
          </Badge>
          <Badge variant="neutral">{getTypeLabel(qrCode.type)}</Badge>
        </div>
        <h2 className="mt-4 text-2xl font-semibold tracking-normal text-slate-950">
          {qrCode.title}
        </h2>
        <p className="mt-2 break-all text-sm leading-6 text-slate-600">
          {getQRCodeDestinationLabel(qrCode)}
        </p>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-slate-950">Details</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Rename this QR code. The encoded content is not affected.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
          <Input
            label="Title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="QR code title"
          />
          <Button
            variant="primary"
            onClick={handleSaveTitle}
            isLoading={isSavingTitle}
            disabled={!title.trim() || title.trim() === qrCode.title}
            leftIcon={<Save className="h-4 w-4" aria-hidden="true" />}
          >
            Save title
          </Button>
        </div>
        {titleStatus && (
          <Alert className="mt-4" variant="success">
            {titleStatus}
          </Alert>
        )}
        {titleError && (
          <Alert className="mt-4" variant="danger">
            {titleError}
          </Alert>
        )}
      </section>

      {qrCode.mode === "dynamic" && qrCode.type === "url" && (
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-slate-950">
              Edit dynamic destination
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              The printed QR keeps the same slug while the redirect destination
              changes behind it.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
            <div className="space-y-4">
              <Input
                label="Destination URL"
                value={destinationUrl}
                onChange={(event) => setDestinationUrl(event.target.value)}
                placeholder="https://example.com/new-destination"
                error={
                  destinationUrl && !isValidHttpUrl(destinationUrl)
                    ? "Enter a valid http or https URL."
                    : undefined
                }
                hint="Visitors will be sent here after scanning the dynamic QR."
              />
              <Input
                label="Public slug"
                value={qrCode.slug ?? ""}
                disabled
                rightSlot={<ExternalLink className="h-4 w-4 text-slate-400" aria-hidden="true" />}
                hint="The slug remains stable so printed codes keep working."
              />
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-950">
                Change checklist
              </p>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
                <li className="flex gap-2">
                  <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
                  Destination uses http or https.
                </li>
                <li className="flex gap-2">
                  <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
                  Slug remains unchanged.
                </li>
                <li className="flex gap-2">
                  <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
                  Printed QR does not need replacement.
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-600" aria-live="polite">
              {saveStatus || saveError || "Ready to update the redirect destination."}
            </p>
            <Button
              variant="primary"
              onClick={handleSave}
              isLoading={isSaving}
              disabled={!destinationUrl || !isValidHttpUrl(destinationUrl)}
              leftIcon={<Save className="h-4 w-4" aria-hidden="true" />}
            >
              Save destination
            </Button>
          </div>
          {saveStatus && <Alert className="mt-4" variant="success">{saveStatus}</Alert>}
          {saveError && <Alert className="mt-4" variant="danger">{saveError}</Alert>}
        </section>
      )}

      {qrCode.mode === "dynamic" && qrCode.type === "text" && (
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-slate-950">
              Edit hosted text
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              The printed QR keeps the same slug while the text it shows changes
              behind it.
            </p>
          </div>
          <Textarea
            label="Text"
            value={contentText}
            onChange={(event) => setContentText(event.target.value)}
            placeholder="Text to encode"
          />
          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-600" aria-live="polite">
              {contentStatus || contentError || "Ready to update the hosted text."}
            </p>
            <Button
              variant="primary"
              onClick={handleSaveContent}
              isLoading={isSavingContent}
              disabled={!contentText.trim()}
              leftIcon={<Save className="h-4 w-4" aria-hidden="true" />}
            >
              Save text
            </Button>
          </div>
          {contentStatus && <Alert className="mt-4" variant="success">{contentStatus}</Alert>}
          {contentError && <Alert className="mt-4" variant="danger">{contentError}</Alert>}
        </section>
      )}

      {qrCode.mode === "dynamic" && qrCode.type === "vcard" && (
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-slate-950">
              Edit contact card
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              The printed QR keeps the same slug while the contact details change
              behind it.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {VCARD_FIELDS.map((field) => (
              <Input
                key={field.key}
                label={field.label}
                type={field.type}
                value={vcardFields[field.key] ?? ""}
                onChange={(event) =>
                  handleVcardFieldChange(field.key, event.target.value)
                }
                containerClassName={
                  field.key === "address" ? "md:col-span-2" : undefined
                }
              />
            ))}
          </div>
          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-600" aria-live="polite">
              {contentStatus || contentError || "Ready to update the contact card."}
            </p>
            <Button
              variant="primary"
              onClick={handleSaveContent}
              isLoading={isSavingContent}
              leftIcon={<Save className="h-4 w-4" aria-hidden="true" />}
            >
              Save contact
            </Button>
          </div>
          {contentStatus && <Alert className="mt-4" variant="success">{contentStatus}</Alert>}
          {contentError && <Alert className="mt-4" variant="danger">{contentError}</Alert>}
        </section>
      )}

      {qrCode.mode === "dynamic" &&
        (qrCode.type === "file" || qrCode.type === "landing_page") && (
          <Alert variant="info" title="Managed outside this editor">
            {qrCode.type === "file"
              ? "File QR codes serve their uploaded file behind the redirect. Replace the file from the QR file flow; the slug and printed code stay the same."
              : "Landing-page QR codes render your published landing page behind the redirect. Edit it in the landing page builder; the slug and printed code stay the same."}
          </Alert>
        )}

      {qrCode.mode !== "dynamic" && (
        <Alert variant="warning" title="Static QR content is locked">
          Static QR codes encode their final content directly. The safe workflow
          is to create a new QR code when the URL, Wi-Fi network, or vCard data
          needs to change.
        </Alert>
      )}

      <Dialog
        open={showArchiveDialog}
        title="Archive QR code?"
        description="Destructive workspace actions require confirmation."
        onClose={() => setShowArchiveDialog(false)}
      >
        <div className="space-y-4">
          <p className="text-sm leading-6 text-slate-600">
            Archive &quot;{qrCode.title}&quot;? This removes it from active dashboard
            operations.
          </p>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={() => setShowArchiveDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={confirmArchive}
              isLoading={isArchiving}
              leftIcon={<Archive className="h-4 w-4" aria-hidden="true" />}
            >
              Archive QR
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

function EditSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-12 w-40" />
      <Skeleton className="h-44 w-full" />
      <Skeleton className="h-80 w-full" />
    </div>
  );
}

async function fetchJson<TData>(
  url: string,
  init?: RequestInit
): Promise<TData> {
  const response = await fetch(url, {
    headers: { Accept: "application/json", ...(init?.headers ?? {}) },
    ...init,
  });
  const data = (await response.json().catch(() => null)) as unknown;

  if (!response.ok) {
    throw new Error(getApiErrorMessage(data, `Request failed with ${response.status}.`));
  }

  return data as TData;
}

function normalizeHttpUrl(value: string): string {
  const trimmedValue = value.trim();
  const hasScheme = /^[a-z][a-z0-9+.-]*:/i.test(trimmedValue);
  const candidate = hasScheme ? trimmedValue : `https://${trimmedValue}`;
  const url = new URL(candidate);

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Unsupported URL protocol.");
  }

  return url.toString();
}

function isValidHttpUrl(value: string): boolean {
  try {
    normalizeHttpUrl(value);
    return true;
  } catch {
    return false;
  }
}

function readContentString(
  content: Record<string, unknown>,
  key: string
): string {
  const value = content[key];

  return typeof value === "string" ? value : "";
}

/**
 * Builds the content payload for a PATCH content edit, or null when the input
 * is empty for that type. Only the type's own fields are sent, and blank
 * optional fields are dropped so they clear from the stored content.
 */
function buildContentPayload(
  type: string,
  text: string,
  vcard: Record<string, string>
): Record<string, string> | null {
  if (type === "text") {
    const trimmed = text.trim();

    return trimmed ? { text: trimmed } : null;
  }

  if (type === "vcard") {
    const entries = VCARD_FIELDS.map((field) => [
      field.key,
      (vcard[field.key] ?? "").trim(),
    ]).filter(([, value]) => value);
    const content = Object.fromEntries(entries);
    const hasName = content.firstName || content.lastName || content.organization;

    return hasName ? content : null;
  }

  return null;
}
