"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Archive,
  CheckCircle2,
  ExternalLink,
  FileJson,
  ImagePlus,
  Monitor,
  Plus,
  Rocket,
  RotateCcw,
  Save,
  Search,
  Smartphone,
} from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { LandingPagePreview } from "@/components/landing-pages/LandingPagePreview";
import { initialLandingPageContent } from "@/components/landing-pages/landing-page-data";
import type {
  LandingPageContent,
  LandingPageType,
} from "@/components/landing-pages/landing-page-types";
import type { LandingPageTemplateAssetRequirement } from "@/components/landing-pages/landing-page-template-types";
import {
  Alert,
  Badge,
  Button,
  Dialog,
  FileUpload,
  Input,
  Select,
  Textarea,
} from "@/components/ui";
import { cn } from "@/lib/utils";

type TemplateStatus = "draft" | "published" | "archived";
type TemplateSource = "admin" | "first_party";
type TemplateCategory =
  | "personal"
  | "business"
  | "restaurant"
  | "hotel"
  | "school"
  | "event"
  | "retail"
  | "healthcare"
  | "real_estate"
  | "institution"
  | "media"
  | "documents"
  | "feedback";
type TemplateType =
  | "profile"
  | "business"
  | "links"
  | "menu"
  | "coupon"
  | "event"
  | "feedback"
  | "pdf"
  | "images"
  | "video_link"
  | "audio_link";
type TemplateAssetKind = "image" | "pdf" | "audio";
type TemplateAssetSlot =
  | "avatar"
  | "logo"
  | "hero"
  | "gallery"
  | "pdf"
  | "audio"
  | "document";
type TemplateTone = "sky" | "emerald" | "amber" | "rose" | "indigo" | "slate";

export interface AdminTemplateConsoleRow {
  readonly id: string;
  readonly key: string;
  readonly label: string;
  readonly category: string;
  readonly industry: string;
  readonly type: string;
  readonly status: string;
  readonly source: string;
  readonly usageCount: number;
  readonly assetCount: number;
  readonly landingPageCount: number;
  readonly updatedAt: string;
}

export interface AdminTemplateConsoleDetail {
  readonly id: string;
  readonly key: string;
  readonly type: TemplateType;
  readonly label: string;
  readonly description: string;
  readonly category: TemplateCategory;
  readonly industry: string;
  readonly status: TemplateStatus;
  readonly source: TemplateSource;
  readonly sortPriority: number;
  readonly flags: readonly string[];
  readonly tags: readonly string[];
  readonly recommendedFor: string;
  readonly requiredFields: readonly string[];
  readonly optionalFields: readonly string[];
  readonly defaultTitle: string;
  readonly defaultContent: Record<string, unknown>;
  readonly assetRequirements: readonly TemplateAssetRequirement[];
  readonly thumbnail: {
    readonly label: string;
    readonly alt: string;
    readonly assetPath?: string;
    readonly tone: TemplateTone;
  };
  readonly mobilePreview: {
    readonly alt: string;
    readonly assetPath?: string;
    readonly width: 390;
    readonly height: 844;
  };
  readonly accessibilityNotes: string;
  readonly usageCount: number;
  readonly lastUsedAt: string | null;
  readonly publishedAt: string | null;
  readonly archivedAt: string | null;
  readonly updatedAt: string;
}

interface TemplateAssetRequirement {
  readonly uploadedAssetId?: string;
  readonly slot: TemplateAssetSlot;
  readonly label: string;
  readonly kind: TemplateAssetKind;
  readonly required: boolean;
  readonly assetPath?: string;
  readonly alt?: string;
  readonly width?: number;
  readonly height?: number;
}

interface AdminTemplateConsoleProps {
  readonly rows: readonly AdminTemplateConsoleRow[];
  readonly total: number;
  readonly nextCursor: string | null;
  readonly backendUnavailable?: boolean;
  readonly query: {
    readonly q?: string;
    readonly status?: string;
  };
  readonly mode: "list" | "create" | "edit";
  readonly selectedTemplate?: AdminTemplateConsoleDetail;
}

interface TemplateFormState {
  readonly id?: string;
  readonly key: string;
  readonly type: TemplateType;
  readonly label: string;
  readonly description: string;
  readonly category: TemplateCategory;
  readonly industry: string;
  readonly status: TemplateStatus;
  readonly source: TemplateSource;
  readonly sortPriority: string;
  readonly flagsText: string;
  readonly tagsText: string;
  readonly recommendedFor: string;
  readonly requiredFieldsText: string;
  readonly optionalFieldsText: string;
  readonly defaultTitle: string;
  readonly defaultContentText: string;
  readonly assetRequirements: TemplateAssetRequirement[];
  readonly thumbnailLabel: string;
  readonly thumbnailAlt: string;
  readonly thumbnailAssetPath: string;
  readonly thumbnailTone: TemplateTone;
  readonly mobilePreviewAlt: string;
  readonly mobilePreviewAssetPath: string;
  readonly accessibilityNotes: string;
}

interface ApiResponse<TData> {
  readonly ok: boolean;
  readonly data?: TData;
  readonly error?: {
    readonly message?: string;
    readonly fields?: Record<string, string[]>;
  };
}

const categoryOptions: readonly { value: TemplateCategory; label: string }[] = [
  { value: "personal", label: "Personal" },
  { value: "business", label: "Business" },
  { value: "restaurant", label: "Restaurant" },
  { value: "hotel", label: "Hotel" },
  { value: "school", label: "School" },
  { value: "event", label: "Event" },
  { value: "retail", label: "Retail" },
  { value: "healthcare", label: "Healthcare" },
  { value: "real_estate", label: "Real estate" },
  { value: "institution", label: "Institution" },
  { value: "media", label: "Media" },
  { value: "documents", label: "Documents" },
  { value: "feedback", label: "Feedback" },
];

const typeOptions: readonly { value: TemplateType; label: string }[] = [
  { value: "profile", label: "Profile" },
  { value: "business", label: "Business" },
  { value: "links", label: "Links" },
  { value: "menu", label: "Menu" },
  { value: "coupon", label: "Coupon" },
  { value: "event", label: "Event" },
  { value: "feedback", label: "Feedback" },
  { value: "pdf", label: "PDF" },
  { value: "images", label: "Images" },
  { value: "video_link", label: "Video link" },
  { value: "audio_link", label: "Audio link" },
];

const slotOptions: readonly { value: TemplateAssetSlot; label: string }[] = [
  { value: "avatar", label: "Avatar" },
  { value: "logo", label: "Logo" },
  { value: "hero", label: "Hero" },
  { value: "gallery", label: "Gallery" },
  { value: "pdf", label: "PDF" },
  { value: "audio", label: "Audio" },
  { value: "document", label: "Document" },
];

const kindOptions: readonly { value: TemplateAssetKind; label: string }[] = [
  { value: "image", label: "Image" },
  { value: "pdf", label: "PDF" },
  { value: "audio", label: "Audio" },
];

const toneOptions: readonly { value: TemplateTone; label: string }[] = [
  { value: "sky", label: "Sky" },
  { value: "emerald", label: "Emerald" },
  { value: "amber", label: "Amber" },
  { value: "rose", label: "Rose" },
  { value: "indigo", label: "Indigo" },
  { value: "slate", label: "Slate" },
];

export function AdminTemplateConsole({
  rows,
  total,
  nextCursor,
  backendUnavailable = false,
  query,
  mode,
  selectedTemplate,
}: AdminTemplateConsoleProps) {
  const initialForm = useMemo(
    () =>
      mode === "create"
        ? getSchoolStarterForm()
        : selectedTemplate
          ? toFormState(selectedTemplate)
          : null,
    [mode, selectedTemplate]
  );

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Templates"
        description="Create, review, publish, archive, and monitor landing page templates from one controlled console."
        actions={
          <div className="flex flex-wrap gap-2">
            <LinkButton href="/admin/templates/new" icon={<Plus className="h-4 w-4" />}>
              New template
            </LinkButton>
            <LinkButton href="/landing-pages" variant="secondary" icon={<ExternalLink className="h-4 w-4" />}>
              User gallery
            </LinkButton>
          </div>
        }
      />

      <section className="grid gap-4 sm:grid-cols-3">
        <MetricPanel label="Total templates" value={total} />
        <MetricPanel label="Showing" value={rows.length} />
        <MetricPanel label="Next page" value={nextCursor ? "Available" : "None"} />
      </section>

      {backendUnavailable && (
        <Alert variant="warning" title="Template database is not ready">
          Apply the pending Prisma migrations before saving or publishing
          templates. The console shell is available for review.
        </Alert>
      )}

      {!backendUnavailable && total === 0 && (
        <Alert variant="info" title="Template database is ready but empty">
          Seed first-party templates before relying on the database-backed
          public gallery. Static fallback can still serve public browsing.
        </Alert>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(22rem,0.9fr)_minmax(0,1.5fr)]">
        <TemplateList rows={rows} query={query} selectedId={selectedTemplate?.id} />
        {initialForm ? (
          <TemplateEditor
            key={initialForm.id ?? "new"}
            initialForm={initialForm}
            mode={mode === "edit" ? "edit" : "create"}
            selectedTemplate={selectedTemplate}
          />
        ) : (
          <EmptyEditorPanel />
        )}
      </div>
    </div>
  );
}

function TemplateList({
  rows,
  query,
  selectedId,
}: {
  readonly rows: readonly AdminTemplateConsoleRow[];
  readonly query: AdminTemplateConsoleProps["query"];
  readonly selectedId?: string;
}) {
  return (
    <section className="space-y-4">
      <form className="flex gap-2" action="/admin/templates">
        <label className="sr-only" htmlFor="template-search">
          Search templates
        </label>
        <div className="relative min-w-0 flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            id="template-search"
            name="q"
            defaultValue={query.q ?? ""}
            placeholder="Search templates"
            className="min-h-11 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-900 shadow-sm"
          />
        </div>
        <Button type="submit" variant="primary">
          Search
        </Button>
      </form>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-950">Catalog</h2>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Published admin templates appear in the user gallery.
          </p>
        </div>
        {rows.length === 0 ? (
          <div className="p-4">
            <Alert title="No templates found">
              Create a template or adjust the search query.
            </Alert>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {rows.map((row) => (
              <Link
                key={row.id}
                href={`/admin/templates/${row.id}`}
                className={cn(
                  "block px-4 py-3 transition-colors hover:bg-sky-50",
                  selectedId === row.id && "bg-sky-50"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-950">
                      {row.label}
                    </p>
                    <p className="mt-1 truncate text-xs text-slate-500">
                      {row.key} · {row.category} · {row.industry}
                    </p>
                  </div>
                  <Badge variant={getStatusVariant(row.status)}>
                    {row.status}
                  </Badge>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600">
                  <span>{row.usageCount} uses</span>
                  <span>{row.assetCount} assets</span>
                  <span>{row.landingPageCount} pages</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function TemplateEditor({
  initialForm,
  mode,
  selectedTemplate,
}: {
  readonly initialForm: TemplateFormState;
  readonly mode: "create" | "edit";
  readonly selectedTemplate?: AdminTemplateConsoleDetail;
}) {
  const router = useRouter();
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState<{
    readonly variant: "success" | "danger" | "info" | "warning";
    readonly text: string;
  } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingAssetIndex, setUploadingAssetIndex] = useState<number | null>(
    null
  );
  const [confirmAction, setConfirmAction] = useState<
    "publish" | "archive" | "restore" | null
  >(null);
  const parsedContent = useMemo(
    () => parseJsonRecord(form.defaultContentText),
    [form.defaultContentText]
  );
  const readiness = useMemo(
    () => getPublishReadiness(form, parsedContent),
    [form, parsedContent]
  );

  const setField = <TKey extends keyof TemplateFormState>(
    key: TKey,
    value: TemplateFormState[TKey]
  ) => setForm((previous) => ({ ...previous, [key]: value }));

  const saveTemplate = async (statusOverride?: TemplateStatus) => {
    setIsSaving(true);
    setMessage(null);

    try {
      const payload = toTemplatePayload(form, statusOverride);
      const endpoint =
        mode === "edit" && form.id
          ? `/api/admin/templates/${encodeURIComponent(form.id)}`
          : "/api/admin/templates";
      const response = await fetchJson<{
        readonly template: AdminTemplateConsoleDetail;
      }>(endpoint, {
        method: mode === "edit" ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      setMessage({
        variant: "success",
        text:
          statusOverride === "published"
            ? "Template published."
            : statusOverride === "archived"
              ? "Template archived."
              : "Template saved.",
      });

      if (mode === "create") {
        router.push(`/admin/templates/${response.template.id}`);
        return;
      }

      setForm(toFormState(response.template));
      router.refresh();
    } catch (error) {
      setMessage({
        variant: "danger",
        text: error instanceof Error ? error.message : "Template save failed.",
      });
    } finally {
      setIsSaving(false);
      setConfirmAction(null);
    }
  };

  const uploadAsset = async (assetIndex: number, file: File | undefined) => {
    if (!file) return;

    setUploadingAssetIndex(assetIndex);
    setMessage(null);

    try {
      const body = new FormData();
      body.set("file", file);

      const response = await fetchJson<{
        readonly asset: {
          readonly id: string;
          readonly assetPath: string;
          readonly contentType: string;
        };
      }>("/api/admin/landing-page-template-assets", {
        method: "POST",
        body,
      });

      updateAsset(assetIndex, {
        uploadedAssetId: response.asset.id,
        assetPath: response.asset.assetPath,
        alt:
          form.assetRequirements[assetIndex]?.alt?.trim() ||
          getAltTextFromAssetPath(response.asset.assetPath) ||
          form.assetRequirements[assetIndex]?.label ||
          "Template asset",
        kind: getAssetKindFromContentType(response.asset.contentType),
      });
      setMessage({
        variant: "success",
        text: "Owned template asset uploaded and attached.",
      });
    } catch (error) {
      setMessage({
        variant: "danger",
        text: error instanceof Error ? error.message : "Asset upload failed.",
      });
    } finally {
      setUploadingAssetIndex(null);
    }
  };

  const updateAsset = (
    assetIndex: number,
    patch: Partial<TemplateAssetRequirement>
  ) => {
    setForm((previous) => ({
      ...previous,
      assetRequirements: previous.assetRequirements.map((asset, index) =>
        index === assetIndex ? { ...asset, ...patch } : asset
      ),
    }));
  };

  const removeAsset = (assetIndex: number) => {
    setForm((previous) => ({
      ...previous,
      assetRequirements: previous.assetRequirements.filter(
        (_, index) => index !== assetIndex
      ),
    }));
  };

  const handleThumbnailAssetPathChange = (assetPath: string) => {
    setForm((previous) => ({
      ...previous,
      thumbnailAssetPath: assetPath,
      thumbnailAlt:
        previous.thumbnailAlt.trim() ||
        getAltTextFromAssetPath(assetPath) ||
        `${previous.label} template thumbnail`,
    }));
  };

  const handleMobilePreviewAssetPathChange = (assetPath: string) => {
    setForm((previous) => ({
      ...previous,
      mobilePreviewAssetPath: assetPath,
      mobilePreviewAlt:
        previous.mobilePreviewAlt.trim() ||
        getAltTextFromAssetPath(assetPath) ||
        `${previous.label} mobile preview`,
    }));
  };

  return (
    <section className="space-y-5">
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">
              {mode === "create" ? "Create template" : "Edit template"}
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Save as draft first, then publish only after the definition and
              preview are clean.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant={getStatusVariant(form.status)}>{form.status}</Badge>
            {selectedTemplate && (
              <Badge variant="info">{selectedTemplate.usageCount} uses</Badge>
            )}
          </div>
        </div>

        {message && (
          <Alert variant={message.variant} className="mt-4">
            {message.text}
          </Alert>
        )}

        <div className="mt-5 grid gap-5 2xl:grid-cols-[minmax(0,1fr)_25rem]">
          <div className="space-y-5">
            <section className="grid gap-4 md:grid-cols-2">
              <Input
                label="Template key"
                value={form.key}
                onChange={(event) => setField("key", event.target.value)}
                hint="Lowercase letters, numbers, and hyphens."
              />
              <Input
                label="Template name"
                value={form.label}
                onChange={(event) => setField("label", event.target.value)}
              />
              <Select
                label="Page type"
                value={form.type}
                onChange={(event) =>
                  setField("type", event.target.value as TemplateType)
                }
              >
                {typeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
              <Select
                label="Category"
                value={form.category}
                onChange={(event) =>
                  setField("category", event.target.value as TemplateCategory)
                }
              >
                {categoryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
              <Input
                label="Industry"
                value={form.industry}
                onChange={(event) => setField("industry", event.target.value)}
              />
              <Input
                label="Sort priority"
                inputMode="numeric"
                value={form.sortPriority}
                onChange={(event) =>
                  setField("sortPriority", event.target.value)
                }
              />
            </section>

            <Textarea
              label="Description"
              value={form.description}
              onChange={(event) => setField("description", event.target.value)}
            />

            <section className="grid gap-4 md:grid-cols-2">
              <Input
                label="Tags"
                value={form.tagsText}
                onChange={(event) => setField("tagsText", event.target.value)}
                hint="Comma-separated."
              />
              <Input
                label="Flags"
                value={form.flagsText}
                onChange={(event) => setField("flagsText", event.target.value)}
                hint="Allowed: popular, new."
              />
              <Input
                label="Required fields"
                value={form.requiredFieldsText}
                onChange={(event) =>
                  setField("requiredFieldsText", event.target.value)
                }
                hint="Fields must exist in default content before publishing."
              />
              <Input
                label="Optional fields"
                value={form.optionalFieldsText}
                onChange={(event) =>
                  setField("optionalFieldsText", event.target.value)
                }
              />
            </section>

            <Textarea
              label="Recommended QR use case"
              value={form.recommendedFor}
              onChange={(event) =>
                setField("recommendedFor", event.target.value)
              }
            />

            <section className="grid gap-4 md:grid-cols-2">
              <Input
                label="Default page title"
                value={form.defaultTitle}
                onChange={(event) =>
                  setField("defaultTitle", event.target.value)
                }
              />
              <Select
                label="Thumbnail tone"
                value={form.thumbnailTone}
                onChange={(event) =>
                  setField("thumbnailTone", event.target.value as TemplateTone)
                }
              >
                {toneOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
              <Input
                label="Thumbnail label"
                value={form.thumbnailLabel}
                onChange={(event) =>
                  setField("thumbnailLabel", event.target.value)
                }
              />
              <Input
                label="Thumbnail alt text"
                value={form.thumbnailAlt}
                onChange={(event) =>
                  setField("thumbnailAlt", event.target.value)
                }
              />
              <Input
                label="Thumbnail asset path"
                value={form.thumbnailAssetPath}
                onChange={(event) =>
                  handleThumbnailAssetPathChange(event.target.value)
                }
                hint="Use an owned static path or uploaded template asset path."
              />
              <Input
                label="Mobile preview asset path"
                value={form.mobilePreviewAssetPath}
                onChange={(event) =>
                  handleMobilePreviewAssetPathChange(event.target.value)
                }
              />
              <Input
                label="Mobile preview alt text"
                value={form.mobilePreviewAlt}
                onChange={(event) =>
                  setField("mobilePreviewAlt", event.target.value)
                }
                containerClassName="md:col-span-2"
              />
            </section>

            <Textarea
              label="Default content JSON"
              value={form.defaultContentText}
              onChange={(event) =>
                setField("defaultContentText", event.target.value)
              }
              className="min-h-72 font-mono text-xs"
              error={parsedContent.ok ? undefined : parsedContent.error}
            />

            <Textarea
              label="Accessibility notes"
              value={form.accessibilityNotes}
              onChange={(event) =>
                setField("accessibilityNotes", event.target.value)
              }
            />

            <AssetRequirementEditor
              assets={form.assetRequirements}
              uploadingAssetIndex={uploadingAssetIndex}
              onAdd={() =>
                setField("assetRequirements", [
                  ...form.assetRequirements,
                  {
                    slot: "hero",
                    label: "Hero image",
                    kind: "image",
                    required: false,
                  },
                ])
              }
              onRemove={removeAsset}
              onUpdate={updateAsset}
              onUpload={uploadAsset}
            />
          </div>

          <aside className="space-y-4">
            <PublishReadinessPanel readiness={readiness} />
            <TemplatePreviewPanel form={form} parsedContent={parsedContent} />
          </aside>
        </div>

        <div className="mt-5 flex flex-wrap justify-end gap-2 border-t border-slate-200 pt-4">
          <Button
            variant="secondary"
            leftIcon={<Save className="h-4 w-4" />}
            isLoading={isSaving}
            onClick={() => saveTemplate()}
          >
            {mode === "create" ? "Save draft" : "Save changes"}
          </Button>
          {mode === "edit" && form.status === "archived" ? (
            <Button
              variant="secondary"
              leftIcon={<RotateCcw className="h-4 w-4" />}
              onClick={() => setConfirmAction("restore")}
            >
              Restore draft
            </Button>
          ) : (
            mode === "edit" && (
              <Button
                variant="danger"
                leftIcon={<Archive className="h-4 w-4" />}
                onClick={() => setConfirmAction("archive")}
              >
                Archive
              </Button>
            )
          )}
          <Button
            variant="primary"
            leftIcon={<Rocket className="h-4 w-4" />}
            disabled={readiness.blockers.length > 0}
            onClick={() => setConfirmAction("publish")}
          >
            Publish
          </Button>
        </div>
      </div>

      <TemplateActionDialog
        action={confirmAction}
        readiness={readiness}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => {
          if (confirmAction === "publish") void saveTemplate("published");
          if (confirmAction === "archive") void saveTemplate("archived");
          if (confirmAction === "restore") void saveTemplate("draft");
        }}
        isSaving={isSaving}
      />
    </section>
  );
}

function AssetRequirementEditor({
  assets,
  uploadingAssetIndex,
  onAdd,
  onRemove,
  onUpdate,
  onUpload,
}: {
  readonly assets: readonly TemplateAssetRequirement[];
  readonly uploadingAssetIndex: number | null;
  readonly onAdd: () => void;
  readonly onRemove: (index: number) => void;
  readonly onUpdate: (
    index: number,
    patch: Partial<TemplateAssetRequirement>
  ) => void;
  readonly onUpload: (index: number, file: File | undefined) => void;
}) {
  return (
    <section className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-950">
            Asset requirements
          </h3>
          <p className="mt-1 text-xs leading-5 text-slate-600">
            Upload owned assets or attach approved first-party static paths.
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          leftIcon={<ImagePlus className="h-4 w-4" />}
          onClick={onAdd}
        >
          Add asset
        </Button>
      </div>

      {assets.length === 0 ? (
        <Alert>No asset requirements are configured for this template.</Alert>
      ) : (
        <div className="space-y-3">
          {assets.map((asset, index) => (
            <div
              key={`${asset.slot}-${index}`}
              className="rounded-lg border border-slate-200 bg-white p-3"
            >
              <div className="grid gap-3 md:grid-cols-3">
                <Select
                  label="Slot"
                  value={asset.slot}
                  onChange={(event) =>
                    onUpdate(index, {
                      slot: event.target.value as TemplateAssetSlot,
                    })
                  }
                >
                  {slotOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
                <Select
                  label="Kind"
                  value={asset.kind}
                  onChange={(event) =>
                    onUpdate(index, {
                      kind: event.target.value as TemplateAssetKind,
                    })
                  }
                >
                  {kindOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
                <Input
                  label="Label"
                  value={asset.label}
                  onChange={(event) =>
                    onUpdate(index, { label: event.target.value })
                  }
                />
                <Input
                  label="Asset path"
                  value={asset.assetPath ?? ""}
                  onChange={(event) =>
                    onUpdate(index, {
                      assetPath: event.target.value,
                      uploadedAssetId: undefined,
                      alt:
                        asset.alt?.trim() ||
                        getAltTextFromAssetPath(event.target.value) ||
                        asset.label,
                    })
                  }
                  containerClassName="md:col-span-2"
                />
                <Input
                  label="Alt text"
                  value={asset.alt ?? ""}
                  onChange={(event) =>
                    onUpdate(index, { alt: event.target.value })
                  }
                />
                <Input
                  label="Width"
                  inputMode="numeric"
                  value={asset.width?.toString() ?? ""}
                  onChange={(event) =>
                    onUpdate(index, {
                      width: toOptionalPositiveInteger(event.target.value),
                    })
                  }
                />
                <Input
                  label="Height"
                  inputMode="numeric"
                  value={asset.height?.toString() ?? ""}
                  onChange={(event) =>
                    onUpdate(index, {
                      height: toOptionalPositiveInteger(event.target.value),
                    })
                  }
                />
                <label className="flex min-h-12 items-center gap-2 pt-7 text-sm font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={asset.required}
                    onChange={(event) =>
                      onUpdate(index, { required: event.target.checked })
                    }
                    className="h-4 w-4 rounded border-slate-300 text-sky-700"
                  />
                  Required
                </label>
              </div>
              <div className="mt-3">
                <FileUpload
                  label="Upload owned asset"
                  accept={getAcceptedFileTypes(asset.kind)}
                  onChange={(event) =>
                    onUpload(index, event.currentTarget.files?.[0])
                  }
                  disabled={uploadingAssetIndex === index}
                  hint="Uses the admin-owned template asset flow."
                />
              </div>
              <div className="mt-3 flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemove(index)}
                >
                  Remove asset
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function PublishReadinessPanel({
  readiness,
}: {
  readonly readiness: ReturnType<typeof getPublishReadiness>;
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-950">
        <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden="true" />
        Publish readiness
      </h3>
      <ul className="mt-3 space-y-2 text-sm leading-6">
        {readiness.items.map((item) => (
          <li key={item.label} className="flex items-start gap-2">
            <span
              className={cn(
                "mt-2 h-2 w-2 shrink-0 rounded-full",
                item.state === "done" && "bg-emerald-500",
                item.state === "blocked" && "bg-rose-500"
              )}
            />
            <span className="text-slate-700">{item.label}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function TemplatePreviewPanel({
  form,
  parsedContent,
}: {
  readonly form: TemplateFormState;
  readonly parsedContent: JsonParseResult;
}) {
  const content = getLandingPagePreviewContent(parsedContent);
  const templateAssets = getLandingPagePreviewAssets(form);

  return (
    <section className="space-y-4">
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-950">
          <Monitor className="h-4 w-4 text-slate-500" aria-hidden="true" />
          Desktop preview
        </h3>
        <div className="mt-3 overflow-hidden rounded-lg border border-slate-200 bg-slate-50 p-3">
          <LandingPagePreview
            type={form.type as LandingPageType}
            title={form.defaultTitle || form.label}
            content={content}
            mode="desktop"
            templateAssets={templateAssets}
          />
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-950">
          <Smartphone className="h-4 w-4 text-slate-500" aria-hidden="true" />
          Mobile preview
        </h3>
        <div className="mt-3 flex justify-center">
          <div className="h-[560px] w-full max-w-[278px] overflow-hidden rounded-[2rem] border-[10px] border-slate-900 bg-white shadow-xl">
            <LandingPagePreview
              type={form.type as LandingPageType}
              title={form.defaultTitle || form.label}
              content={content}
              mode="mobile"
              templateAssets={templateAssets}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function TemplateActionDialog({
  action,
  readiness,
  onClose,
  onConfirm,
  isSaving,
}: {
  readonly action: "publish" | "archive" | "restore" | null;
  readonly readiness: ReturnType<typeof getPublishReadiness>;
  readonly onClose: () => void;
  readonly onConfirm: () => void;
  readonly isSaving: boolean;
}) {
  if (!action) return null;

  const copy = {
    publish: {
      title: "Publish template",
      description:
        "Published templates become visible in the user landing-page gallery.",
      button: "Publish",
      variant: "primary" as const,
    },
    archive: {
      title: "Archive template",
      description:
        "Archived templates disappear from user-facing selection. Existing landing pages keep their content.",
      button: "Archive",
      variant: "danger" as const,
    },
    restore: {
      title: "Restore template",
      description:
        "Restored templates return to draft so they can be reviewed before publishing.",
      button: "Restore",
      variant: "secondary" as const,
    },
  }[action];

  return (
    <Dialog
      open
      title={copy.title}
      description={copy.description}
      onClose={onClose}
    >
      {action === "publish" && readiness.warnings.length > 0 && (
        <Alert variant="warning" title="Review warnings" className="mb-4">
          {readiness.warnings.join(" ")}
        </Alert>
      )}
      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant={copy.variant}
          isLoading={isSaving}
          onClick={onConfirm}
          disabled={action === "publish" && readiness.blockers.length > 0}
        >
          {copy.button}
        </Button>
      </div>
    </Dialog>
  );
}

function EmptyEditorPanel() {
  return (
    <section className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
      <FileJson className="mx-auto h-10 w-10 text-sky-600" aria-hidden="true" />
      <h2 className="mt-4 text-lg font-semibold text-slate-950">
        Select or create a template
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
        Open a catalog item to edit it, or start with a publish-ready school
        template draft.
      </p>
      <div className="mt-5">
        <LinkButton href="/admin/templates/new" icon={<Plus className="h-4 w-4" />}>
          New school template
        </LinkButton>
      </div>
    </section>
  );
}

function MetricPanel({
  label,
  value,
}: {
  readonly label: string;
  readonly value: number | string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function LinkButton({
  href,
  icon,
  variant = "primary",
  children,
}: {
  readonly href: string;
  readonly icon?: ReactNode;
  readonly variant?: "primary" | "secondary";
  readonly children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold shadow-sm transition-colors",
        variant === "primary"
          ? "border-sky-700 bg-sky-700 text-white shadow-sky-700/20 hover:border-sky-800 hover:bg-sky-800"
          : "border-slate-200 bg-white text-slate-800 hover:border-sky-300 hover:bg-sky-50 hover:text-sky-900"
      )}
    >
      {icon}
      {children}
    </Link>
  );
}

function toFormState(template: AdminTemplateConsoleDetail): TemplateFormState {
  return {
    id: template.id,
    key: template.key,
    type: template.type,
    label: template.label,
    description: template.description,
    category: template.category,
    industry: template.industry,
    status: template.status,
    source: template.source,
    sortPriority: String(template.sortPriority),
    flagsText: template.flags.join(", "),
    tagsText: template.tags.join(", "),
    recommendedFor: template.recommendedFor,
    requiredFieldsText: template.requiredFields.join(", "),
    optionalFieldsText: template.optionalFields.join(", "),
    defaultTitle: template.defaultTitle,
    defaultContentText: JSON.stringify(template.defaultContent, null, 2),
    assetRequirements: [...template.assetRequirements],
    thumbnailLabel: template.thumbnail.label,
    thumbnailAlt: template.thumbnail.alt,
    thumbnailAssetPath: template.thumbnail.assetPath ?? "",
    thumbnailTone: template.thumbnail.tone,
    mobilePreviewAlt: template.mobilePreview.alt,
    mobilePreviewAssetPath: template.mobilePreview.assetPath ?? "",
    accessibilityNotes: template.accessibilityNotes,
  };
}

function getSchoolStarterForm(): TemplateFormState {
  return {
    key: `school-template-${Date.now().toString(36)}`,
    type: "business",
    label: "School Admissions Template",
    description:
      "A professional admissions landing page for schools sharing applications, visits, and contact details through QR codes.",
    category: "school",
    industry: "Education",
    status: "draft",
    source: "admin",
    sortPriority: "620",
    flagsText: "new",
    tagsText: "school, admissions, education, prospectus",
    recommendedFor:
      "Admission flyers, open days, school banners, reception desks, and parent information packs.",
    requiredFieldsText: "businessName, description, website",
    optionalFieldsText: "tagline, phone, email, address, links",
    defaultTitle: "School Admissions",
    defaultContentText: JSON.stringify(
      {
        businessName: "School Admissions",
        tagline: "Applications, visits, and parent information",
        description:
          "Share admissions details, open day information, school contacts, and application links in one mobile-friendly page.",
        website: "https://example.edu/admissions",
        phone: "+1 555 0100",
        email: "admissions@example.edu",
        address: "Admissions office",
        links: [
          {
            label: "Apply online",
            url: "https://example.edu/apply",
          },
        ],
      },
      null,
      2
    ),
    assetRequirements: [
      {
        slot: "logo",
        label: "School logo",
        kind: "image",
        required: false,
        assetPath:
          "/assets/landing-page-templates/school/school-logo-placeholder.png",
        alt: "Generic school logo placeholder.",
        width: 512,
        height: 512,
      },
      {
        slot: "hero",
        label: "Campus hero image",
        kind: "image",
        required: false,
        assetPath:
          "/assets/landing-page-templates/school/school-campus-exterior.webp",
        alt: "School campus exterior.",
        width: 1600,
        height: 900,
      },
    ],
    thumbnailLabel: "School",
    thumbnailAlt: "School admissions template thumbnail",
    thumbnailAssetPath:
      "/assets/landing-page-templates/thumbnails/school.svg",
    thumbnailTone: "sky",
    mobilePreviewAlt: "School admissions mobile preview",
    mobilePreviewAssetPath: "",
    accessibilityNotes:
      "Use clear admission deadlines, descriptive link labels, and high-contrast school contact information.",
  };
}

function toTemplatePayload(
  form: TemplateFormState,
  statusOverride?: TemplateStatus
) {
  const content = JSON.parse(form.defaultContentText) as Record<string, unknown>;
  const thumbnailAssetPath = form.thumbnailAssetPath.trim();
  const mobilePreviewAssetPath = form.mobilePreviewAssetPath.trim();

  return {
    key: form.key.trim(),
    type: form.type,
    label: form.label.trim(),
    description: form.description.trim(),
    category: form.category,
    industry: form.industry.trim(),
    status: statusOverride ?? form.status,
    source: form.source,
    sortPriority: Number.parseInt(form.sortPriority, 10),
    flags: parseCsv(form.flagsText),
    tags: parseCsv(form.tagsText),
    recommendedFor: form.recommendedFor.trim(),
    requiredFields: parseCsv(form.requiredFieldsText),
    optionalFields: parseCsv(form.optionalFieldsText),
    defaultTitle: form.defaultTitle.trim(),
    defaultContent: content,
    assetRequirements: form.assetRequirements.map((asset) => ({
      ...(asset.uploadedAssetId ? { uploadedAssetId: asset.uploadedAssetId } : {}),
      slot: asset.slot,
      label: asset.label.trim(),
      kind: asset.kind,
      required: asset.required,
      ...(asset.assetPath?.trim() ? { assetPath: asset.assetPath.trim() } : {}),
      ...(getResolvedAssetAlt(asset) ? { alt: getResolvedAssetAlt(asset) } : {}),
      ...(asset.width ? { width: asset.width } : {}),
      ...(asset.height ? { height: asset.height } : {}),
    })),
    thumbnail: {
      label: form.thumbnailLabel.trim(),
      alt:
        form.thumbnailAlt.trim() ||
        getAltTextFromAssetPath(thumbnailAssetPath) ||
        `${form.label.trim()} template thumbnail`,
      ...(thumbnailAssetPath ? { assetPath: thumbnailAssetPath } : {}),
      tone: form.thumbnailTone,
    },
    mobilePreview: {
      alt:
        form.mobilePreviewAlt.trim() ||
        getAltTextFromAssetPath(mobilePreviewAssetPath) ||
        `${form.label.trim()} mobile preview`,
      ...(mobilePreviewAssetPath ? { assetPath: mobilePreviewAssetPath } : {}),
      width: 390,
      height: 844,
    },
    accessibilityNotes: form.accessibilityNotes.trim(),
  };
}

function getPublishReadiness(
  form: TemplateFormState,
  parsedContent: JsonParseResult
) {
  const requiredFields = parseCsv(form.requiredFieldsText);
  const tags = parseCsv(form.tagsText);
  const blockers: string[] = [];
  const warnings: string[] = [];
  const hasDefaultContent =
    parsedContent.ok && Object.keys(parsedContent.value).length > 0;
  const hasThumbnailAsset = Boolean(form.thumbnailAssetPath.trim());
  const hasThumbnailAlt = Boolean(
    form.thumbnailAlt.trim() ||
      getAltTextFromAssetPath(form.thumbnailAssetPath)
  );
  const hasMobilePreviewAsset = Boolean(form.mobilePreviewAssetPath.trim());
  const hasMobilePreviewAlt = Boolean(
    form.mobilePreviewAlt.trim() ||
      getAltTextFromAssetPath(form.mobilePreviewAssetPath)
  );

  if (!parsedContent.ok) blockers.push("Default content JSON is invalid.");
  if (parsedContent.ok && !hasDefaultContent) {
    blockers.push("Default content JSON cannot be empty.");
  }
  if (tags.length === 0) blockers.push("At least one tag is required.");
  if (requiredFields.length === 0) {
    blockers.push("At least one required field is required.");
  }

  const missingContentFields: string[] = [];
  if (parsedContent.ok) {
    for (const field of requiredFields) {
      if (!isRequiredFieldPresent(field, parsedContent.value)) {
        missingContentFields.push(field);
        blockers.push(`Default content is missing ${field}.`);
      }
    }
  }

  if (!hasThumbnailAsset) {
    blockers.push("Thumbnail asset path is required before publishing.");
  }
  if (hasThumbnailAsset && !hasThumbnailAlt) {
    blockers.push("Thumbnail alt text is required before publishing.");
  }

  if (!hasMobilePreviewAsset) {
    blockers.push("Rendered 390x844 mobile preview is required before publishing.");
  }
  if (hasMobilePreviewAsset && !hasMobilePreviewAlt) {
    blockers.push("Mobile preview alt text is required before publishing.");
  }

  const missingRequiredAssets = form.assetRequirements.filter(
    (asset) =>
      asset.required &&
      !asset.assetPath?.trim() &&
      !asset.uploadedAssetId?.trim()
  );
  if (missingRequiredAssets.length > 0) {
    blockers.push(
      `${missingRequiredAssets.length} required asset slot has no owned asset.`
    );
  }
  const assetsMissingAlt = form.assetRequirements.filter((asset) => {
    const hasAsset = Boolean(asset.assetPath?.trim() || asset.uploadedAssetId?.trim());

    return hasAsset && !getResolvedAssetAlt(asset);
  });
  if (assetsMissingAlt.length > 0) {
    blockers.push(`${assetsMissingAlt.length} attached asset needs alt text.`);
  }

  const requiredAssetsReady = missingRequiredAssets.length === 0;
  const attachedAssetAltsReady = assetsMissingAlt.length === 0;
  const requiredContentReady =
    parsedContent.ok && requiredFields.length > 0 && missingContentFields.length === 0;

  return {
    blockers,
    warnings,
    items: [
      {
        label: hasDefaultContent
          ? "Default content JSON is valid and populated."
          : "Default content JSON must be valid and populated.",
        state: hasDefaultContent ? "done" : "blocked",
      },
      {
        label:
          requiredFields.length > 0
            ? `${requiredFields.length} required fields configured.`
            : "Required fields are missing.",
        state: requiredFields.length > 0 ? "done" : "blocked",
      },
      {
        label:
          requiredContentReady
            ? "Required fields are present in default content."
            : "Required content must be fixed before publishing.",
        state: requiredContentReady ? "done" : "blocked",
      },
      {
        label:
          hasThumbnailAsset && hasThumbnailAlt
            ? "Thumbnail asset and alt text are ready."
            : "Thumbnail asset and alt text are required.",
        state: hasThumbnailAsset && hasThumbnailAlt ? "done" : "blocked",
      },
      {
        label:
          hasMobilePreviewAsset && hasMobilePreviewAlt
            ? "390x844 mobile preview and alt text are ready."
            : "390x844 mobile preview and alt text are required.",
        state:
          hasMobilePreviewAsset && hasMobilePreviewAlt ? "done" : "blocked",
      },
      {
        label:
          requiredAssetsReady
            ? "Required asset slots have owned paths or uploads."
            : "Some required asset slots have no owned asset.",
        state: requiredAssetsReady ? "done" : "blocked",
      },
      {
        label:
          attachedAssetAltsReady
            ? "Attached asset alt text is resolved from names or manual text."
            : "Attached assets need alt text.",
        state: attachedAssetAltsReady ? "done" : "blocked",
      },
    ] as const,
  };
}

type JsonParseResult =
  | { readonly ok: true; readonly value: Record<string, unknown> }
  | { readonly ok: false; readonly error: string };

function parseJsonRecord(value: string): JsonParseResult {
  try {
    const parsed = JSON.parse(value);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return { ok: false, error: "JSON must be an object." };
    }

    return { ok: true, value: parsed as Record<string, unknown> };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Invalid JSON.",
    };
  }
}

function getLandingPagePreviewContent(
  parsedContent: JsonParseResult
): LandingPageContent {
  if (!parsedContent.ok) return initialLandingPageContent;

  return {
    ...initialLandingPageContent,
    ...parsedContent.value,
  } as LandingPageContent;
}

function getLandingPagePreviewAssets(
  form: TemplateFormState
): readonly LandingPageTemplateAssetRequirement[] {
  return form.assetRequirements.map((asset) => ({
    slot: asset.slot,
    label: asset.label,
    kind: asset.kind,
    required: asset.required,
    ...(asset.assetPath?.trim() ? { assetPath: asset.assetPath.trim() } : {}),
    ...(getResolvedAssetAlt(asset) ? { alt: getResolvedAssetAlt(asset) } : {}),
    ...(asset.width ? { width: asset.width } : {}),
    ...(asset.height ? { height: asset.height } : {}),
  }));
}

function getResolvedAssetAlt(asset: TemplateAssetRequirement): string {
  return (
    asset.alt?.trim() ||
    getAltTextFromAssetPath(asset.assetPath) ||
    asset.label.trim()
  );
}

function parseCsv(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function isRequiredFieldPresent(
  field: string,
  content: Record<string, unknown>
): boolean {
  if (field === "links") return Array.isArray(content.links) && content.links.length > 0;
  if (field === "sections") {
    return Array.isArray(content.sections) && content.sections.length > 0;
  }
  if (field === "images" || field === "pdf") return true;
  if (field === "audioUrl or audio") {
    return Boolean(getText(content.audioUrl) || content.audio);
  }

  return Boolean(getText(content[field]));
}

function getText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function getAltTextFromAssetPath(assetPath: string | undefined): string {
  if (!assetPath) return "";

  const fileName = assetPath
    .split(/[\\/]/)
    .pop()
    ?.split("?")[0]
    ?.replace(/\.[a-z0-9]+$/i, "");

  if (!fileName) return "";

  return fileName
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (character) => character.toUpperCase());
}

function toOptionalPositiveInteger(value: string): number | undefined {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function getAssetKindFromContentType(contentType: string): TemplateAssetKind {
  if (contentType === "application/pdf") return "pdf";
  if (contentType.startsWith("audio/")) return "audio";

  return "image";
}

function getAcceptedFileTypes(kind: TemplateAssetKind): string {
  if (kind === "pdf") return "application/pdf";
  if (kind === "audio") return "audio/mpeg,audio/mp4,audio/wav,audio/webm";

  return "image/png,image/jpeg,image/webp";
}

async function fetchJson<TData>(
  url: string,
  init: RequestInit
): Promise<TData> {
  const response = await fetch(url, {
    ...init,
    headers: { Accept: "application/json", ...(init.headers ?? {}) },
  });
  const body = (await response.json()) as ApiResponse<TData>;

  if (!response.ok || !body.ok || !body.data) {
    throw new Error(body.error?.message ?? "Request failed.");
  }

  return body.data;
}

function getStatusVariant(status: string) {
  if (status === "published") return "success";
  if (status === "archived") return "warning";

  return "neutral";
}
