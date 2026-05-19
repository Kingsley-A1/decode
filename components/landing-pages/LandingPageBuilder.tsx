"use client";

import { useMemo, useState, type ChangeEvent } from "react";
import {
  BriefcaseBusiness,
  CalendarDays,
  Check,
  FileText,
  Images,
  Link2,
  Loader2,
  MessageSquare,
  Music2,
  Plus,
  Rocket,
  Save,
  TicketPercent,
  Trash2,
  UploadCloud,
  User,
  Utensils,
  Video,
} from "lucide-react";
import { LandingPagePreview } from "@/components/landing-pages/LandingPagePreview";
import {
  initialLandingPageContent,
  landingPageTemplates,
} from "@/components/landing-pages/landing-page-data";
import type {
  LandingPageContent,
  LandingPageImage,
  LandingPageLink,
  LandingPageMediaAsset,
  LandingPageMenuItem,
  LandingPageStatus,
  LandingPageType,
  PreviewMode,
} from "@/components/landing-pages/landing-page-types";
import {
  Alert,
  Badge,
  Button,
  FileUpload,
  Input,
  SegmentedControl,
  Select,
  Textarea,
} from "@/components/ui";
import type { SegmentedControlOption } from "@/components/ui";
import { cn } from "@/lib/utils";

interface ApiResponse<TData> {
  readonly ok: boolean;
  readonly data?: TData;
  readonly error?: { readonly message: string };
}

interface PresignResponse {
  readonly asset: { readonly id: string };
  readonly upload: {
    readonly url: string;
    readonly method: string;
    readonly headers: Record<string, string>;
    readonly maxSizeBytes: number;
  };
}

interface UploadState {
  readonly slot: string;
  readonly message: string;
}

const templateIcons: Record<LandingPageType, React.ComponentType<{ className?: string }>> = {
  profile: User,
  business: BriefcaseBusiness,
  links: Link2,
  menu: Utensils,
  coupon: TicketPercent,
  event: CalendarDays,
  feedback: MessageSquare,
  pdf: FileText,
  images: Images,
  video_link: Video,
  audio_link: Music2,
};

const previewOptions: readonly SegmentedControlOption<PreviewMode>[] = [
  {
    value: "mobile",
    label: "Mobile",
    description: "Narrow phone preview.",
  },
  {
    value: "desktop",
    label: "Desktop",
    description: "Wide browser preview.",
  },
];

const statusOptions: readonly LandingPageStatus[] = [
  "draft",
  "published",
  "archived",
];

export function LandingPageBuilder() {
  const [type, setType] = useState<LandingPageType>("profile");
  const [title, setTitle] = useState("Customer landing page");
  const [qrCodeId, setQrCodeId] = useState("");
  const [landingPageId, setLandingPageId] = useState("");
  const [status, setStatus] = useState<LandingPageStatus>("draft");
  const [previewMode, setPreviewMode] = useState<PreviewMode>("mobile");
  const [content, setContent] = useState<LandingPageContent>(
    initialLandingPageContent
  );
  const [uploadState, setUploadState] = useState<UploadState | null>(null);
  const [saveState, setSaveState] = useState<UploadState | null>(null);
  const [notice, setNotice] = useState<string | null>(
    "Choose a template, validate the content, then save a draft or publish. Published pages remain editable."
  );

  const selectedTemplate = useMemo(
    () =>
      landingPageTemplates.find((template) => template.type === type) ??
      landingPageTemplates[0],
    [type]
  );
  const validationErrors = useMemo(
    () => validateContent(type, content),
    [type, content]
  );
  const canSave = validationErrors.length === 0 && title.trim() && qrCodeId.trim();

  const handleFieldChange = (key: keyof LandingPageContent, value: string) => {
    setContent((previous) => ({ ...previous, [key]: value }));
  };

  const handleTemplateChange = (nextType: LandingPageType) => {
    setType(nextType);
    setNotice(null);
  };

  const handleUpload = async ({
    event,
    slot,
    mediaKind,
  }: {
    readonly event: ChangeEvent<HTMLInputElement>;
    readonly slot: "avatar" | "logo" | "pdf" | "images" | "audio";
    readonly mediaKind: "image" | "pdf" | "audio";
  }) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const validation = validateFile(file, mediaKind);
    if (validation) {
      setNotice(validation);
      return;
    }

    setUploadState({ slot, message: `Uploading ${file.name}` });
    setNotice(null);

    try {
      const asset = await uploadLandingPageAsset(file);
      const mediaAsset: LandingPageMediaAsset = {
        assetId: asset.assetId,
        previewUrl: URL.createObjectURL(file),
        fileName: file.name,
        contentType: file.type,
      };

      setContent((previous) => applyUploadedAsset(previous, slot, mediaAsset));
      setNotice(`Uploaded ${file.name} through the landing-page media flow.`);
    } catch (error) {
      const mediaAsset: LandingPageMediaAsset = {
        assetId: `preview-${Date.now()}`,
        previewUrl: URL.createObjectURL(file),
        fileName: file.name,
        contentType: file.type,
      };

      setContent((previous) => applyUploadedAsset(previous, slot, mediaAsset));
      setNotice(
        error instanceof Error
          ? `${error.message} Using a local preview asset until the signed upload flow is available.`
          : "Using a local preview asset until the signed upload flow is available."
      );
    } finally {
      setUploadState(null);
    }
  };

  const handleSave = async (nextStatus: LandingPageStatus) => {
    if (!canSave) return;

    setSaveState({
      slot: nextStatus,
      message: nextStatus === "published" ? "Publishing page" : "Saving page",
    });
    setNotice(null);

    const payload = {
      title,
      status: nextStatus,
      type,
      content: buildApiContent(type, content),
    };

    try {
      const endpoint = landingPageId
        ? `/api/landing-pages/${encodeURIComponent(landingPageId)}`
        : "/api/landing-pages";
      const method = landingPageId ? "PATCH" : "POST";
      const response = await fetchJson<
        ApiResponse<{ landingPage: { id: string; status: LandingPageStatus } }>
      >(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          method === "POST" ? { ...payload, qrCodeId } : payload
        ),
      });

      if (!response.ok) {
        throw new Error(response.error?.message ?? "Could not save landing page.");
      }

      setLandingPageId(response.data?.landingPage.id ?? landingPageId);
      setStatus(response.data?.landingPage.status ?? nextStatus);
      setNotice(
        nextStatus === "published"
          ? "Landing page published and remains editable."
          : "Landing page saved."
      );
    } catch (error) {
      if (!landingPageId) {
        setLandingPageId(`preview-page-${Date.now()}`);
      }
      setStatus(nextStatus);
      setNotice(
        error instanceof Error
          ? `${error.message} Changes are preserved locally in preview mode.`
          : "Changes are preserved locally in preview mode."
      );
    } finally {
      setSaveState(null);
    }
  };

  return (
    <div className="space-y-6">
      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">
                Landing-page builder
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Build editable public pages for dynamic QR codes with clear
                content validation, media upload controls, and launch preview.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant={status === "published" ? "success" : "neutral"}>
                {status}
              </Badge>
              <Badge variant="info">{selectedTemplate.label}</Badge>
            </div>
          </div>

          {notice && (
            <Alert className="mt-4" variant="info" title="Builder status">
              {notice}
            </Alert>
          )}

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <Input
              label="Page title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Campaign landing page"
              containerClassName="md:col-span-2"
            />
            <Select
              label="Status"
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as LandingPageStatus)
              }
            >
              {statusOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </Select>
            <Input
              label="Dynamic QR code ID"
              value={qrCodeId}
              onChange={(event) => setQrCodeId(event.target.value)}
              placeholder="Dynamic QR ID"
              hint="Landing pages attach to dynamic QR codes."
              containerClassName="md:col-span-2"
            />
            <Input
              label="Landing page ID"
              value={landingPageId}
              onChange={(event) => setLandingPageId(event.target.value)}
              placeholder="Leave empty to create"
              hint="Existing published pages can be edited."
            />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold text-slate-950">Save checklist</p>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
            <ChecklistItem done={Boolean(title.trim())}>Page title set</ChecklistItem>
            <ChecklistItem done={Boolean(qrCodeId.trim())}>
              Dynamic QR selected
            </ChecklistItem>
            <ChecklistItem done={validationErrors.length === 0}>
              Required content valid
            </ChecklistItem>
            <ChecklistItem done={status !== "archived"}>
              Page remains editable
            </ChecklistItem>
          </ul>
          {validationErrors.length > 0 && (
            <Alert className="mt-4" variant="warning" title="Required fields">
              {validationErrors.join(" ")}
            </Alert>
          )}
          <div className="mt-4 grid gap-2">
            <Button
              variant="secondary"
              onClick={() => handleSave("draft")}
              disabled={!canSave || Boolean(saveState)}
              isLoading={saveState?.slot === "draft"}
              leftIcon={<Save className="h-4 w-4" aria-hidden="true" />}
            >
              Save draft
            </Button>
            <Button
              variant="primary"
              onClick={() => handleSave("published")}
              disabled={!canSave || Boolean(saveState)}
              isLoading={saveState?.slot === "published"}
              leftIcon={<Rocket className="h-4 w-4" aria-hidden="true" />}
            >
              Publish changes
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(360px,520px)]">
        <div className="space-y-5">
          <TemplatePicker value={type} onChange={handleTemplateChange} />
          <ContentEditor
            type={type}
            content={content}
            uploadState={uploadState}
            onFieldChange={handleFieldChange}
            onContentChange={setContent}
            onUpload={handleUpload}
          />
        </div>

        <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">
                  Live preview
                </h2>
                <p className="text-sm text-slate-600">
                  Checks mobile and desktop page fit before publishing.
                </p>
              </div>
              <div className="w-full sm:w-64">
                <SegmentedControl
                  value={previewMode}
                  options={previewOptions}
                  onChange={setPreviewMode}
                  label="Preview mode"
                  columns={2}
                />
              </div>
            </div>
            <LandingPagePreview
              type={type}
              title={title}
              content={content}
              mode={previewMode}
            />
          </div>
        </aside>
      </section>
    </div>
  );
}

function TemplatePicker({
  value,
  onChange,
}: {
  readonly value: LandingPageType;
  readonly onChange: (type: LandingPageType) => void;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <h2 className="text-lg font-semibold text-slate-950">
        Choose a template
      </h2>
      <p className="mt-1 text-sm leading-6 text-slate-600">
        Templates map directly to the public landing-page renderer.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {landingPageTemplates.map((template) => {
          const Icon = templateIcons[template.type];
          const isSelected = value === template.type;

          return (
            <button
              key={template.type}
              type="button"
              onClick={() => onChange(template.type)}
              className={cn(
                "min-h-32 rounded-lg border p-4 text-left transition-colors",
                isSelected
                  ? "border-sky-400 bg-sky-50 text-sky-950"
                  : "border-slate-200 bg-white text-slate-700 hover:border-sky-300 hover:bg-sky-50"
              )}
            >
              <span className="flex items-center gap-2">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-sky-700 shadow-sm ring-1 ring-slate-200">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="font-semibold">{template.label}</span>
              </span>
              <span className="mt-3 block text-sm leading-6 text-slate-600">
                {template.description}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function ContentEditor({
  type,
  content,
  uploadState,
  onFieldChange,
  onContentChange,
  onUpload,
}: {
  readonly type: LandingPageType;
  readonly content: LandingPageContent;
  readonly uploadState: UploadState | null;
  readonly onFieldChange: (key: keyof LandingPageContent, value: string) => void;
  readonly onContentChange: (value: LandingPageContent) => void;
  readonly onUpload: (input: {
    readonly event: ChangeEvent<HTMLInputElement>;
    readonly slot: "avatar" | "logo" | "pdf" | "images" | "audio";
    readonly mediaKind: "image" | "pdf" | "audio";
  }) => void;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-slate-950">Edit content</h2>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          Required fields validate before draft save or publish.
        </p>
      </div>

      <div className="space-y-5">
        {renderTemplateFields({
          type,
          content,
          uploadState,
          onFieldChange,
          onContentChange,
          onUpload,
        })}
      </div>
    </section>
  );
}

function renderTemplateFields({
  type,
  content,
  uploadState,
  onFieldChange,
  onContentChange,
  onUpload,
}: {
  readonly type: LandingPageType;
  readonly content: LandingPageContent;
  readonly uploadState: UploadState | null;
  readonly onFieldChange: (key: keyof LandingPageContent, value: string) => void;
  readonly onContentChange: (value: LandingPageContent) => void;
  readonly onUpload: (input: {
    readonly event: ChangeEvent<HTMLInputElement>;
    readonly slot: "avatar" | "logo" | "pdf" | "images" | "audio";
    readonly mediaKind: "image" | "pdf" | "audio";
  }) => void;
}) {
  if (type === "profile") {
    return (
      <>
        <FieldGrid>
          <Input
            label="Display name"
            value={content.displayName}
            onChange={(event) => onFieldChange("displayName", event.target.value)}
          />
          <Input
            label="Headline"
            value={content.headline}
            onChange={(event) => onFieldChange("headline", event.target.value)}
          />
          <Textarea
            label="Bio"
            value={content.bio}
            onChange={(event) => onFieldChange("bio", event.target.value)}
            containerClassName="md:col-span-2"
          />
        </FieldGrid>
        <MediaUpload
          label="Avatar image"
          hint="PNG, JPG, or WebP up to 10 MB."
          accept="image/png,image/jpeg,image/webp"
          isUploading={uploadState?.slot === "avatar"}
          onChange={(event) =>
            onUpload({ event, slot: "avatar", mediaKind: "image" })
          }
        />
        <LinksEditor content={content} onContentChange={onContentChange} />
      </>
    );
  }

  if (type === "business") {
    return (
      <>
        <FieldGrid>
          <Input
            label="Business name"
            value={content.businessName}
            onChange={(event) => onFieldChange("businessName", event.target.value)}
          />
          <Input
            label="Tagline"
            value={content.tagline}
            onChange={(event) => onFieldChange("tagline", event.target.value)}
          />
          <Textarea
            label="Description"
            value={content.description}
            onChange={(event) => onFieldChange("description", event.target.value)}
            containerClassName="md:col-span-2"
          />
          <Input
            label="Phone"
            value={content.phone}
            onChange={(event) => onFieldChange("phone", event.target.value)}
          />
          <Input
            label="Email"
            type="email"
            value={content.email}
            onChange={(event) => onFieldChange("email", event.target.value)}
          />
          <Input
            label="Website"
            value={content.website}
            onChange={(event) => onFieldChange("website", event.target.value)}
          />
          <Input
            label="Address"
            value={content.address}
            onChange={(event) => onFieldChange("address", event.target.value)}
          />
        </FieldGrid>
        <MediaUpload
          label="Business logo"
          hint="PNG, JPG, or WebP up to 10 MB."
          accept="image/png,image/jpeg,image/webp"
          isUploading={uploadState?.slot === "logo"}
          onChange={(event) =>
            onUpload({ event, slot: "logo", mediaKind: "image" })
          }
        />
        <LinksEditor content={content} onContentChange={onContentChange} />
      </>
    );
  }

  if (type === "links") {
    return (
      <>
        <FieldGrid>
          <Input
            label="Heading"
            value={content.heading}
            onChange={(event) => onFieldChange("heading", event.target.value)}
          />
          <Textarea
            label="Description"
            value={content.description}
            onChange={(event) => onFieldChange("description", event.target.value)}
          />
        </FieldGrid>
        <LinksEditor content={content} onContentChange={onContentChange} />
      </>
    );
  }

  if (type === "menu") {
    return (
      <>
        <FieldGrid>
          <Input
            label="Restaurant name"
            value={content.restaurantName}
            onChange={(event) =>
              onFieldChange("restaurantName", event.target.value)
            }
          />
          <Input
            label="Menu description"
            value={content.description}
            onChange={(event) => onFieldChange("description", event.target.value)}
          />
        </FieldGrid>
        <MenuEditor content={content} onContentChange={onContentChange} />
      </>
    );
  }

  if (type === "coupon") {
    return (
      <FieldGrid>
        <Input
          label="Headline"
          value={content.couponHeadline}
          onChange={(event) =>
            onFieldChange("couponHeadline", event.target.value)
          }
        />
        <Input
          label="Coupon code"
          value={content.couponCode}
          onChange={(event) => onFieldChange("couponCode", event.target.value)}
        />
        <Input
          label="Expires at"
          type="datetime-local"
          value={content.expiresAt}
          onChange={(event) => onFieldChange("expiresAt", event.target.value)}
        />
        <Input
          label="Redemption URL"
          value={content.redemptionUrl}
          onChange={(event) => onFieldChange("redemptionUrl", event.target.value)}
        />
        <Textarea
          label="Details"
          value={content.couponDetails}
          onChange={(event) => onFieldChange("couponDetails", event.target.value)}
          containerClassName="md:col-span-2"
        />
      </FieldGrid>
    );
  }

  if (type === "event") {
    return (
      <FieldGrid>
        <Input
          label="Event name"
          value={content.eventName}
          onChange={(event) => onFieldChange("eventName", event.target.value)}
        />
        <Input
          label="Location"
          value={content.location}
          onChange={(event) => onFieldChange("location", event.target.value)}
        />
        <Input
          label="Starts at"
          type="datetime-local"
          value={content.startAt}
          onChange={(event) => onFieldChange("startAt", event.target.value)}
        />
        <Input
          label="Ends at"
          type="datetime-local"
          value={content.endAt}
          onChange={(event) => onFieldChange("endAt", event.target.value)}
        />
        <Input
          label="Registration URL"
          value={content.registrationUrl}
          onChange={(event) =>
            onFieldChange("registrationUrl", event.target.value)
          }
          containerClassName="md:col-span-2"
        />
        <Textarea
          label="Description"
          value={content.description}
          onChange={(event) => onFieldChange("description", event.target.value)}
          containerClassName="md:col-span-2"
        />
      </FieldGrid>
    );
  }

  if (type === "feedback") {
    return (
      <FieldGrid>
        <Input
          label="Heading"
          value={content.heading}
          onChange={(event) => onFieldChange("heading", event.target.value)}
        />
        <Input
          label="Form URL"
          value={content.formUrl}
          onChange={(event) => onFieldChange("formUrl", event.target.value)}
        />
        <Textarea
          label="Description"
          value={content.description}
          onChange={(event) => onFieldChange("description", event.target.value)}
          containerClassName="md:col-span-2"
        />
      </FieldGrid>
    );
  }

  if (type === "pdf") {
    return (
      <>
        <FieldGrid>
          <Input
            label="PDF title"
            value={content.pdfTitle}
            onChange={(event) => onFieldChange("pdfTitle", event.target.value)}
          />
          <Textarea
            label="Description"
            value={content.description}
            onChange={(event) => onFieldChange("description", event.target.value)}
          />
        </FieldGrid>
        <MediaUpload
          label="Upload PDF"
          hint="PDF files up to 25 MB."
          accept="application/pdf"
          isUploading={uploadState?.slot === "pdf"}
          onChange={(event) => onUpload({ event, slot: "pdf", mediaKind: "pdf" })}
        />
      </>
    );
  }

  if (type === "images") {
    return (
      <>
        <FieldGrid>
          <Input
            label="Gallery title"
            value={content.heading}
            onChange={(event) => onFieldChange("heading", event.target.value)}
          />
          <Textarea
            label="Description"
            value={content.description}
            onChange={(event) => onFieldChange("description", event.target.value)}
          />
        </FieldGrid>
        <MediaUpload
          label="Add image"
          hint="PNG, JPG, or WebP up to 10 MB."
          accept="image/png,image/jpeg,image/webp"
          isUploading={uploadState?.slot === "images"}
          onChange={(event) =>
            onUpload({ event, slot: "images", mediaKind: "image" })
          }
        />
        <ImageEditor content={content} onContentChange={onContentChange} />
      </>
    );
  }

  if (type === "video_link") {
    return (
      <FieldGrid>
        <Input
          label="Video title"
          value={content.videoTitle}
          onChange={(event) => onFieldChange("videoTitle", event.target.value)}
        />
        <Input
          label="Video URL"
          value={content.videoUrl}
          onChange={(event) => onFieldChange("videoUrl", event.target.value)}
        />
        <Textarea
          label="Description"
          value={content.description}
          onChange={(event) => onFieldChange("description", event.target.value)}
          containerClassName="md:col-span-2"
        />
      </FieldGrid>
    );
  }

  return (
    <>
      <FieldGrid>
        <Input
          label="Audio title"
          value={content.audioTitle}
          onChange={(event) => onFieldChange("audioTitle", event.target.value)}
        />
        <Input
          label="Audio URL"
          value={content.audioUrl}
          onChange={(event) => onFieldChange("audioUrl", event.target.value)}
        />
        <Textarea
          label="Description"
          value={content.description}
          onChange={(event) => onFieldChange("description", event.target.value)}
          containerClassName="md:col-span-2"
        />
      </FieldGrid>
      <MediaUpload
        label="Upload audio"
        hint="MP3, M4A, WAV, or WebM up to 50 MB."
        accept="audio/mpeg,audio/mp4,audio/wav,audio/webm"
        isUploading={uploadState?.slot === "audio"}
        onChange={(event) => onUpload({ event, slot: "audio", mediaKind: "audio" })}
      />
    </>
  );
}

function FieldGrid({ children }: { readonly children: React.ReactNode }) {
  return <div className="grid gap-4 md:grid-cols-2">{children}</div>;
}

function LinksEditor({
  content,
  onContentChange,
}: {
  readonly content: LandingPageContent;
  readonly onContentChange: (content: LandingPageContent) => void;
}) {
  const handleLinkChange = (
    id: string,
    key: keyof Pick<LandingPageLink, "label" | "url">,
    value: string
  ) => {
    onContentChange({
      ...content,
      links: content.links.map((link) =>
        link.id === id ? { ...link, [key]: value } : link
      ),
    });
  };

  const handleAddLink = () => {
    onContentChange({
      ...content,
      links: [
        ...content.links,
        { id: createClientId("link"), label: "New link", url: "https://example.com" },
      ],
    });
  };

  const handleRemoveLink = (id: string) => {
    onContentChange({
      ...content,
      links: content.links.filter((link) => link.id !== id),
    });
  };

  return (
    <EditorGroup
      title="Links"
      action={
        <Button
          variant="secondary"
          size="sm"
          onClick={handleAddLink}
          leftIcon={<Plus className="h-4 w-4" aria-hidden="true" />}
        >
          Add link
        </Button>
      }
    >
      {content.links.map((link) => (
        <div
          key={link.id}
          className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 md:grid-cols-[1fr_1fr_auto]"
        >
          <Input
            label="Label"
            value={link.label}
            onChange={(event) =>
              handleLinkChange(link.id, "label", event.target.value)
            }
          />
          <Input
            label="URL"
            value={link.url}
            onChange={(event) =>
              handleLinkChange(link.id, "url", event.target.value)
            }
          />
          <Button
            variant="danger"
            size="icon"
            className="self-end"
            onClick={() => handleRemoveLink(link.id)}
            aria-label={`Remove ${link.label}`}
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      ))}
    </EditorGroup>
  );
}

function MenuEditor({
  content,
  onContentChange,
}: {
  readonly content: LandingPageContent;
  readonly onContentChange: (content: LandingPageContent) => void;
}) {
  const handleItemChange = (
    sectionId: string,
    itemId: string,
    key: keyof Omit<LandingPageMenuItem, "id">,
    value: string
  ) => {
    onContentChange({
      ...content,
      sections: content.sections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              items: section.items.map((item) =>
                item.id === itemId ? { ...item, [key]: value } : item
              ),
            }
          : section
      ),
    });
  };

  const handleAddItem = (sectionId: string) => {
    onContentChange({
      ...content,
      sections: content.sections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              items: [
                ...section.items,
                {
                  id: createClientId("item"),
                  name: "New item",
                  description: "",
                  price: "",
                },
              ],
            }
          : section
      ),
    });
  };

  return (
    <EditorGroup title="Menu sections">
      {content.sections.map((section) => (
        <div
          key={section.id}
          className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3"
        >
          <Input
            label="Section name"
            value={section.name}
            onChange={(event) =>
              onContentChange({
                ...content,
                sections: content.sections.map((item) =>
                  item.id === section.id
                    ? { ...item, name: event.target.value }
                    : item
                ),
              })
            }
          />
          {section.items.map((item) => (
            <div key={item.id} className="grid gap-3 md:grid-cols-3">
              <Input
                label="Item"
                value={item.name}
                onChange={(event) =>
                  handleItemChange(section.id, item.id, "name", event.target.value)
                }
              />
              <Input
                label="Description"
                value={item.description}
                onChange={(event) =>
                  handleItemChange(
                    section.id,
                    item.id,
                    "description",
                    event.target.value
                  )
                }
              />
              <Input
                label="Price"
                value={item.price}
                onChange={(event) =>
                  handleItemChange(section.id, item.id, "price", event.target.value)
                }
              />
            </div>
          ))}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleAddItem(section.id)}
            leftIcon={<Plus className="h-4 w-4" aria-hidden="true" />}
          >
            Add menu item
          </Button>
        </div>
      ))}
    </EditorGroup>
  );
}

function ImageEditor({
  content,
  onContentChange,
}: {
  readonly content: LandingPageContent;
  readonly onContentChange: (content: LandingPageContent) => void;
}) {
  const handleImageChange = (
    id: string,
    key: keyof Pick<LandingPageImage, "alt" | "caption">,
    value: string
  ) => {
    onContentChange({
      ...content,
      images: content.images.map((image) =>
        image.id === id ? { ...image, [key]: value } : image
      ),
    });
  };

  return (
    <EditorGroup title="Image labels">
      {content.images.map((image) => (
        <div
          key={image.id}
          className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 md:grid-cols-2"
        >
          <Input
            label="Alt text"
            value={image.alt}
            onChange={(event) =>
              handleImageChange(image.id, "alt", event.target.value)
            }
          />
          <Input
            label="Caption"
            value={image.caption}
            onChange={(event) =>
              handleImageChange(image.id, "caption", event.target.value)
            }
          />
        </div>
      ))}
    </EditorGroup>
  );
}

function MediaUpload({
  label,
  hint,
  accept,
  isUploading,
  onChange,
}: {
  readonly label: string;
  readonly hint: string;
  readonly accept: string;
  readonly isUploading: boolean;
  readonly onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-950">
        {isUploading ? (
          <Loader2 className="h-4 w-4 animate-spin text-sky-700" aria-hidden="true" />
        ) : (
          <UploadCloud className="h-4 w-4 text-sky-700" aria-hidden="true" />
        )}
        {isUploading ? "Uploading media" : "Media upload"}
      </div>
      <FileUpload label={label} hint={hint} accept={accept} onChange={onChange} />
    </div>
  );
}

function EditorGroup({
  title,
  action,
  children,
}: {
  readonly title: string;
  readonly action?: React.ReactNode;
  readonly children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-slate-950">{title}</h3>
        {action}
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function ChecklistItem({
  done,
  children,
}: {
  readonly done: boolean;
  readonly children: React.ReactNode;
}) {
  return (
    <li className="flex items-center gap-2">
      <span
        className={cn(
          "flex h-5 w-5 items-center justify-center rounded-full border",
          done
            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
            : "border-slate-200 bg-white text-slate-400"
        )}
      >
        <Check className="h-3 w-3" aria-hidden="true" />
      </span>
      {children}
    </li>
  );
}

function applyUploadedAsset(
  content: LandingPageContent,
  slot: "avatar" | "logo" | "pdf" | "images" | "audio",
  asset: LandingPageMediaAsset
): LandingPageContent {
  if (slot === "images") {
    return {
      ...content,
      images: [
        ...content.images,
        {
          id: createClientId("image"),
          assetId: asset.assetId,
          previewUrl: asset.previewUrl,
          alt: asset.fileName,
          caption: asset.fileName,
        },
      ],
    };
  }

  return { ...content, [slot]: asset };
}

function validateContent(
  type: LandingPageType,
  content: LandingPageContent
): string[] {
  const errors: string[] = [];
  const requireValue = (value: string, message: string) => {
    if (!value.trim()) errors.push(message);
  };

  if (type === "profile") requireValue(content.displayName, "Display name is required.");
  if (type === "business") requireValue(content.businessName, "Business name is required.");
  if (type === "links") {
    requireValue(content.heading, "Heading is required.");
    if (content.links.length === 0) errors.push("Add at least one link.");
  }
  if (type === "menu") {
    requireValue(content.restaurantName, "Restaurant name is required.");
    if (content.sections.length === 0) errors.push("Add at least one menu section.");
  }
  if (type === "coupon") {
    requireValue(content.couponHeadline, "Coupon headline is required.");
    requireValue(content.couponCode, "Coupon code is required.");
  }
  if (type === "event") {
    requireValue(content.eventName, "Event name is required.");
    requireValue(content.startAt, "Event start time is required.");
  }
  if (type === "feedback") {
    requireValue(content.heading, "Heading is required.");
    requireValue(content.formUrl, "Feedback form URL is required.");
  }
  if (type === "pdf") {
    requireValue(content.pdfTitle, "PDF title is required.");
    if (!content.pdf?.assetId) errors.push("Upload a PDF before publishing.");
  }
  if (type === "images" && content.images.length === 0) {
    errors.push("Add at least one image.");
  }
  if (type === "video_link") {
    requireValue(content.videoTitle, "Video title is required.");
    requireValue(content.videoUrl, "Video URL is required.");
  }
  if (type === "audio_link") {
    requireValue(content.audioTitle, "Audio title is required.");
    if (!content.audioUrl.trim() && !content.audio?.assetId) {
      errors.push("Provide an audio URL or upload an audio file.");
    }
  }

  return errors;
}

function buildApiContent(type: LandingPageType, content: LandingPageContent) {
  if (type === "profile") {
    return {
      displayName: content.displayName,
      headline: content.headline,
      bio: content.bio,
      avatarAssetId: content.avatar?.assetId,
      links: buildLinks(content.links),
    };
  }

  if (type === "business") {
    return {
      businessName: content.businessName,
      tagline: content.tagline,
      description: content.description,
      logoAssetId: content.logo?.assetId,
      phone: content.phone,
      email: content.email,
      website: content.website,
      address: content.address,
      links: buildLinks(content.links),
    };
  }

  if (type === "links") {
    return {
      heading: content.heading,
      description: content.description,
      links: buildLinks(content.links),
    };
  }

  if (type === "menu") {
    return {
      restaurantName: content.restaurantName,
      description: content.description,
      sections: content.sections.map((section) => ({
        name: section.name,
        items: section.items.map((item) => ({
          name: item.name,
          description: item.description || undefined,
          price: item.price || undefined,
        })),
      })),
    };
  }

  if (type === "coupon") {
    return {
      headline: content.couponHeadline,
      code: content.couponCode,
      details: content.couponDetails,
      expiresAt: toIsoDateTime(content.expiresAt),
      redemptionUrl: content.redemptionUrl || undefined,
    };
  }

  if (type === "event") {
    return {
      name: content.eventName,
      startAt: toIsoDateTime(content.startAt),
      endAt: content.endAt ? toIsoDateTime(content.endAt) : undefined,
      location: content.location,
      description: content.description,
      registrationUrl: content.registrationUrl || undefined,
    };
  }

  if (type === "feedback") {
    return {
      heading: content.heading,
      description: content.description,
      formUrl: content.formUrl,
    };
  }

  if (type === "pdf") {
    return {
      title: content.pdfTitle,
      description: content.description,
      pdfAssetId: content.pdf?.assetId,
    };
  }

  if (type === "images") {
    return {
      title: content.heading,
      description: content.description,
      images: content.images.map((image) => ({
        assetId: image.assetId,
        alt: image.alt,
        caption: image.caption,
      })),
    };
  }

  if (type === "video_link") {
    return {
      title: content.videoTitle,
      description: content.description,
      videoUrl: content.videoUrl,
    };
  }

  return {
    title: content.audioTitle,
    description: content.description,
    audioUrl: content.audioUrl || undefined,
    audioAssetId: content.audio?.assetId,
  };
}

function buildLinks(links: readonly LandingPageLink[]) {
  return links
    .filter((link) => link.label.trim() && link.url.trim())
    .map((link) => ({ label: link.label, url: link.url }));
}

function validateFile(file: File, mediaKind: "image" | "pdf" | "audio"): string | null {
  const allowed = getAllowedMedia(mediaKind);
  if (!allowed.contentTypes.has(file.type)) {
    return `Unsupported file type. Allowed: ${allowed.label}.`;
  }

  if (file.size > allowed.maxSizeBytes) {
    return `File is too large. Maximum size is ${Math.round(
      allowed.maxSizeBytes / 1024 / 1024
    )} MB.`;
  }

  return null;
}

function getAllowedMedia(mediaKind: "image" | "pdf" | "audio") {
  if (mediaKind === "pdf") {
    return {
      label: "PDF",
      maxSizeBytes: 25 * 1024 * 1024,
      contentTypes: new Set(["application/pdf"]),
    };
  }

  if (mediaKind === "audio") {
    return {
      label: "MP3, M4A, WAV, or WebM",
      maxSizeBytes: 50 * 1024 * 1024,
      contentTypes: new Set([
        "audio/mpeg",
        "audio/mp4",
        "audio/wav",
        "audio/webm",
      ]),
    };
  }

  return {
    label: "PNG, JPG, or WebP",
    maxSizeBytes: 10 * 1024 * 1024,
    contentTypes: new Set(["image/png", "image/jpeg", "image/webp"]),
  };
}

async function uploadLandingPageAsset(
  file: File
): Promise<{ readonly assetId: string }> {
  const presign = await fetchJson<ApiResponse<PresignResponse>>(
    "/api/assets/presign",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        purpose: "landing_page.media",
        contentType: file.type,
        fileSizeBytes: file.size,
      }),
    }
  );

  if (!presign.ok || !presign.data) {
    throw new Error(presign.error?.message ?? "Could not create upload URL.");
  }

  const uploadResponse = await fetch(presign.data.upload.url, {
    method: presign.data.upload.method,
    headers: presign.data.upload.headers,
    body: file,
  });

  if (!uploadResponse.ok) {
    throw new Error(`Upload failed with ${uploadResponse.status}.`);
  }

  const confirm = await fetchJson<ApiResponse<{ asset: { id: string } }>>(
    `/api/assets/${encodeURIComponent(presign.data.asset.id)}/confirm`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    }
  );

  if (!confirm.ok) {
    throw new Error(confirm.error?.message ?? "Could not confirm upload.");
  }

  return { assetId: confirm.data?.asset.id ?? presign.data.asset.id };
}

async function fetchJson<TData>(
  url: string,
  init?: RequestInit
): Promise<TData> {
  const response = await fetch(url, {
    ...init,
    headers: { Accept: "application/json", ...(init?.headers ?? {}) },
  });
  const data = (await response.json().catch(() => null)) as unknown;

  if (!response.ok) {
    throw new Error(getApiErrorMessage(data, `Request failed with ${response.status}.`));
  }

  return data as TData;
}

function getApiErrorMessage(value: unknown, fallback: string): string {
  if (!value || typeof value !== "object" || !("error" in value)) return fallback;
  const error = (value as { readonly error?: { readonly message?: unknown } }).error;

  return typeof error?.message === "string" ? error.message : fallback;
}

function toIsoDateTime(value: string): string | undefined {
  if (!value) return undefined;

  return new Date(value).toISOString();
}

function createClientId(prefix: string): string {
  if (globalThis.crypto?.randomUUID) return `${prefix}-${globalThis.crypto.randomUUID()}`;

  return `${prefix}-${Date.now()}`;
}
