"use client";

import Image from "next/image";
import Link from "next/link";
import { getSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
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
} from "@/components/landing-pages/landing-page-data";
import type { LandingPageTemplatePreset } from "@/components/landing-pages/landing-page-template-types";
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
  Dialog,
  FileUpload,
  Input,
  SegmentedControl,
  Select,
  Textarea,
} from "@/components/ui";
import type { SegmentedControlOption } from "@/components/ui";
import { cn } from "@/lib/utils";
import { withReturnTo } from "@/lib/redirects";

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

interface DynamicQRCodeOption {
  readonly id: string;
  readonly title: string;
  readonly mode: "static" | "dynamic";
  readonly status: "draft" | "published" | "archived";
  readonly slug: string | null;
  readonly destinationUrl: string | null;
  readonly landingPage?: {
    readonly id: string;
    readonly title: string;
    readonly status: LandingPageStatus;
  } | null;
}

interface LandingPageBuilderDraft {
  readonly version: 1;
  readonly type: LandingPageType;
  readonly title: string;
  readonly qrCodeId: string;
  readonly landingPageId: string;
  readonly status: LandingPageStatus;
  readonly activeTemplateKey: string;
  readonly selectedPresetKey: string;
  readonly content: LandingPageContent;
  readonly hasEditedContent: boolean;
  readonly hasEditedTitle: boolean;
}

type DynamicQRCodeLoadStatus =
  | "idle"
  | "loading"
  | "ready"
  | "unauthenticated"
  | "error";

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

const templateSearchSynonyms: Record<string, readonly string[]> = {
  admissions: ["application", "open day", "prospectus", "school", "education"],
  audio: ["podcast", "sermon", "music", "guide", "listen", "sound"],
  church: ["service", "sermon", "giving", "worship", "institution", "ministry"],
  clinic: ["healthcare", "doctor", "hospital", "appointment", "patient", "care"],
  menu: ["restaurant", "food", "cafe", "dining", "prices", "specials"],
  property: ["real estate", "listing", "home", "house", "inspection", "gallery"],
  warranty: ["product", "manual", "support", "retail", "packaging", "care guide"],
};

const defaultTemplateKey =
  defaultLandingPageTemplatePresets[0]?.key ?? "personal-profile";
const landingPageBuilderDraftStorageKey =
  "decode:landing-page-builder:draft:v1";

export function LandingPageBuilder() {
  const searchParams = useSearchParams();
  const [templates, setTemplates] = useState<readonly LandingPageTemplatePreset[]>(
    defaultLandingPageTemplatePresets
  );
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
  const [dynamicQRCodes, setDynamicQRCodes] = useState<
    readonly DynamicQRCodeOption[]
  >([]);
  const [dynamicQRCodeStatus, setDynamicQRCodeStatus] =
    useState<DynamicQRCodeLoadStatus>("idle");
  const [dynamicQRCodeError, setDynamicQRCodeError] = useState<string | null>(
    null
  );
  const [notice, setNotice] = useState<string | null>(null);
  const [isTemplateExplorerVisible, setIsTemplateExplorerVisible] = useState(true);
  const builderSectionRef = useRef<HTMLDivElement>(null);
  const builderHeadingRef = useRef<HTMLHeadingElement>(null);
  const incomingQRCodeAppliedRef = useRef(false);

  const selectedTemplate = useMemo(
    () =>
      templates.find(
        (template) => template.key === selectedPresetKey
      ) ?? defaultLandingPageTemplatePresets[0]!,
    [selectedPresetKey, templates]
  );
  const activeTemplate = useMemo(
    () =>
      templates.find(
        (template) => template.key === activeTemplateKey
      ) ?? defaultLandingPageTemplatePresets[0]!,
    [activeTemplateKey, templates]
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
    ...(!title.trim() ? ["Page title is required."] : []),
    ...(!qrCodeId.trim() ? ["Select a dynamic QR code before saving."] : []),
    ...(dynamicQRCodeStatus === "unauthenticated"
      ? ["Sign in to save landing pages."]
      : []),
    ...validationErrors,
    ...missingRequiredFields.map((item) => `${item.label} is required.`),
    ...missingRequiredAssets.map((item) => `${item.label} is required.`),
  ];
  const canSave =
    dynamicQRCodeStatus !== "unauthenticated" &&
    validationErrors.length === 0 &&
    missingRequiredFields.length === 0 &&
    missingRequiredAssets.length === 0 &&
    Boolean(title.trim()) &&
    Boolean(qrCodeId.trim()) &&
    status !== "archived";

  const createDynamicQRHref = withReturnTo(
    "/generate?mode=dynamic",
    "/landing-pages"
  );
  const signInHref = withReturnTo("/me?intent=login", "/landing-pages");

  useEffect(() => {
    const draft = readLandingPageBuilderDraft();
    if (!draft) return;

    setType(draft.type);
    setTitle(draft.title);
    setQrCodeId(draft.qrCodeId);
    setLandingPageId(draft.landingPageId);
    setStatus(draft.status);
    setActiveTemplateKey(draft.activeTemplateKey);
    setSelectedPresetKey(draft.selectedPresetKey);
    setContent(draft.content);
    setHasEditedContent(draft.hasEditedContent);
    setHasEditedTitle(draft.hasEditedTitle);
    setIsTemplateExplorerVisible(false);
    setNotice("Restored your landing page draft.");
  }, []);

  useEffect(() => {
    if (incomingQRCodeAppliedRef.current) return;

    const incomingQRCodeId = searchParams.get("qrCodeId");
    if (!incomingQRCodeId) return;

    incomingQRCodeAppliedRef.current = true;
    setQrCodeId(incomingQRCodeId);
    setIsTemplateExplorerVisible(false);
    setNotice(
      searchParams.get("qrCreated") === "1"
        ? "Dynamic QR created and attached. Review the page, then save or publish."
        : "Dynamic QR attached. Review the page, then save or publish."
    );
    window.requestAnimationFrame(() => focusBuilder());
  }, [searchParams]);

  useEffect(() => {
    let isMounted = true;

    fetchJson<
      ApiResponse<{
        readonly templates: readonly LandingPageTemplatePreset[];
        readonly source: string;
      }>
    >("/api/landing-page-templates")
      .then((response) => {
        if (!isMounted || !response.ok || !response.data) return;
        if (!isTemplatePresetArray(response.data.templates)) return;
        if (response.data.templates.length === 0) return;

        setTemplates(response.data.templates);
      })
      .catch(() => {
        // The static catalog remains available when the template backend is offline.
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    setDynamicQRCodeStatus("loading");
    setDynamicQRCodeError(null);

    getSession()
      .then((session) => {
        if (!isMounted) return null;

        if (!session?.user) {
          setDynamicQRCodes([]);
          setDynamicQRCodeStatus("unauthenticated");
          return null;
        }

        return fetchDynamicQRCodes();
      })
      .then((response) => {
        if (!response) return;
        if (!isMounted) return;

        setDynamicQRCodes(
          response.qrCodes.filter(
            (qrCode) =>
              qrCode.mode === "dynamic" && qrCode.status !== "archived"
          )
        );
        setDynamicQRCodeStatus("ready");
      })
      .catch((error) => {
        if (!isMounted) return;

        const message =
          error instanceof Error
            ? error.message
            : "Could not load dynamic QR codes.";

        setDynamicQRCodes([]);
        setDynamicQRCodeError(message);
        setDynamicQRCodeStatus(
          message.toLowerCase().includes("sign in")
            ? "unauthenticated"
            : "error"
        );
      });

    return () => {
      isMounted = false;
    };
  }, []);

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
    setIsTemplateExplorerVisible(false);
    setNotice(
      mode === "preserve"
        ? `${preset.label} template loaded with shared fields preserved. Review the required checklist before publishing.`
        : `${preset.label} template loaded. Edit the content, attach a dynamic QR code, then save or publish.`
    );
    window.requestAnimationFrame(() => focusBuilder());
  };

  function focusBuilder() {
    builderSectionRef.current?.scrollIntoView({ block: "start" });
    builderHeadingRef.current?.focus({ preventScroll: true });
  }

  const persistDraftBeforeExit = () => {
    persistLandingPageBuilderDraft({
      version: 1,
      type,
      title,
      qrCodeId,
      landingPageId,
      status,
      activeTemplateKey,
      selectedPresetKey,
      content,
      hasEditedContent,
      hasEditedTitle,
    });
    setNotice("Your landing page draft is saved in this browser.");
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
      content: buildApiContent(type, content, activeTemplate.assetRequirements),
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
          method === "POST"
            ? { ...payload, qrCodeId, templateKey: activeTemplate.key }
            : payload
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
      setNotice(
        error instanceof Error
          ? `${error.message} Your edits are still on this page and have not been published.`
          : "Could not save landing page. Your edits are still on this page and have not been published."
      );
    } finally {
      setSaveState(null);
    }
  };

  return (
    <div className="space-y-6">
      {isTemplateExplorerVisible ? (
        <TemplateExplorer
          templates={templates}
          selectedPresetKey={selectedTemplate.key}
          activeTemplateKey={activeTemplate.key}
          onSelectPreset={setSelectedPresetKey}
          onUseTemplate={handleUseTemplate}
        />
      ) : (
        <ActiveTemplateSummary
          template={activeTemplate}
          onChangeTemplate={() => setIsTemplateExplorerVisible(true)}
          onFocusBuilder={focusBuilder}
        />
      )}

      <section className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(360px,520px)]">
        <div className="min-w-0 space-y-5">
          <section className="grid min-w-0 gap-4">
            <div
              ref={builderSectionRef}
              className="min-w-0 scroll-mt-24 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <h2
                    ref={builderHeadingRef}
                    tabIndex={-1}
                    className="text-lg font-semibold text-slate-950 focus:outline-none"
                  >
                    Build and attach page
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    Edit the selected template, attach it to a dynamic QR code,
                    then save a draft or publish it.
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

              <div className="mt-5 grid min-w-0 gap-4 md:grid-cols-3">
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
                <DynamicQRCodeSelector
                  qrCodes={dynamicQRCodes}
                  selectedQRCodeId={qrCodeId}
                  loadStatus={dynamicQRCodeStatus}
                  loadError={dynamicQRCodeError}
                  landingPageId={landingPageId}
                  createHref={createDynamicQRHref}
                  signInHref={signInHref}
                  onBeforeNavigate={persistDraftBeforeExit}
                  onChange={setQrCodeId}
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

            <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm font-semibold text-slate-950">
                Save checklist
              </p>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
                <ChecklistItem done={Boolean(title.trim())}>
                  Page title set
                </ChecklistItem>
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
              {dynamicQRCodeStatus === "unauthenticated" && (
                <Alert
                  className="mt-4"
                  variant="warning"
                  title="Sign in before saving"
                >
                  <div className="space-y-3">
                    <p>
                      Landing pages can only be saved or published after you
                      sign in and attach a dynamic QR code.
                    </p>
                    <Link
                      href={signInHref}
                      onClick={persistDraftBeforeExit}
                      className="inline-flex min-h-11 items-center justify-center rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-sky-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2"
                    >
                      Sign in to save
                    </Link>
                  </div>
                </Alert>
              )}
              {readinessMessages.length > 0 && (
                <Alert
                  className="mt-4"
                  variant="warning"
                  title="Missing requirements"
                >
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

          <div className="xl:hidden">
            <PreviewPanel
              heading="Mobile preview"
              description="Review the phone layout before editing the detailed fields."
              type={type}
              title={title}
              content={content}
              mode="mobile"
              templateAssets={activeTemplate.assetRequirements}
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
            templateAssets={activeTemplate.assetRequirements}
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
  templateAssets,
  modeControl,
}: {
  readonly heading: string;
  readonly description: string;
  readonly type: LandingPageType;
  readonly title: string;
  readonly content: LandingPageContent;
  readonly mode: PreviewMode;
  readonly templateAssets?: LandingPageTemplatePreset["assetRequirements"];
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
      <LandingPagePreview
        type={type}
        title={title}
        content={content}
        mode={mode}
        templateAssets={templateAssets}
      />
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
  return (
    <Dialog
      open
      title="Keep your edited content?"
      description={`You have edited the active ${currentTemplate.label} page. Switching to ${nextTemplate.label} can keep shared fields like links, contact details, and uploaded assets, or replace the page with the new template defaults.`}
      onClose={onCancel}
    >
      <div className="grid gap-2 sm:grid-cols-3">
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
    </Dialog>
  );
}

function ActiveTemplateSummary({
  template,
  onChangeTemplate,
  onFocusBuilder,
}: {
  readonly template: LandingPageTemplatePreset;
  readonly onChangeTemplate: () => void;
  readonly onFocusBuilder: () => void;
}) {
  const Icon = templateIcons[template.type];

  return (
    <section className="rounded-xl border border-sky-200 bg-sky-50/70 p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-white text-sky-700 shadow-sm ring-1 ring-sky-100">
            <Icon className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold uppercase text-sky-800">
              Editing template
            </p>
            <h2 className="mt-0.5 text-lg font-semibold text-slate-950">
              {template.label}
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              The template library is hidden while this page is in edit mode.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={onFocusBuilder}>
            Continue editing
          </Button>
          <Button variant="secondary" onClick={onChangeTemplate}>
            Change template
          </Button>
        </div>
      </div>
    </section>
  );
}

function DynamicQRCodeSelector({
  qrCodes,
  selectedQRCodeId,
  loadStatus,
  loadError,
  landingPageId,
  createHref,
  signInHref,
  onBeforeNavigate,
  onChange,
}: {
  readonly qrCodes: readonly DynamicQRCodeOption[];
  readonly selectedQRCodeId: string;
  readonly loadStatus: DynamicQRCodeLoadStatus;
  readonly loadError: string | null;
  readonly landingPageId: string;
  readonly createHref: string;
  readonly signInHref: string;
  readonly onBeforeNavigate: () => void;
  readonly onChange: (qrCodeId: string) => void;
}) {
  const selectedQRCodeLoaded = qrCodes.some(
    (qrCode) => qrCode.id === selectedQRCodeId
  );
  const hint = getDynamicQRCodeSelectorHint({
    count: qrCodes.length,
    loadStatus,
  });

  return (
    <div className="min-w-0 space-y-3 md:col-span-2">
      <Select
        label="Dynamic QR code"
        value={selectedQRCodeId}
        onChange={(event) => onChange(event.target.value)}
        disabled={loadStatus === "loading" || loadStatus === "unauthenticated"}
        hint={hint}
        error={loadStatus === "error" ? loadError ?? undefined : undefined}
      >
        <option value="">Select a dynamic QR code</option>
        {selectedQRCodeId && !selectedQRCodeLoaded && (
          <option value={selectedQRCodeId}>
            Selected dynamic QR ({selectedQRCodeId})
          </option>
        )}
        {qrCodes.map((qrCode) => {
          const attachedElsewhere = Boolean(
            qrCode.landingPage?.id && qrCode.landingPage.id !== landingPageId
          );

          return (
            <option
              key={qrCode.id}
              value={qrCode.id}
              disabled={attachedElsewhere}
            >
              {formatDynamicQRCodeOptionLabel(qrCode, attachedElsewhere)}
            </option>
          );
        })}
      </Select>
      <div className="flex flex-wrap gap-2">
        <Link
          href={createHref}
          onClick={onBeforeNavigate}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-sky-300 hover:bg-sky-50 hover:text-sky-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Create dynamic QR
        </Link>
        {loadStatus === "unauthenticated" && (
          <Link
            href={signInHref}
            onClick={onBeforeNavigate}
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-sky-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-sky-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2"
          >
            Sign in
          </Link>
        )}
      </div>
    </div>
  );
}

function getDynamicQRCodeSelectorHint({
  count,
  loadStatus,
}: {
  readonly count: number;
  readonly loadStatus: DynamicQRCodeLoadStatus;
}) {
  if (loadStatus === "loading") return "Loading saved dynamic QR codes.";
  if (loadStatus === "unauthenticated") {
    return "Sign in to load and attach dynamic QR codes.";
  }
  if (loadStatus === "error") {
    return "Refresh the page or create a new dynamic QR code.";
  }
  if (count === 0) {
    return "Create a dynamic QR code before publishing a landing page.";
  }

  return "Only dynamic QR codes without another landing page can be selected.";
}

function formatDynamicQRCodeOptionLabel(
  qrCode: DynamicQRCodeOption,
  attachedElsewhere: boolean
) {
  const suffix = attachedElsewhere
    ? ` - attached to ${qrCode.landingPage?.title ?? "another landing page"}`
    : qrCode.slug
      ? ` - /${qrCode.slug}`
      : "";

  return `${qrCode.title}${suffix}`;
}

function TemplateExplorer({
  templates,
  selectedPresetKey,
  activeTemplateKey,
  onSelectPreset,
  onUseTemplate,
}: {
  readonly templates: readonly LandingPageTemplatePreset[];
  readonly selectedPresetKey: string;
  readonly activeTemplateKey: string;
  readonly onSelectPreset: (key: string) => void;
  readonly onUseTemplate: (preset: LandingPageTemplatePreset) => void;
}) {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 180);

  const filteredTemplates = useMemo(
    () => getRankedTemplateMatches({ templates, query: debouncedQuery }),
    [debouncedQuery, templates]
  );

  const selectedTemplate =
    templates.find(
      (template) => template.key === selectedPresetKey
    ) ??
    filteredTemplates[0] ??
    defaultLandingPageTemplatePresets[0]!;

  return (
    <section className="min-w-0 rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
      <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-4">
          <div className="sticky top-16 z-20 bg-white/95 pb-2 backdrop-blur supports-[backdrop-filter]:bg-white/85">
            <Input
              aria-label="Search templates"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search templates"
              leftIcon={<Search className="h-4 w-4" aria-hidden="true" />}
              className="min-h-11 rounded-md shadow-none"
            />
          </div>

          {filteredTemplates.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5 text-sm leading-6 text-slate-600">
              No templates match that search. Try school, restaurant, hotel,
              coupon, event, PDF, clinic, or property.
            </div>
          ) : (
            <div className="grid min-w-0 grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-[repeat(auto-fit,minmax(220px,1fr))]">
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
          className="lg:sticky lg:top-20 lg:max-h-[calc(100vh-5.5rem)] lg:self-start lg:overflow-y-auto"
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
  const assetBadges = getTemplateAssetBadges(template);

  return (
    <article
      data-template-card
      data-template-key={template.key}
      className={cn(
        "flex min-w-0 flex-col rounded-lg border p-3 transition-colors",
        isSelected
          ? "border-sky-400 bg-sky-50 text-sky-950 shadow-sm"
          : "border-slate-200 bg-white text-slate-700 hover:border-sky-300 hover:bg-sky-50"
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={isSelected}
        className="flex min-w-0 flex-1 flex-col rounded-lg text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2"
      >
        <span
          data-template-thumbnail
          className={cn(
            "relative flex aspect-[8/5] w-full min-w-0 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br ring-1 ring-inset ring-slate-200",
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
              priority={isSelected}
              sizes="(min-width: 1280px) 260px, (min-width: 768px) 45vw, 92vw"
              className="object-cover"
            />
          ) : (
            <span className="grid h-16 w-16 place-items-center rounded-2xl bg-white/90 shadow-sm ring-1 ring-slate-200">
              <Icon className="h-7 w-7" aria-hidden="true" />
            </span>
          )}
        </span>
        <span className="mt-2.5 flex min-w-0 items-start justify-between gap-2">
          <span className="min-w-0">
            <span
              data-template-label
              className="block text-sm font-semibold leading-5 text-slate-950"
            >
              {template.label}
            </span>
            <span className="mt-0.5 block text-xs text-slate-600">
              {landingPageTypeLabels[template.type]}
            </span>
          </span>
          {isActiveTemplate && (
            <span className="shrink-0 rounded-full bg-white px-2 py-1 text-[11px] font-bold text-sky-800 ring-1 ring-sky-200">
              Active
            </span>
          )}
        </span>
        <span className="mt-1.5 line-clamp-2 block text-xs leading-5 text-slate-600">
          {template.description}
        </span>
        <span className="mt-2 flex flex-wrap gap-1.5">
          {assetBadges.slice(0, 3).map((badge) => (
            <span
              key={`${template.key}-asset-${badge}`}
              className="rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-semibold text-slate-600 ring-1 ring-slate-200"
            >
              {badge}
            </span>
          ))}
          {assetBadges.length > 3 && (
            <span className="rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-semibold text-slate-600 ring-1 ring-slate-200">
              +{assetBadges.length - 3}
            </span>
          )}
        </span>
      </button>

      {template.flags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {template.flags.map((flag) => (
            <span
              key={`${template.key}-flag-${flag}`}
              className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500 ring-1 ring-slate-200"
            >
              {flag}
            </span>
          ))}
        </div>
      )}
      <Button
        className="mt-2 w-full"
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
  className,
}: {
  readonly template: LandingPageTemplatePreset;
  readonly onUseTemplate: () => void;
  readonly className?: string;
}) {
  const Icon = templateIcons[template.type];
  const requiredAssets = template.assetRequirements.filter((asset) => asset.required);
  const optionalAssets = template.assetRequirements.filter((asset) => !asset.required);
  const firstPartyAssetCount = template.assetRequirements.filter(
    (asset) => asset.assetPath
  ).length;

  return (
    <aside
      className={cn(
        "min-w-0 rounded-xl border border-sky-200 bg-sky-50/60 p-4",
        className
      )}
      aria-label={`Selected template: ${template.label}`}
    >
      <div className="flex flex-col gap-4">
        {template.mobilePreview.assetPath && (
          <figure className="max-h-80 overflow-hidden rounded-lg border border-sky-100 bg-white shadow-sm">
            <div className="relative aspect-[390/844] w-full">
              <Image
                src={template.mobilePreview.assetPath}
                alt={template.mobilePreview.alt}
                fill
                priority
                sizes="(min-width: 1024px) 320px, 92vw"
                className="object-cover"
              />
            </div>
          </figure>
        )}

        <div className="flex min-w-0 items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-white text-sky-700 shadow-sm ring-1 ring-slate-200">
            <Icon className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-base font-semibold text-slate-950">
              {template.label}
            </p>
            <p className="mt-0.5 text-sm leading-5 text-slate-600">
              {template.description}
            </p>
          </div>
        </div>

        <dl className="grid min-w-0 gap-1.5 text-sm">
          <div>
            <dt className="inline font-semibold text-slate-700">Type: </dt>
            <dd className="inline text-slate-600">
              {landingPageTypeLabels[template.type]}
            </dd>
          </div>
          <div className="min-w-0">
            <dt className="inline font-semibold text-slate-700">Best for: </dt>
            <dd className="inline text-slate-600">{template.recommendedFor}</dd>
          </div>
          {template.assetRequirements.length > 0 && (
            <div>
              <dt className="inline font-semibold text-slate-700">Media: </dt>
              <dd className="inline text-slate-600">
                {template.assetRequirements.map((a) => a.label).join(", ")}
              </dd>
            </div>
          )}
          <div>
            <dt className="inline font-semibold text-slate-700">Assets: </dt>
            <dd className="inline text-slate-600">
              {firstPartyAssetCount > 0
                ? `${firstPartyAssetCount} first-party asset${
                    firstPartyAssetCount === 1 ? "" : "s"
                  } wired`
                : "No first-party asset required"}
            </dd>
          </div>
        </dl>

        <TemplateBadgeGroup
          title="Required fields"
          items={template.requiredFields}
          variant="info"
        />
        <TemplateBadgeGroup
          title="Required assets"
          items={requiredAssets.map((asset) => asset.label)}
          variant="warning"
        />
        <TemplateBadgeGroup
          title="Optional assets"
          items={optionalAssets.map((asset) => asset.label)}
        />

        <p className="rounded-lg bg-white/80 p-3 text-xs leading-5 text-slate-600 ring-1 ring-sky-100">
          {template.accessibilityNotes}
        </p>

      </div>

      {template.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {template.tags.slice(0, 8).map((tag) => (
            <span
              key={`${template.key}-${tag}`}
              className="rounded-full bg-white px-2 py-0.5 text-xs text-slate-500 ring-1 ring-slate-200"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="sticky bottom-0 -mx-4 -mb-4 mt-4 border-t border-sky-200 bg-sky-50/95 p-4 backdrop-blur">
        <Button className="w-full" variant="primary" onClick={onUseTemplate}>
          Use template
        </Button>
      </div>
    </aside>
  );
}

function TemplateBadgeGroup({
  title,
  items,
  variant = "neutral",
}: {
  readonly title: string;
  readonly items: readonly string[];
  readonly variant?: "neutral" | "info" | "success" | "warning" | "danger";
}) {
  if (items.length === 0) return null;

  return (
    <div>
      <p className="text-xs font-bold uppercase text-slate-500">{title}</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {items.map((item) => (
          <Badge key={`${title}-${item}`} variant={variant}>
            {item}
          </Badge>
        ))}
      </div>
    </div>
  );
}

function getTemplateAssetBadges(template: LandingPageTemplatePreset) {
  const labels = new Set<string>();

  labels.add(landingPageTypeLabels[template.type]);

  for (const asset of template.assetRequirements) {
    labels.add(asset.required ? asset.label : `${asset.label} optional`);
  }

  if (template.assetRequirements.some((asset) => asset.assetPath)) {
    labels.add("First-party assets");
  }

  return [...labels];
}

function getRankedTemplateMatches({
  templates,
  query,
}: {
  readonly templates: readonly LandingPageTemplatePreset[];
  readonly query: string;
}) {
  return templates
    .map((template) => ({
      template,
      score: getTemplateMatchScore({ template, query }),
    }))
    .filter((item) => item.score >= 0)
    .sort(
      (first, second) =>
        second.score - first.score ||
        first.template.sortPriority - second.template.sortPriority
    )
    .map((item) => item.template);
}

function getTemplateMatchScore({
  template,
  query,
}: {
  readonly template: LandingPageTemplatePreset;
  readonly query: string;
}) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return 0;

  const searchTerms = getTemplateSearchTerms(normalizedQuery);
  const label = template.label.toLowerCase();
  const category = template.category.replace("_", " ").toLowerCase();
  const tags = template.tags.join(" ").toLowerCase();
  const assetLabels = template.assetRequirements
    .map((asset) => `${asset.label} ${asset.kind}`)
    .join(" ")
    .toLowerCase();
  const fullText = [
    template.key,
    template.label,
    template.description,
    category,
    template.industry,
    template.type,
    template.recommendedFor,
    template.thumbnail.label,
    template.thumbnail.alt,
    assetLabels,
    ...template.requiredFields,
    ...template.optionalFields,
    ...template.tags,
  ]
    .join(" ")
    .toLowerCase();

  let score = 0;

  for (const term of searchTerms) {
    if (label === term) score += 140;
    if (label.includes(term)) score += 90;
    if (tags.includes(term)) score += 70;
    if (category.includes(term)) score += 60;
    if (assetLabels.includes(term)) score += 45;
    if (fullText.includes(term)) score += 20;
  }

  return score > 0 ? score : -1;
}

function getTemplateSearchTerms(query: string) {
  const terms = new Set<string>();
  const addTerm = (term: string) => {
    const normalized = term.trim().toLowerCase();
    if (normalized) terms.add(normalized);
  };

  addTerm(query);
  query.split(/\s+/).forEach(addTerm);

  for (const [term, synonyms] of Object.entries(templateSearchSynonyms)) {
    const matchesCanonical = query.includes(term);
    const matchesSynonym = synonyms.some((synonym) => query.includes(synonym));

    if (!matchesCanonical && !matchesSynonym) continue;
    addTerm(term);
    synonyms.forEach(addTerm);
  }

  return [...terms];
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
    done: isAssetRequirementComplete(asset, template.type, content),
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
  asset: LandingPageTemplatePreset["assetRequirements"][number],
  type: LandingPageType,
  content: LandingPageContent
) {
  if (asset.assetPath) return true;

  const { slot } = asset;

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

function isTemplatePresetArray(
  value: unknown
): value is readonly LandingPageTemplatePreset[] {
  return Array.isArray(value) && value.every(isTemplatePreset);
}

function isTemplatePreset(value: unknown): value is LandingPageTemplatePreset {
  if (!value || typeof value !== "object") return false;

  const template = value as Partial<LandingPageTemplatePreset>;

  return Boolean(
    typeof template.key === "string" &&
      isLandingPageType(template.type) &&
      typeof template.label === "string" &&
      typeof template.description === "string" &&
      typeof template.defaultTitle === "string" &&
      isRecord(template.defaultContent) &&
      Array.isArray(template.tags) &&
      template.tags.every((tag) => typeof tag === "string") &&
      Array.isArray(template.requiredFields) &&
      template.requiredFields.every((field) => typeof field === "string") &&
      Array.isArray(template.optionalFields) &&
      template.optionalFields.every((field) => typeof field === "string") &&
      Array.isArray(template.assetRequirements) &&
      template.assetRequirements.every(isTemplateAssetRequirement) &&
      isRecord(template.thumbnail) &&
      typeof template.thumbnail.label === "string" &&
      typeof template.thumbnail.alt === "string" &&
      isRecord(template.mobilePreview) &&
      typeof template.mobilePreview.alt === "string"
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isTemplateAssetRequirement(value: unknown) {
  if (!isRecord(value)) return false;

  return (
    typeof value.slot === "string" &&
    typeof value.label === "string" &&
    typeof value.kind === "string" &&
    typeof value.required === "boolean"
  );
}

function isLandingPageType(value: unknown): value is LandingPageType {
  return (
    value === "profile" ||
    value === "business" ||
    value === "links" ||
    value === "menu" ||
    value === "coupon" ||
    value === "event" ||
    value === "feedback" ||
    value === "pdf" ||
    value === "images" ||
    value === "video_link" ||
    value === "audio_link"
  );
}

function isDynamicQRCodeOption(value: unknown): value is DynamicQRCodeOption {
  if (!value || typeof value !== "object") return false;

  const qrCode = value as Partial<DynamicQRCodeOption>;

  return Boolean(
    typeof qrCode.id === "string" &&
      typeof qrCode.title === "string" &&
      qrCode.mode === "dynamic" &&
      ["draft", "published", "archived"].includes(String(qrCode.status))
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

function buildApiContent(
  type: LandingPageType,
  content: LandingPageContent,
  templateAssets: LandingPageTemplatePreset["assetRequirements"] = []
) {
  const templateMedia = getFirstPartyTemplateMediaFields(templateAssets);

  if (type === "profile") {
    return {
      displayName: content.displayName,
      headline: content.headline,
      bio: content.bio,
      ...getApiMediaAssetFields({
        asset: content.avatar,
        assetIdKey: "avatarAssetId",
        assetPathKey: "avatarAssetPath",
        fallbackAssetPath: getFirstPartyTemplateAssetPath(templateAssets, "avatar"),
      }),
      links: buildLinks(content.links),
      ...templateMedia,
    };
  }

  if (type === "business") {
    return {
      businessName: content.businessName,
      tagline: content.tagline,
      description: content.description,
      ...getApiMediaAssetFields({
        asset: content.logo,
        assetIdKey: "logoAssetId",
        assetPathKey: "logoAssetPath",
        fallbackAssetPath: getFirstPartyTemplateAssetPath(templateAssets, "logo"),
      }),
      phone: content.phone,
      email: content.email,
      website: content.website,
      address: content.address,
      links: buildLinks(content.links),
      ...templateMedia,
    };
  }

  if (type === "links") {
    return {
      heading: content.heading,
      description: content.description,
      links: buildLinks(content.links),
      ...templateMedia,
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
      ...templateMedia,
    };
  }

  if (type === "coupon") {
    return {
      headline: content.couponHeadline,
      code: content.couponCode,
      details: content.couponDetails,
      expiresAt: toIsoDateTime(content.expiresAt),
      redemptionUrl: content.redemptionUrl || undefined,
      ...templateMedia,
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
      ...templateMedia,
    };
  }

  if (type === "feedback") {
    return {
      heading: content.heading,
      description: content.description,
      formUrl: content.formUrl,
      ...templateMedia,
    };
  }

  if (type === "pdf") {
    return {
      title: content.pdfTitle,
      description: content.description,
      ...getApiMediaAssetFields({
        asset: content.pdf,
        assetIdKey: "pdfAssetId",
        assetPathKey: "pdfAssetPath",
        fallbackAssetPath:
          getFirstPartyTemplateAssetPath(templateAssets, "pdf") ??
          getFirstPartyTemplateAssetPath(templateAssets, "document"),
      }),
      ...templateMedia,
    };
  }

  if (type === "images") {
    return {
      title: content.heading,
      description: content.description,
      images: content.images.map(getApiImageReference),
      ...templateMedia,
    };
  }

  if (type === "video_link") {
    return {
      title: content.videoTitle,
      description: content.description,
      videoUrl: content.videoUrl,
      ...templateMedia,
    };
  }

  return {
    title: content.audioTitle,
    description: content.description,
    audioUrl: content.audioUrl || undefined,
    ...getApiMediaAssetFields({
      asset: content.audio,
      assetIdKey: "audioAssetId",
      assetPathKey: "audioAssetPath",
      fallbackAssetPath: getFirstPartyTemplateAssetPath(templateAssets, "audio"),
    }),
    ...templateMedia,
  };
}

function getApiImageReference(image: LandingPageImage) {
  const assetPath = getTrustedTemplateAssetPath(image.previewUrl);

  return assetPath
    ? {
        assetPath,
        alt: image.alt,
        caption: image.caption,
      }
    : {
        assetId: image.assetId,
        alt: image.alt,
        caption: image.caption,
      };
}

function getApiMediaAssetFields({
  asset,
  assetIdKey,
  assetPathKey,
  fallbackAssetPath,
}: {
  readonly asset?: LandingPageMediaAsset;
  readonly assetIdKey: string;
  readonly assetPathKey: string;
  readonly fallbackAssetPath?: string;
}) {
  const assetPath = getTrustedTemplateAssetPath(asset?.previewUrl) ?? fallbackAssetPath;

  if (assetPath) {
    return { [assetPathKey]: assetPath };
  }

  return asset?.assetId ? { [assetIdKey]: asset.assetId } : {};
}

function getFirstPartyTemplateMediaFields(
  templateAssets: LandingPageTemplatePreset["assetRequirements"]
) {
  const heroAsset = templateAssets.find(
    (asset) => asset.slot === "hero" && asset.assetPath
  );

  if (!heroAsset?.assetPath) return {};

  return {
    heroAssetPath: heroAsset.assetPath,
    heroAlt: heroAsset.alt,
    heroWidth: heroAsset.width,
    heroHeight: heroAsset.height,
  };
}

function getFirstPartyTemplateAssetPath(
  templateAssets: LandingPageTemplatePreset["assetRequirements"],
  slot: LandingPageTemplatePreset["assetRequirements"][number]["slot"]
) {
  return getTrustedTemplateAssetPath(
    templateAssets.find((asset) => asset.slot === slot)?.assetPath
  );
}

function getTrustedTemplateAssetPath(value: string | undefined): string | undefined {
  if (!value) return undefined;

  return /^\/assets\/landing-page-templates\/[a-z0-9/_-]+\.(?:png|jpe?g|webp|svg|pdf|mp3|m4a|wav|webm)$/i.test(
    value
  )
    ? value
    : undefined;
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

async function fetchDynamicQRCodes(): Promise<{
  readonly qrCodes: readonly DynamicQRCodeOption[];
}> {
  const response = await fetchJson<
    ApiResponse<{ readonly qrCodes: readonly unknown[] }>
  >("/api/qr-codes?take=100");

  if (!response.ok || !response.data) {
    throw new Error(response.error?.message ?? "Could not load dynamic QR codes.");
  }

  const qrCodes = Array.isArray(response.data.qrCodes)
    ? response.data.qrCodes
    : [];

  return {
    qrCodes: qrCodes.filter(isDynamicQRCodeOption),
  };
}

function persistLandingPageBuilderDraft(draft: LandingPageBuilderDraft): void {
  try {
    window.localStorage.setItem(
      landingPageBuilderDraftStorageKey,
      JSON.stringify(draft)
    );
  } catch {
    // The user can still continue manually if storage is unavailable.
  }
}

function readLandingPageBuilderDraft(): LandingPageBuilderDraft | null {
  try {
    const rawDraft = window.localStorage.getItem(landingPageBuilderDraftStorageKey);
    if (!rawDraft) return null;

    const draft = JSON.parse(rawDraft) as unknown;
    if (!isLandingPageBuilderDraft(draft)) return null;

    window.localStorage.removeItem(landingPageBuilderDraftStorageKey);
    return draft;
  } catch {
    return null;
  }
}

function isLandingPageBuilderDraft(
  value: unknown
): value is LandingPageBuilderDraft {
  if (!isRecord(value)) return false;

  return (
    value.version === 1 &&
    isLandingPageType(value.type) &&
    typeof value.title === "string" &&
    typeof value.qrCodeId === "string" &&
    typeof value.landingPageId === "string" &&
    isLandingPageStatus(value.status) &&
    typeof value.activeTemplateKey === "string" &&
    typeof value.selectedPresetKey === "string" &&
    isRecord(value.content) &&
    typeof value.hasEditedContent === "boolean" &&
    typeof value.hasEditedTitle === "boolean"
  );
}

function isLandingPageStatus(value: unknown): value is LandingPageStatus {
  return value === "draft" || value === "published" || value === "archived";
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
