"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
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
  Search,
  TicketPercent,
  Trash2,
  UploadCloud,
  User,
  Utensils,
  Video,
} from "lucide-react";
import { LandingPagePreview } from "@/components/landing-pages/LandingPagePreview";
import {
  defaultLandingPageTemplatePresets,
  initialLandingPageContent,
  templateCategoryOptions,
} from "@/components/landing-pages/landing-page-data";
import type {
  LandingPageTemplateAssetKind,
  LandingPageTemplateCategory,
  LandingPageTemplateFlag,
  LandingPageTemplatePreset,
} from "@/components/landing-pages/landing-page-template-types";
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

interface ReadinessItem {
  readonly id: string;
  readonly label: string;
  readonly done: boolean;
  readonly required: boolean;
}

type MutablePartial<T> = {
  -readonly [K in keyof T]?: T[K];
};

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

type TemplateCategoryFilter = "all" | LandingPageTemplateCategory;
type TemplatePageTypeFilter = "all" | LandingPageType;
type TemplateAssetKindFilter = "all" | LandingPageTemplateAssetKind;
type TemplateFlagFilter = "all" | LandingPageTemplateFlag;

interface TemplateFilters {
  readonly category: TemplateCategoryFilter;
  readonly pageType: TemplatePageTypeFilter;
  readonly assetKind: TemplateAssetKindFilter;
  readonly flag: TemplateFlagFilter;
}

const defaultTemplateFilters: TemplateFilters = {
  category: "all",
  pageType: "all",
  assetKind: "all",
  flag: "all",
};

const landingPageTypeLabels: Record<LandingPageType, string> = {
  profile: "Profile",
  business: "Business",
  links: "Links",
  menu: "Menu",
  coupon: "Coupon",
  event: "Event",
  feedback: "Feedback",
  pdf: "PDF",
  images: "Images",
  video_link: "Video link",
  audio_link: "Audio link",
};

const assetKindLabels: Record<LandingPageTemplateAssetKind, string> = {
  image: "Images",
  pdf: "PDF",
  audio: "Audio",
};

const templateFlagLabels: Record<LandingPageTemplateFlag, string> = {
  popular: "Popular",
  new: "New",
};

const thumbnailToneClasses: Record<
  LandingPageTemplatePreset["thumbnail"]["tone"],
  string
> = {
  amber: "from-amber-50 via-white to-sky-50 text-amber-700",
  emerald: "from-emerald-50 via-white to-sky-50 text-emerald-700",
  indigo: "from-indigo-50 via-white to-sky-50 text-indigo-700",
  rose: "from-rose-50 via-white to-sky-50 text-rose-700",
  sky: "from-sky-50 via-white to-cyan-50 text-sky-700",
  slate: "from-slate-100 via-white to-sky-50 text-slate-700",
};

const defaultTemplateKey =
  defaultLandingPageTemplatePresets[0]?.key ?? "personal-profile";

export function LandingPageBuilder() {
  const [type, setType] = useState<LandingPageType>("profile");
  const [title, setTitle] = useState("Customer landing page");
  const [qrCodeId, setQrCodeId] = useState("");
  const [landingPageId, setLandingPageId] = useState("");
  const [status, setStatus] = useState<LandingPageStatus>("draft");
  const [previewMode, setPreviewMode] = useState<PreviewMode>("mobile");
  const [activeTemplateKey, setActiveTemplateKey] = useState(defaultTemplateKey);
  const [selectedPresetKey, setSelectedPresetKey] = useState(defaultTemplateKey);
  const [content, setContent] = useState<LandingPageContent>(
    initialLandingPageContent
  );
  const [hasEditedContent, setHasEditedContent] = useState(false);
  const [hasEditedTitle, setHasEditedTitle] = useState(false);
  const [pendingTemplate, setPendingTemplate] =
    useState<LandingPageTemplatePreset | null>(null);
  const [uploadState, setUploadState] = useState<UploadState | null>(null);
  const [saveState, setSaveState] = useState<UploadState | null>(null);
  const [notice, setNotice] = useState<string | null>(
    "Choose a template, validate the content, then save a draft or publish. Published pages remain editable."
  );

  const selectedTemplate = useMemo(
    () =>
      defaultLandingPageTemplatePresets.find(
        (template) => template.key === selectedPresetKey
      ) ?? defaultLandingPageTemplatePresets[0]!,
    [selectedPresetKey]
  );
  const activeTemplate = useMemo(
    () =>
      defaultLandingPageTemplatePresets.find(
        (template) => template.key === activeTemplateKey
      ) ?? defaultLandingPageTemplatePresets[0]!,
    [activeTemplateKey]
  );
  const validationErrors = useMemo(
    () => validateContent(type, content),
    [type, content]
  );
  const requiredFieldStatuses = useMemo(
    () => getRequiredFieldStatuses(activeTemplate, title, content),
    [activeTemplate, title, content]
  );
  const requiredAssetStatuses = useMemo(
    () => getRequiredAssetStatuses(activeTemplate, content),
    [activeTemplate, content]
  );
  const missingRequiredFields = requiredFieldStatuses.filter(
    (item) => !item.done
  );
  const missingRequiredAssets = requiredAssetStatuses.filter(
    (item) => item.required && !item.done
  );
  const readinessMessages = [
    ...validationErrors,
    ...missingRequiredAssets.map((item) => `${item.label} is required.`),
  ];
  const canSave =
    validationErrors.length === 0 &&
    missingRequiredFields.length === 0 &&
    missingRequiredAssets.length === 0 &&
    Boolean(title.trim()) &&
    Boolean(qrCodeId.trim()) &&
    status !== "archived";

  const handleFieldChange = (key: keyof LandingPageContent, value: string) => {
    setHasEditedContent(true);
    setContent((previous) => ({ ...previous, [key]: value }));
  };

  const handleContentChange = (nextContent: LandingPageContent) => {
    setHasEditedContent(true);
    setContent(nextContent);
  };

  const applyTemplate = (
    preset: LandingPageTemplatePreset,
    mode: "replace" | "preserve"
  ) => {
    setActiveTemplateKey(preset.key);
    setSelectedPresetKey(preset.key);
    setType(preset.type);
    setTitle((previousTitle) =>
      mode === "preserve" && hasEditedTitle && previousTitle.trim()
        ? previousTitle
        : preset.defaultTitle
    );
    setContent((previousContent) =>
      mode === "preserve"
        ? createPreservedTemplateContent({
            preset,
            previousContent,
            previousType: type,
          })
        : createTemplateContent(preset)
    );
    setHasEditedContent(false);
    setHasEditedTitle(false);
    setPendingTemplate(null);
    setNotice(
      mode === "preserve"
        ? `${preset.label} template loaded with shared fields preserved. Review the required checklist before publishing.`
        : `${preset.label} template loaded. Edit the content, attach a dynamic QR code, then save or publish.`
    );
  };

  const handleUseTemplate = (preset: LandingPageTemplatePreset) => {
    if (hasEditedContent) {
      setPendingTemplate(preset);
      return;
    }

    applyTemplate(preset, "replace");
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

      setHasEditedContent(true);
      setContent((previous) => applyUploadedAsset(previous, slot, mediaAsset));
      setNotice(`Uploaded ${file.name} through the landing-page media flow.`);
    } catch (error) {
      const mediaAsset: LandingPageMediaAsset = {
        assetId: `preview-${Date.now()}`,
        previewUrl: URL.createObjectURL(file),
        fileName: file.name,
        contentType: file.type,
      };

      setHasEditedContent(true);
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
              <Badge variant="info">{activeTemplate.label}</Badge>
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
              onChange={(event) => {
                setHasEditedContent(true);
                setHasEditedTitle(true);
                setTitle(event.target.value);
              }}
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
            <ChecklistItem done={status !== "archived"}>
              Page remains editable
            </ChecklistItem>
          </ul>
          <ReadinessChecklist
            title="Required fields"
            items={requiredFieldStatuses}
          />
          <ReadinessChecklist
            title="Required assets"
            items={requiredAssetStatuses}
            emptyLabel="No assets required for this template."
          />
          {readinessMessages.length > 0 && (
            <Alert className="mt-4" variant="warning" title="Missing requirements">
              {readinessMessages.join(" ")}
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
          <TemplatePicker
            selectedPresetKey={selectedTemplate.key}
            activeTemplateKey={activeTemplate.key}
            onSelectPreset={setSelectedPresetKey}
            onUseTemplate={handleUseTemplate}
          />
          <div className="xl:hidden">
            <PreviewPanel
              heading="Mobile preview"
              description="Review the phone layout before editing the detailed fields."
              type={type}
              title={title}
              content={content}
              mode="mobile"
            />
          </div>
          <ContentEditor
            type={type}
            content={content}
            uploadState={uploadState}
            onFieldChange={handleFieldChange}
            onContentChange={handleContentChange}
            onUpload={handleUpload}
          />
        </div>

        <aside className="hidden space-y-4 xl:sticky xl:top-24 xl:block xl:self-start">
          <PreviewPanel
            heading="Live preview"
            description="Checks mobile and desktop page fit before publishing."
            type={type}
            title={title}
            content={content}
            mode={previewMode}
            modeControl={
              <SegmentedControl
                value={previewMode}
                options={previewOptions}
                onChange={setPreviewMode}
                label="Preview mode"
                columns={2}
              />
            }
          />
        </aside>
      </section>

      {pendingTemplate && (
        <TemplateSwitchDialog
          currentTemplate={activeTemplate}
          nextTemplate={pendingTemplate}
          onCancel={() => setPendingTemplate(null)}
          onPreserve={() => applyTemplate(pendingTemplate, "preserve")}
          onReplace={() => applyTemplate(pendingTemplate, "replace")}
        />
      )}
    </div>
  );
}

function PreviewPanel({
  heading,
  description,
  type,
  title,
  content,
  mode,
  modeControl,
}: {
  readonly heading: string;
  readonly description: string;
  readonly type: LandingPageType;
  readonly title: string;
  readonly content: LandingPageContent;
  readonly mode: PreviewMode;
  readonly modeControl?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">{heading}</h2>
          <p className="text-sm leading-6 text-slate-600">{description}</p>
        </div>
        {modeControl && <div className="w-full sm:w-64">{modeControl}</div>}
      </div>
      <LandingPagePreview type={type} title={title} content={content} mode={mode} />
    </div>
  );
}

function TemplateSwitchDialog({
  currentTemplate,
  nextTemplate,
  onCancel,
  onPreserve,
  onReplace,
}: {
  readonly currentTemplate: LandingPageTemplatePreset;
  readonly nextTemplate: LandingPageTemplatePreset;
  readonly onCancel: () => void;
  readonly onPreserve: () => void;
  readonly onReplace: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dialogRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCancel();
        return;
      }
      if (event.key !== "Tab") return;

      const focusableElements = Array.from(
        dialogRef.current?.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        ) ?? []
      ).filter((element) => !element.hasAttribute("disabled"));

      if (focusableElements.length === 0) return;

      const firstElement = focusableElements.at(0);
      const lastElement = focusableElements.at(-1);
      if (!firstElement || !lastElement) return;

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onCancel]);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="template-switch-title"
        aria-describedby="template-switch-description"
        tabIndex={-1}
        className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-5 shadow-xl focus:outline-none"
      >
        <p className="text-xs font-bold uppercase text-sky-700">
          Template switch
        </p>
        <h2
          id="template-switch-title"
          className="mt-2 text-xl font-semibold text-slate-950"
        >
          Keep your edited content?
        </h2>
        <p
          id="template-switch-description"
          className="mt-3 text-sm leading-6 text-slate-600"
        >
          You have edited the active {currentTemplate.label} page. Switching to
          {` ${nextTemplate.label} `}can keep shared fields like links,
          contact details, and uploaded assets, or replace the page with the
          new template defaults.
        </p>
        <div className="mt-5 grid gap-2 sm:grid-cols-3">
          <Button variant="primary" onClick={onPreserve}>
            Keep shared fields
          </Button>
          <Button variant="danger" onClick={onReplace}>
            Replace defaults
          </Button>
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}

function TemplatePicker({
  selectedPresetKey,
  activeTemplateKey,
  onSelectPreset,
  onUseTemplate,
}: {
  readonly selectedPresetKey: string;
  readonly activeTemplateKey: string;
  readonly onSelectPreset: (key: string) => void;
  readonly onUseTemplate: (preset: LandingPageTemplatePreset) => void;
}) {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<TemplateFilters>(defaultTemplateFilters);
  const debouncedQuery = useDebouncedValue(query, 180);

  const categoryCounts = useMemo(() => {
    const counts = new Map<TemplateCategoryFilter, number>([
      ["all", defaultLandingPageTemplatePresets.length],
    ]);

    for (const template of defaultLandingPageTemplatePresets) {
      counts.set(template.category, (counts.get(template.category) ?? 0) + 1);
    }

    return counts;
  }, []);

  const pageTypeOptions = useMemo(() => {
    const uniqueTypes = Array.from(
      new Set(defaultLandingPageTemplatePresets.map((template) => template.type))
    );

    return uniqueTypes.map((value) => ({
      value,
      label: landingPageTypeLabels[value],
    }));
  }, []);

  const filteredTemplates = useMemo(
    () =>
      defaultLandingPageTemplatePresets.filter((template) =>
        matchesTemplateFilter({ template, query: debouncedQuery, filters })
      ),
    [debouncedQuery, filters]
  );

  const selectedTemplate =
    defaultLandingPageTemplatePresets.find(
      (template) => template.key === selectedPresetKey
    ) ??
    filteredTemplates[0] ??
    defaultLandingPageTemplatePresets[0]!;
  const activeFilters = getActiveTemplateFilterChips({
    query,
    filters,
  });
  const hasActiveFilters = activeFilters.length > 0;
  const handleFilterChange = <TFilter extends keyof TemplateFilters>(
    key: TFilter,
    value: TemplateFilters[TFilter]
  ) => {
    setFilters((previous) => ({ ...previous, [key]: value }));
  };
  const handleClearFilters = () => {
    setQuery("");
    setFilters(defaultTemplateFilters);
  };
  const handleRemoveFilter = (filterKey: string) => {
    if (filterKey === "query") {
      setQuery("");
      return;
    }

    if (filterKey in defaultTemplateFilters) {
      setFilters((previous) => ({
        ...previous,
        [filterKey]: defaultTemplateFilters[filterKey as keyof TemplateFilters],
      }));
    }
  };

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">
            Choose a template
          </h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Search by industry or use case, then load a professional preset
            into the builder.
          </p>
        </div>
        <Badge variant="info">{defaultLandingPageTemplatePresets.length} presets</Badge>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-4">
          <Input
            label="Search templates"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search school, restaurant, hotel, coupon, event, PDF"
            leftIcon={<Search className="h-4 w-4" aria-hidden="true" />}
          />

          <div
            className="flex gap-2 overflow-x-auto pb-1"
            role="toolbar"
            aria-label="Template categories"
          >
            {templateCategoryOptions
              .filter((option) => (categoryCounts.get(option.value) ?? 0) > 0)
              .map((option) => {
                const isSelected = filters.category === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleFilterChange("category", option.value)}
                    aria-pressed={isSelected}
                    className={cn(
                      "inline-flex min-h-11 shrink-0 items-center justify-center rounded-lg border px-3 py-2 text-sm font-semibold transition-colors",
                      isSelected
                        ? "border-sky-300 bg-sky-50 text-sky-900"
                        : "border-slate-200 bg-white text-slate-700 hover:border-sky-300 hover:bg-sky-50"
                    )}
                  >
                    {option.label}
                    <span className="ml-2 rounded-full bg-white px-2 py-0.5 text-xs text-slate-600 ring-1 ring-slate-200">
                      {categoryCounts.get(option.value)}
                    </span>
                  </button>
                );
              })}
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <Select
              label="Page type"
              value={filters.pageType}
              onChange={(event) =>
                handleFilterChange(
                  "pageType",
                  event.target.value as TemplatePageTypeFilter
                )
              }
            >
              <option value="all">All page types</option>
              {pageTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
            <Select
              label="Media"
              value={filters.assetKind}
              onChange={(event) =>
                handleFilterChange(
                  "assetKind",
                  event.target.value as TemplateAssetKindFilter
                )
              }
            >
              <option value="all">All media needs</option>
              {Object.entries(assetKindLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
            <Select
              label="Priority"
              value={filters.flag}
              onChange={(event) =>
                handleFilterChange("flag", event.target.value as TemplateFlagFilter)
              }
            >
              <option value="all">All templates</option>
              {Object.entries(templateFlagLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-600" aria-live="polite">
              {filteredTemplates.length} template
              {filteredTemplates.length === 1 ? "" : "s"} found
            </p>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                Clear filters
              </Button>
            )}
          </div>

          {hasActiveFilters && (
            <ActiveTemplateFilterChips
              filters={activeFilters}
              onRemove={handleRemoveFilter}
            />
          )}

          {filteredTemplates.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5 text-sm leading-6 text-slate-600">
              No templates match that search. Try school, restaurant, hotel,
              coupon, event, PDF, clinic, or property.
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
              {filteredTemplates.map((template) => (
                <TemplateCard
                  key={template.key}
                  template={template}
                  isSelected={template.key === selectedPresetKey}
                  isActiveTemplate={template.key === activeTemplateKey}
                  onSelect={() => onSelectPreset(template.key)}
                  onUseTemplate={() => onUseTemplate(template)}
                />
              ))}
            </div>
          )}
        </div>

        <SelectedTemplatePanel
          template={selectedTemplate}
          onUseTemplate={() => onUseTemplate(selectedTemplate)}
        />
      </div>
    </section>
  );
}

function TemplateCard({
  template,
  isSelected,
  isActiveTemplate,
  onSelect,
  onUseTemplate,
}: {
  readonly template: LandingPageTemplatePreset;
  readonly isSelected: boolean;
  readonly isActiveTemplate: boolean;
  readonly onSelect: () => void;
  readonly onUseTemplate: () => void;
}) {
  const Icon = templateIcons[template.type];
  const categoryLabel =
    templateCategoryOptions.find((item) => item.value === template.category)
      ?.label ?? template.category;

  return (
    <article
      className={cn(
        "flex min-h-[20rem] flex-col rounded-lg border p-3 transition-colors",
        isSelected
          ? "border-sky-400 bg-sky-50 text-sky-950 shadow-sm"
          : "border-slate-200 bg-white text-slate-700 hover:border-sky-300 hover:bg-sky-50"
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={isSelected}
        className="flex flex-1 flex-col rounded-lg text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2"
      >
        <span
          className={cn(
            "relative flex aspect-[8/5] w-full items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br ring-1 ring-inset ring-slate-200",
            thumbnailToneClasses[template.thumbnail.tone]
          )}
          role="img"
          aria-label={template.thumbnail.alt}
        >
          {template.thumbnail.assetPath ? (
            <Image
              src={template.thumbnail.assetPath}
              alt=""
              fill
              sizes="(min-width: 1536px) 240px, (min-width: 640px) 50vw, 100vw"
              className="object-cover"
            />
          ) : (
            <span className="grid h-16 w-16 place-items-center rounded-2xl bg-white/90 shadow-sm ring-1 ring-slate-200">
              <Icon className="h-7 w-7" aria-hidden="true" />
            </span>
          )}
        </span>
        <span className="mt-3 flex min-w-0 items-start justify-between gap-2">
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold text-slate-950">
              {template.label}
            </span>
            <span className="mt-1 block text-xs font-medium text-slate-700">
              {categoryLabel} / {template.industry}
            </span>
          </span>
          {isActiveTemplate && (
            <span className="shrink-0 rounded-full bg-white px-2 py-1 text-[11px] font-bold text-sky-800 ring-1 ring-sky-200">
              Active
            </span>
          )}
        </span>
        <span className="mt-2 line-clamp-2 block text-sm leading-6 text-slate-600">
          {template.description}
        </span>
        <span className="mt-3 block rounded-lg bg-white/75 p-2 text-xs leading-5 text-slate-600 ring-1 ring-slate-200">
          Best for: {template.recommendedFor}
        </span>
      </button>

      <div className="mt-auto flex flex-wrap gap-1.5 pt-3">
        {template.assetRequirements.slice(0, 2).map((asset) => (
          <span
            key={`${template.key}-${asset.slot}`}
            className="rounded-full bg-white px-2 py-1 text-[11px] font-semibold text-slate-600 ring-1 ring-slate-200"
          >
            {asset.label}
          </span>
        ))}
        <span className="rounded-full bg-white px-2 py-1 text-[11px] font-semibold text-slate-600 ring-1 ring-slate-200">
          {landingPageTypeLabels[template.type]}
        </span>
      </div>
      <Button
        className="mt-3 w-full"
        variant={isSelected ? "primary" : "secondary"}
        size="sm"
        onClick={onUseTemplate}
        aria-label={`Use ${template.label} template`}
      >
        Use template
      </Button>
    </article>
  );
}

function SelectedTemplatePanel({
  template,
  onUseTemplate,
}: {
  readonly template: LandingPageTemplatePreset;
  readonly onUseTemplate: () => void;
}) {
  const Icon = templateIcons[template.type];

  return (
    <aside className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-white text-sky-700 shadow-sm ring-1 ring-slate-200">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-base font-semibold text-slate-950">
            {template.label}
          </p>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            {template.description}
          </p>
        </div>
      </div>

      <dl className="mt-4 space-y-3 text-sm">
        <div>
          <dt className="font-semibold text-slate-900">Page type</dt>
          <dd className="mt-1 leading-6 text-slate-600">
            {landingPageTypeLabels[template.type]}
          </dd>
        </div>
        <div>
          <dt className="font-semibold text-slate-900">Best for</dt>
          <dd className="mt-1 leading-6 text-slate-600">
            {template.recommendedFor}
          </dd>
        </div>
        <div>
          <dt className="font-semibold text-slate-900">Required media</dt>
          <dd className="mt-2 flex flex-wrap gap-2">
            {template.assetRequirements.length > 0 ? (
              template.assetRequirements.map((asset) => (
                <Badge
                  key={`${template.key}-${asset.slot}`}
                  variant={asset.required ? "warning" : "neutral"}
                >
                  {asset.label}
                </Badge>
              ))
            ) : (
              <Badge>No media required</Badge>
            )}
          </dd>
        </div>
        <div>
          <dt className="font-semibold text-slate-900">Required fields</dt>
          <dd className="mt-2 flex flex-wrap gap-2">
            {template.requiredFields.map((field) => (
              <Badge key={`${template.key}-${field}`} variant="neutral">
                {field}
              </Badge>
            ))}
          </dd>
        </div>
        <div>
          <dt className="font-semibold text-slate-900">Accessibility</dt>
          <dd className="mt-1 leading-6 text-slate-600">
            {template.accessibilityNotes}
          </dd>
        </div>
      </dl>

      <div className="mt-4 flex flex-wrap gap-2">
        {template.tags.slice(0, 6).map((tag) => (
          <span
            key={`${template.key}-${tag}`}
            className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200"
          >
            {tag}
          </span>
        ))}
      </div>

      <Button
        className="mt-5 w-full"
        variant="primary"
        onClick={onUseTemplate}
      >
        Use template
      </Button>
    </aside>
  );
}

function matchesTemplateFilter({
  template,
  query,
  filters,
}: {
  readonly template: LandingPageTemplatePreset;
  readonly query: string;
  readonly filters: TemplateFilters;
}) {
  if (filters.category !== "all" && template.category !== filters.category) {
    return false;
  }
  if (filters.pageType !== "all" && template.type !== filters.pageType) {
    return false;
  }
  if (
    filters.assetKind !== "all" &&
    !template.assetRequirements.some((asset) => asset.kind === filters.assetKind)
  ) {
    return false;
  }
  if (filters.flag !== "all" && !template.flags.includes(filters.flag)) {
    return false;
  }

  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return true;

  return [
    template.key,
    template.label,
    template.description,
    template.category,
    template.industry,
    template.type,
    template.recommendedFor,
    template.thumbnail.label,
    template.thumbnail.alt,
    ...template.requiredFields,
    ...template.optionalFields,
    ...template.tags,
  ]
    .join(" ")
    .toLowerCase()
    .includes(normalizedQuery);
}

function ActiveTemplateFilterChips({
  filters,
  onRemove,
}: {
  readonly filters: readonly { readonly key: string; readonly label: string }[];
  readonly onRemove: (key: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2" aria-label="Active template filters">
      {filters.map((filter) => (
        <button
          key={filter.key}
          type="button"
          onClick={() => onRemove(filter.key)}
          className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-sky-300 hover:bg-sky-50 hover:text-sky-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2"
          aria-label={`Remove ${filter.label} filter`}
        >
          {filter.label}
          <span aria-hidden="true" className="text-slate-400">
            x
          </span>
        </button>
      ))}
    </div>
  );
}

function getActiveTemplateFilterChips({
  query,
  filters,
}: {
  readonly query: string;
  readonly filters: TemplateFilters;
}) {
  const activeFilters: { key: string; label: string }[] = [];
  const trimmedQuery = query.trim();

  if (trimmedQuery) activeFilters.push({ key: "query", label: trimmedQuery });
  if (filters.category !== "all") {
    activeFilters.push({
      key: "category",
      label:
        templateCategoryOptions.find((option) => option.value === filters.category)
          ?.label ?? filters.category,
    });
  }
  if (filters.pageType !== "all") {
    activeFilters.push({
      key: "pageType",
      label: landingPageTypeLabels[filters.pageType],
    });
  }
  if (filters.assetKind !== "all") {
    activeFilters.push({
      key: "assetKind",
      label: assetKindLabels[filters.assetKind],
    });
  }
  if (filters.flag !== "all") {
    activeFilters.push({
      key: "flag",
      label: templateFlagLabels[filters.flag],
    });
  }

  return activeFilters;
}

function useDebouncedValue<TValue>(value: TValue, delayMs: number): TValue {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedValue(value), delayMs);

    return () => window.clearTimeout(timeout);
  }, [delayMs, value]);

  return debouncedValue;
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

function ReadinessChecklist({
  title,
  items,
  emptyLabel,
}: {
  readonly title: string;
  readonly items: readonly ReadinessItem[];
  readonly emptyLabel?: string;
}) {
  return (
    <div className="mt-4 border-t border-slate-200 pt-4">
      <p className="text-xs font-bold uppercase text-slate-500">{title}</p>
      {items.length > 0 ? (
        <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
          {items.map((item) => (
            <li key={item.id} className="flex items-start gap-2">
              <span
                className={cn(
                  "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                  item.done
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : item.required
                      ? "border-amber-200 bg-amber-50 text-amber-700"
                      : "border-slate-200 bg-white text-slate-400"
                )}
              >
                <Check className="h-3 w-3" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-medium text-slate-700">
                  {item.label}
                </span>
                <span className="block text-xs text-slate-500">
                  {item.done ? "Ready" : item.required ? "Needed" : "Optional"}
                </span>
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm leading-6 text-slate-500">
          {emptyLabel ?? "No requirements for this template."}
        </p>
      )}
    </div>
  );
}

function createTemplateContent(
  preset: LandingPageTemplatePreset
): LandingPageContent {
  return {
    ...initialLandingPageContent,
    ...preset.defaultContent,
  };
}

function createPreservedTemplateContent({
  preset,
  previousContent,
  previousType,
}: {
  readonly preset: LandingPageTemplatePreset;
  readonly previousContent: LandingPageContent;
  readonly previousType: LandingPageType;
}): LandingPageContent {
  const nextContent = createTemplateContent(preset);

  if (previousType === preset.type) {
    return {
      ...nextContent,
      ...previousContent,
    };
  }

  const preserved: MutablePartial<LandingPageContent> = {};
  const preserveText = (key: keyof LandingPageContent) => {
    const value = previousContent[key];
    if (typeof value === "string" && value.trim()) {
      Object.assign(preserved, { [key]: value });
    }
  };
  const hasAssetRequirement = (
    slot: LandingPageTemplatePreset["assetRequirements"][number]["slot"]
  ) => preset.assetRequirements.some((asset) => asset.slot === slot);

  if (
    supportsDescription(previousType) &&
    supportsDescription(preset.type)
  ) {
    preserveText("description");
  }
  if (previousType === "business" && preset.type === "business") {
    preserveText("phone");
    preserveText("email");
    preserveText("website");
    preserveText("address");
  }
  if (supportsHeading(previousType) && supportsHeading(preset.type)) {
    preserveText("heading");
  }

  if (
    ["profile", "business", "links"].includes(previousType) &&
    ["profile", "business", "links"].includes(preset.type) &&
    previousContent.links.length > 0
  ) {
    preserved.links = previousContent.links;
  }
  if (previousType === "profile" && previousContent.avatar && hasAssetRequirement("avatar")) {
    preserved.avatar = previousContent.avatar;
  }
  if (
    previousType === "business" &&
    previousContent.logo &&
    hasAssetRequirement("logo")
  ) {
    preserved.logo = previousContent.logo;
  }
  if (
    previousType === "images" &&
    previousContent.images.length > 0 &&
    (preset.type === "images" || hasAssetRequirement("gallery"))
  ) {
    preserved.images = previousContent.images;
  }
  if (
    previousType === "pdf" &&
    previousContent.pdf &&
    (preset.type === "pdf" ||
      hasAssetRequirement("pdf") ||
      hasAssetRequirement("document"))
  ) {
    preserved.pdf = previousContent.pdf;
  }
  if (
    previousType === "audio_link" &&
    previousContent.audio &&
    (preset.type === "audio_link" || hasAssetRequirement("audio"))
  ) {
    preserved.audio = previousContent.audio;
  }

  return {
    ...nextContent,
    ...preserved,
  };
}

function supportsDescription(type: LandingPageType) {
  return [
    "audio_link",
    "business",
    "event",
    "feedback",
    "images",
    "links",
    "menu",
    "pdf",
    "video_link",
  ].includes(type);
}

function supportsHeading(type: LandingPageType) {
  return ["feedback", "images", "links"].includes(type);
}

const requiredFieldLabels: Record<string, string> = {
  audioTitle: "Audio title",
  "audioUrl or audio": "Audio URL or uploaded audio",
  businessName: "Business name",
  couponCode: "Coupon code",
  couponHeadline: "Coupon headline",
  displayName: "Display name",
  eventName: "Event name",
  formUrl: "Feedback form URL",
  heading: "Heading",
  images: "Gallery image",
  links: "At least one link",
  pdf: "Uploaded PDF",
  pdfTitle: "PDF title",
  restaurantName: "Restaurant name",
  sections: "Menu section",
  startAt: "Event start time",
  videoTitle: "Video title",
  videoUrl: "Video URL",
};

function getRequiredFieldStatuses(
  template: LandingPageTemplatePreset,
  title: string,
  content: LandingPageContent
): ReadinessItem[] {
  return template.requiredFields.map((field) => ({
    id: field,
    label: requiredFieldLabels[field] ?? toSentenceLabel(field),
    done: isRequiredFieldComplete(field, title, content),
    required: true,
  }));
}

function getRequiredAssetStatuses(
  template: LandingPageTemplatePreset,
  content: LandingPageContent
): ReadinessItem[] {
  return template.assetRequirements.map((asset) => ({
    id: `${template.key}-${asset.slot}`,
    label: asset.required ? asset.label : `${asset.label} (optional)`,
    done: isAssetRequirementComplete(asset.slot, template.type, content),
    required: asset.required,
  }));
}

function isRequiredFieldComplete(
  field: string,
  title: string,
  content: LandingPageContent
) {
  if (field === "title") return Boolean(title.trim());
  if (field === "links") return content.links.some(hasUsableLink);
  if (field === "sections") {
    return content.sections.some(
      (section) =>
        section.name.trim() &&
        section.items.some((item) => item.name.trim() || item.price.trim())
    );
  }
  if (field === "images") return content.images.length > 0;
  if (field === "pdf") return Boolean(content.pdf?.assetId);
  if (field === "audioUrl or audio") {
    return Boolean(content.audioUrl.trim() || content.audio?.assetId);
  }

  const value = content[field as keyof LandingPageContent];
  if (typeof value === "string") return Boolean(value.trim());
  if (Array.isArray(value)) return value.length > 0;
  if (value && typeof value === "object" && "assetId" in value) {
    return Boolean(value.assetId);
  }

  return Boolean(value);
}

function isAssetRequirementComplete(
  slot: LandingPageTemplatePreset["assetRequirements"][number]["slot"],
  type: LandingPageType,
  content: LandingPageContent
) {
  if (slot === "avatar") {
    return Boolean(
      content.avatar?.assetId || (type === "business" && content.logo?.assetId)
    );
  }
  if (slot === "logo") {
    return Boolean(
      content.logo?.assetId || (type === "profile" && content.avatar?.assetId)
    );
  }
  if (slot === "gallery") return content.images.length > 0;
  if (slot === "pdf" || slot === "document") return Boolean(content.pdf?.assetId);
  if (slot === "audio") return Boolean(content.audio?.assetId || content.audioUrl.trim());

  return false;
}

function hasUsableLink(link: LandingPageLink) {
  return Boolean(link.label.trim() && link.url.trim());
}

function toSentenceLabel(value: string) {
  return value
    .replace(/([A-Z])/g, " $1")
    .replace(/[_-]+/g, " ")
    .trim()
    .replace(/^./, (character) => character.toUpperCase());
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
