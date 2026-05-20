"use client";

import { useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Check,
  Copy,
  Download,
  FileDown,
  Link as LinkIcon,
  Palette,
  Rocket,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { useQRCode, type QROptions } from "@/hooks/useQRCode";
import { PageHeader } from "./PageHeader";
import {
  Alert,
  Badge,
  Button,
  ColorInput,
  ColorSwatch,
  FileUpload,
  IconButton,
  Input,
  QRPreviewPanel,
  Select,
  SegmentedControl,
  Slider,
  Stepper,
  Textarea,
} from "@/components/ui";

type WorkflowStep = "content" | "design" | "export";
type QRMode = "static" | "dynamic";
type QRType =
  | "url"
  | "text"
  | "email"
  | "phone"
  | "sms"
  | "whatsapp"
  | "wifi"
  | "vcard";
type DotStyle = "square" | "rounded" | "dots" | "classy" | "extra-rounded";
type CornerStyle = "square" | "rounded" | "dot";
type ErrorCorrectionLevel = "L" | "M" | "Q" | "H";
type FrameStyle =
  | "none"
  | "scan-me"
  | "classic"
  | "ticket"
  | "badge"
  | "minimal";

interface QRGeneratorProps {
  showHeader?: boolean;
}

interface FormState {
  title: string;
  url: string;
  text: string;
  email: string;
  emailSubject: string;
  emailBody: string;
  phone: string;
  smsPhone: string;
  smsMessage: string;
  whatsappPhone: string;
  whatsappMessage: string;
  wifiSsid: string;
  wifiPassword: string;
  wifiEncryption: "WPA" | "WEP" | "nopass";
  wifiHidden: boolean;
  firstName: string;
  lastName: string;
  organization: string;
  jobTitle: string;
  vcardPhone: string;
  vcardEmail: string;
  vcardWebsite: string;
  vcardAddress: string;
  slug: string;
}

interface DesignState {
  foregroundColor: string;
  backgroundColor: string;
  dotStyle: DotStyle;
  cornerStyle: CornerStyle;
  margin: number;
  logoSizeRatio: number;
  errorCorrectionLevel: ErrorCorrectionLevel;
  size: number;
  frameStyle: FrameStyle;
}

interface PayloadResult {
  value: string;
  destinationUrl?: string;
  summary: string;
}

interface ApiResponse<TData> {
  ok: boolean;
  data?: TData;
  error?: { message: string };
}

const workflowSteps = [
  {
    label: "Content",
    description: "Choose type and enter the data encoded in the QR.",
  },
  {
    label: "Design",
    description: "Customize style while keeping the code scannable.",
  },
  {
    label: "Export",
    description: "Download, copy, or publish the finished QR.",
  },
];

const typeOptions: {
  value: QRType;
  label: string;
  description: string;
}[] = [
  { value: "url", label: "Website URL", description: "Open a web destination." },
  { value: "text", label: "Plain text", description: "Encode readable text." },
  { value: "email", label: "Email", description: "Create a mailto action." },
  { value: "phone", label: "Phone call", description: "Dial a phone number." },
  { value: "sms", label: "SMS", description: "Pre-fill a text message." },
  { value: "whatsapp", label: "WhatsApp", description: "Open a WhatsApp chat." },
  { value: "wifi", label: "Wi-Fi", description: "Share network access." },
  { value: "vcard", label: "vCard", description: "Share contact details." },
];

const modeOptions = [
  {
    value: "static",
    label: "Static",
    description: "Final content is encoded directly and cannot be edited later.",
  },
  {
    value: "dynamic",
    label: "Dynamic",
    description: "Encodes a Decode redirect URL that can change destination later.",
  },
] as const;

const dotStyleOptions: { value: DotStyle; label: string }[] = [
  { value: "square", label: "Square" },
  { value: "rounded", label: "Rounded" },
  { value: "dots", label: "Dots" },
  { value: "classy", label: "Classy" },
  { value: "extra-rounded", label: "Extra Rounded" },
];

const cornerStyleOptions: { value: CornerStyle; label: string }[] = [
  { value: "square", label: "Square" },
  { value: "rounded", label: "Rounded" },
  { value: "dot", label: "Dot" },
];

const colorPresets = [
  { name: "Ink", value: "#0f172a" },
  { name: "Sky", value: "#0369a1" },
  { name: "Cyan", value: "#0891b2" },
  { name: "Violet", value: "#7c3aed" },
  { name: "Green", value: "#047857" },
  { name: "Amber", value: "#b45309" },
  { name: "Rose", value: "#be123c" },
  { name: "Slate", value: "#334155" },
];

const frameOptions: {
  readonly value: FrameStyle;
  readonly label: string;
  readonly description: string;
  readonly bestFor: string;
}[] = [
  {
    value: "none",
    label: "No frame",
    description: "Pure QR with no callout.",
    bestFor: "Minimal exports",
  },
  {
    value: "scan-me",
    label: "Scan me",
    description: "Clear CTA for broad use.",
    bestFor: "Posters and flyers",
  },
  {
    value: "classic",
    label: "Classic",
    description: "Balanced label and border.",
    bestFor: "Business material",
  },
  {
    value: "ticket",
    label: "Ticket",
    description: "Dashed event-style frame.",
    bestFor: "Events and coupons",
  },
  {
    value: "badge",
    label: "Badge",
    description: "High-contrast brand plate.",
    bestFor: "Premium signage",
  },
  {
    value: "minimal",
    label: "Minimal",
    description: "Quiet label above the code.",
    bestFor: "Clean layouts",
  },
];

const thumbnailQrActiveCells = new Set([
  0, 1, 2, 6, 7, 8, 9, 11, 15, 17, 18, 19, 20, 24, 25, 26,
  28, 31, 33, 36, 37, 40, 43, 44, 45, 47, 49, 52, 55, 57,
  60, 61, 62, 63, 64, 67, 69, 70, 72, 73, 74, 78, 80,
]);

const initialFormState: FormState = {
  title: "Decode QR Code",
  url: "https://decode.com.ng",
  text: "Decode makes QR workflows safer and more useful.",
  email: "",
  emailSubject: "",
  emailBody: "",
  phone: "",
  smsPhone: "",
  smsMessage: "",
  whatsappPhone: "",
  whatsappMessage: "",
  wifiSsid: "",
  wifiPassword: "",
  wifiEncryption: "WPA",
  wifiHidden: false,
  firstName: "",
  lastName: "",
  organization: "",
  jobTitle: "",
  vcardPhone: "",
  vcardEmail: "",
  vcardWebsite: "",
  vcardAddress: "",
  slug: "campaign-launch",
};

const initialDesignState: DesignState = {
  foregroundColor: "#0F172A",
  backgroundColor: "#FFFFFF",
  dotStyle: "rounded",
  cornerStyle: "rounded",
  margin: 4,
  logoSizeRatio: 0,
  errorCorrectionLevel: "Q",
  size: 1024,
  frameStyle: "none",
};

export function QRGenerator({ showHeader = true }: QRGeneratorProps) {
  const [currentStep, setCurrentStep] = useState<WorkflowStep>("content");
  const [mode, setMode] = useState<QRMode>("static");
  const [type, setType] = useState<QRType>("url");
  const [form, setForm] = useState<FormState>(initialFormState);
  const [design, setDesign] = useState<DesignState>(initialDesignState);
  const [logoUrl, setLogoUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [publishStatus, setPublishStatus] = useState<string | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validation = useMemo(
    () => validateContent({ type, mode, form }),
    [type, mode, form]
  );
  const payload = useMemo(
    () => buildPayload({ type, mode, form }),
    [type, mode, form]
  );
  const renderableDesign = useMemo(
    () => ({
      ...design,
      foregroundColor: getSafeHex(
        design.foregroundColor,
        initialDesignState.foregroundColor
      ),
      backgroundColor: getSafeHex(
        design.backgroundColor,
        initialDesignState.backgroundColor
      ),
    }),
    [design]
  );
  const designWarnings = useMemo(
    () => getDesignWarnings({ design, hasLogo: Boolean(logoUrl) }),
    [design, logoUrl]
  );
  const stepIndex = ["content", "design", "export"].indexOf(currentStep);
  const previewValue = payload?.value || "https://decode.com.ng";

  const {
    ref: qrRef,
    download,
    downloadPdf,
    isReady,
  } = useQRCode({
    data: previewValue,
    width: renderableDesign.size,
    height: renderableDesign.size,
    margin: renderableDesign.margin,
    dotsColor: renderableDesign.foregroundColor,
    backgroundColor: renderableDesign.backgroundColor,
    dotsType: renderableDesign.dotStyle,
    cornersSquareType: getCornerSquareType(renderableDesign.cornerStyle),
    cornersDotType: renderableDesign.cornerStyle === "dot" ? "dot" : "square",
    errorCorrectionLevel: renderableDesign.errorCorrectionLevel,
    logoUrl,
    logoSize: logoUrl ? renderableDesign.logoSizeRatio : 0,
    containerKey: renderableDesign.frameStyle,
  } satisfies QROptions);

  const handleFormChange = (key: keyof FormState, value: string | boolean) => {
    setForm((previous) => ({ ...previous, [key]: value }));
  };

  const handleModeChange = (nextMode: QRMode) => {
    setMode(nextMode);
    if (nextMode === "dynamic") {
      setType("url");
    }
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => setLogoUrl(reader.result as string);
    reader.readAsDataURL(file);
    setDesign((previous) => ({
      ...previous,
      logoSizeRatio: previous.logoSizeRatio > 0 ? previous.logoSizeRatio : 0.16,
      errorCorrectionLevel:
        previous.errorCorrectionLevel === "H" ? "H" : "Q",
    }));
  };

  const handleRemoveLogo = () => {
    setLogoUrl("");
    setDesign((previous) => ({ ...previous, logoSizeRatio: 0 }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleCopyPayload = async () => {
    if (!payload?.value) return;

    await navigator.clipboard.writeText(payload.value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleContinueToDesign = () => {
    if (!validation.isValid) return;
    setCurrentStep("design");
  };

  const handlePublishDynamic = async () => {
    if (mode !== "dynamic" || type !== "url" || !validation.isValid) return;

    setIsPublishing(true);
    setPublishError(null);
    setPublishStatus(null);

    try {
      const response = await fetch("/api/qr-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "dynamic",
          type: "url",
          title: form.title || "Dynamic QR Code",
          save: true,
          slug: form.slug,
          content: { url: form.url },
          design: getApiDesign(design, Boolean(logoUrl)),
        }),
      });
      const result = (await response.json()) as ApiResponse<{
        qrCode: { id: string; slug: string | null };
      }>;

      if (!result.ok) {
        throw new Error(result.error?.message ?? "Could not publish QR code.");
      }

      setPublishStatus(
        result.data?.qrCode.slug
          ? `Published dynamic QR: /r/${result.data.qrCode.slug}`
          : "Dynamic QR published."
      );
    } catch (error) {
      setPublishError(
        error instanceof Error ? error.message : "Could not publish QR code."
      );
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="space-y-6 p-4">
      {showHeader && (
        <PageHeader
          title="QR Generator"
          subtitle="Create static QR codes now, or prepare dynamic QR codes for editable destinations."
        />
      )}

      <Stepper steps={workflowSteps} currentStep={Math.max(stepIndex, 0)} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_390px]">
        <section className="space-y-5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          {currentStep === "content" && (
            <ContentStep
              mode={mode}
              type={type}
              form={form}
              validationErrors={validation.errors}
              onModeChange={handleModeChange}
              onTypeChange={setType}
              onFormChange={handleFormChange}
              onContinue={handleContinueToDesign}
            />
          )}

          {currentStep === "design" && (
            <DesignStep
              design={design}
              logoUrl={logoUrl}
              warnings={designWarnings}
              onDesignChange={setDesign}
              onLogoUpload={handleLogoUpload}
              onRemoveLogo={handleRemoveLogo}
              logoInputRef={fileInputRef}
              onBack={() => setCurrentStep("content")}
              onContinue={() => setCurrentStep("export")}
            />
          )}

          {currentStep === "export" && (
            <ExportStep
              mode={mode}
              type={type}
              form={form}
              payload={payload}
              design={design}
              isReady={isReady}
              copied={copied}
              publishStatus={publishStatus}
              publishError={publishError}
              isPublishing={isPublishing}
              onBack={() => setCurrentStep("design")}
              onCopyPayload={handleCopyPayload}
              onDownloadPng={() => download("png")}
              onDownloadSvg={() => download("svg")}
              onDownloadPdf={() => downloadPdf(form.title || "Decode QR Code")}
              onPublishDynamic={handlePublishDynamic}
            />
          )}
        </section>

        <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
          <QRPreviewPanel isLoading={!isReady}>
            <QRFrame
              key={design.frameStyle}
              frameStyle={design.frameStyle}
              title={form.title}
            >
              <div
                ref={qrRef}
                className="w-full overflow-hidden rounded-lg [&_canvas]:!h-auto [&_canvas]:!w-full"
              />
            </QRFrame>
            {logoUrl && (
              <IconButton
                onClick={handleRemoveLogo}
                aria-label="Remove QR logo"
                variant="danger"
                className="absolute right-8 top-8 h-9 w-9 rounded-full"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </IconButton>
            )}
          </QRPreviewPanel>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={mode === "dynamic" ? "info" : "neutral"}>
                {mode === "dynamic" ? "Dynamic" : "Static"}
              </Badge>
              <Badge variant="neutral">{getTypeLabel(type)}</Badge>
              <Badge variant={designWarnings.length > 0 ? "warning" : "success"}>
                {designWarnings.length > 0
                  ? `${designWarnings.length} warning${designWarnings.length === 1 ? "" : "s"}`
                  : "Scan-ready"}
              </Badge>
            </div>
            <p className="mt-3 break-all text-sm leading-6 text-slate-600">
              {payload?.summary ?? "Complete the content step to preview payload."}
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

function ContentStep({
  mode,
  type,
  form,
  validationErrors,
  onModeChange,
  onTypeChange,
  onFormChange,
  onContinue,
}: {
  readonly mode: QRMode;
  readonly type: QRType;
  readonly form: FormState;
  readonly validationErrors: Record<string, string>;
  readonly onModeChange: (mode: QRMode) => void;
  readonly onTypeChange: (type: QRType) => void;
  readonly onFormChange: (key: keyof FormState, value: string | boolean) => void;
  readonly onContinue: () => void;
}) {
  const isDynamic = mode === "dynamic";
  const visibleTypeOptions = typeOptions.map((option) => ({
    ...option,
    disabled: isDynamic && option.value !== "url",
  }));
  const validation = validateContent({ type, mode, form });

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-slate-950">
          1. Choose content
        </h2>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          Static QR codes encode final content directly. Dynamic QR codes encode
          a Decode redirect URL that can be edited after publishing.
        </p>
      </div>

      <SegmentedControl
        value={mode}
        options={modeOptions}
        onChange={onModeChange}
        label="QR behavior"
        columns={2}
      />

      {isDynamic && (
        <Alert variant="info" title="Dynamic v1 supports URL redirects">
          Dynamic QR codes currently require a website URL, a stable slug, and
          sign-in before publishing to a workspace.
        </Alert>
      )}

      <SegmentedControl
        value={type}
        options={visibleTypeOptions}
        onChange={onTypeChange}
        label="QR type"
        columns={4}
      />

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <ContentFields
          type={type}
          mode={mode}
          form={form}
          errors={validationErrors}
          onFormChange={onFormChange}
        />
      </div>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-600" aria-live="polite">
          {validation.isValid
            ? "Content is valid. Continue to QR design."
            : "Complete the required fields to continue."}
        </p>
        <Button
          variant="primary"
          onClick={onContinue}
          disabled={!validation.isValid}
          rightIcon={<Sparkles className="h-4 w-4" aria-hidden="true" />}
        >
          Continue to design
        </Button>
      </div>
    </div>
  );
}

function ContentFields({
  type,
  mode,
  form,
  errors,
  onFormChange,
}: {
  readonly type: QRType;
  readonly mode: QRMode;
  readonly form: FormState;
  readonly errors: Record<string, string>;
  readonly onFormChange: (key: keyof FormState, value: string | boolean) => void;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Input
        label="Title"
        value={form.title}
        onChange={(event) => onFormChange("title", event.target.value)}
        placeholder="Spring campaign"
        hint="Used in downloads and dashboard labels."
        containerClassName="md:col-span-2"
      />

      {mode === "dynamic" && (
        <Input
          label="Dynamic slug"
          value={form.slug}
          onChange={(event) => onFormChange("slug", normalizeSlugInput(event.target.value))}
          placeholder="campaign-launch"
          error={errors.slug}
          hint="Lowercase letters, numbers, and hyphens only."
          containerClassName="md:col-span-2"
        />
      )}

      {type === "url" && (
        <Input
          label={mode === "dynamic" ? "Destination URL" : "Website URL"}
          value={form.url}
          onChange={(event) => onFormChange("url", event.target.value)}
          placeholder="https://example.com"
          error={errors.url}
          leftIcon={<LinkIcon className="h-4 w-4" aria-hidden="true" />}
          containerClassName="md:col-span-2"
        />
      )}

      {type === "text" && (
        <Textarea
          label="Text"
          value={form.text}
          onChange={(event) => onFormChange("text", event.target.value)}
          placeholder="Text to encode"
          error={errors.text}
          containerClassName="md:col-span-2"
        />
      )}

      {type === "email" && (
        <>
          <Input
            label="Email address"
            type="email"
            value={form.email}
            onChange={(event) => onFormChange("email", event.target.value)}
            placeholder="hello@example.com"
            error={errors.email}
          />
          <Input
            label="Subject"
            value={form.emailSubject}
            onChange={(event) => onFormChange("emailSubject", event.target.value)}
            placeholder="Hello"
          />
          <Textarea
            label="Body"
            value={form.emailBody}
            onChange={(event) => onFormChange("emailBody", event.target.value)}
            placeholder="Optional message"
            containerClassName="md:col-span-2"
          />
        </>
      )}

      {type === "phone" && (
        <Input
          label="Phone number"
          type="tel"
          value={form.phone}
          onChange={(event) => onFormChange("phone", event.target.value)}
          placeholder="+15551234567"
          error={errors.phone}
          containerClassName="md:col-span-2"
        />
      )}

      {type === "sms" && (
        <>
          <Input
            label="Phone number"
            type="tel"
            value={form.smsPhone}
            onChange={(event) => onFormChange("smsPhone", event.target.value)}
            placeholder="+15551234567"
            error={errors.smsPhone}
          />
          <Input
            label="Message"
            value={form.smsMessage}
            onChange={(event) => onFormChange("smsMessage", event.target.value)}
            placeholder="Optional SMS text"
          />
        </>
      )}

      {type === "whatsapp" && (
        <>
          <Input
            label="WhatsApp number"
            type="tel"
            value={form.whatsappPhone}
            onChange={(event) =>
              onFormChange("whatsappPhone", event.target.value)
            }
            placeholder="+15551234567"
            error={errors.whatsappPhone}
          />
          <Input
            label="Message"
            value={form.whatsappMessage}
            onChange={(event) =>
              onFormChange("whatsappMessage", event.target.value)
            }
            placeholder="Optional WhatsApp text"
          />
        </>
      )}

      {type === "wifi" && (
        <>
          <Input
            label="Network name"
            value={form.wifiSsid}
            onChange={(event) => onFormChange("wifiSsid", event.target.value)}
            placeholder="Guest Wi-Fi"
            error={errors.wifiSsid}
          />
          <Input
            label="Password"
            value={form.wifiPassword}
            onChange={(event) => onFormChange("wifiPassword", event.target.value)}
            placeholder="Optional"
          />
          <Select
            label="Encryption"
            value={form.wifiEncryption}
            onChange={(event) =>
              onFormChange(
                "wifiEncryption",
                event.target.value as FormState["wifiEncryption"]
              )
            }
          >
            <option value="WPA">WPA/WPA2</option>
            <option value="WEP">WEP</option>
            <option value="nopass">No password</option>
          </Select>
          <label className="flex min-h-12 items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800">
            <input
              type="checkbox"
              checked={form.wifiHidden}
              onChange={(event) => onFormChange("wifiHidden", event.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-sky-600"
            />
            Hidden network
          </label>
        </>
      )}

      {type === "vcard" && (
        <>
          <Input
            label="First name"
            value={form.firstName}
            onChange={(event) => onFormChange("firstName", event.target.value)}
            error={errors.vcardName}
          />
          <Input
            label="Last name"
            value={form.lastName}
            onChange={(event) => onFormChange("lastName", event.target.value)}
          />
          <Input
            label="Organization"
            value={form.organization}
            onChange={(event) => onFormChange("organization", event.target.value)}
          />
          <Input
            label="Title"
            value={form.jobTitle}
            onChange={(event) => onFormChange("jobTitle", event.target.value)}
          />
          <Input
            label="Phone"
            type="tel"
            value={form.vcardPhone}
            onChange={(event) => onFormChange("vcardPhone", event.target.value)}
          />
          <Input
            label="Email"
            type="email"
            value={form.vcardEmail}
            onChange={(event) => onFormChange("vcardEmail", event.target.value)}
            error={errors.vcardEmail}
          />
          <Input
            label="Website"
            value={form.vcardWebsite}
            onChange={(event) => onFormChange("vcardWebsite", event.target.value)}
            error={errors.vcardWebsite}
          />
          <Input
            label="Address"
            value={form.vcardAddress}
            onChange={(event) => onFormChange("vcardAddress", event.target.value)}
          />
        </>
      )}
    </div>
  );
}

function DesignStep({
  design,
  logoUrl,
  warnings,
  logoInputRef,
  onDesignChange,
  onLogoUpload,
  onRemoveLogo,
  onBack,
  onContinue,
}: {
  readonly design: DesignState;
  readonly logoUrl: string;
  readonly warnings: string[];
  readonly logoInputRef: React.RefObject<HTMLInputElement | null>;
  readonly onDesignChange: React.Dispatch<React.SetStateAction<DesignState>>;
  readonly onLogoUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  readonly onRemoveLogo: () => void;
  readonly onBack: () => void;
  readonly onContinue: () => void;
}) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-slate-950">
          2. Design and guardrails
        </h2>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          Choose a visual style while preserving contrast, quiet zone, and logo
          safety.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ColorInput
          label="Foreground hex"
          value={design.foregroundColor}
          onChange={(value) =>
            onDesignChange((previous) => ({
              ...previous,
              foregroundColor: normalizeHexDraft(value),
            }))
          }
        />
        <ColorInput
          label="Background hex"
          value={design.backgroundColor}
          onChange={(value) =>
            onDesignChange((previous) => ({
              ...previous,
              backgroundColor: normalizeHexDraft(value),
            }))
          }
        />
      </div>

      <div className="space-y-2">
        <p className="flex items-center gap-2 text-sm font-medium text-slate-800">
          <Palette className="h-4 w-4" aria-hidden="true" />
          Foreground presets
        </p>
        <div className="flex flex-wrap gap-2">
          {colorPresets.map((preset) => (
            <ColorSwatch
              key={preset.value}
              color={preset.value}
              label={`Use ${preset.name} foreground`}
              isSelected={design.foregroundColor.toLowerCase() === preset.value}
              onClick={() =>
                onDesignChange((previous) => ({
                  ...previous,
                  foregroundColor: preset.value.toUpperCase(),
                }))
              }
            />
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SegmentedControl
          value={design.dotStyle}
          options={dotStyleOptions}
          onChange={(value) =>
            onDesignChange((previous) => ({ ...previous, dotStyle: value }))
          }
          label="Dot style"
          columns={3}
        />
        <SegmentedControl
          value={design.cornerStyle}
          options={cornerStyleOptions}
          onChange={(value) =>
            onDesignChange((previous) => ({ ...previous, cornerStyle: value }))
          }
          label="Corner style"
          columns={3}
        />
      </div>

      <FramePicker
        value={design.frameStyle}
        onChange={(value) =>
          onDesignChange((previous) => ({ ...previous, frameStyle: value }))
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Slider
          label="Quiet zone"
          valueLabel={String(design.margin)}
          min={0}
          max={16}
          value={design.margin}
          minLabel="0"
          maxLabel="16"
          onChange={(event) =>
            onDesignChange((previous) => ({
              ...previous,
              margin: Number(event.target.value),
            }))
          }
        />
        <Slider
          label="Logo size"
          valueLabel={`${Math.round(design.logoSizeRatio * 100)}%`}
          min={0}
          max={35}
          value={Math.round(design.logoSizeRatio * 100)}
          minLabel="0%"
          maxLabel="35%"
          onChange={(event) =>
            onDesignChange((previous) => ({
              ...previous,
              logoSizeRatio: Number(event.target.value) / 100,
            }))
          }
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Select
          label="Error correction"
          value={design.errorCorrectionLevel}
          onChange={(event) =>
            onDesignChange((previous) => ({
              ...previous,
              errorCorrectionLevel: event.target.value as ErrorCorrectionLevel,
            }))
          }
          hint="Use high correction when adding a logo."
        >
          <option value="L">Low - smallest code</option>
          <option value="M">Medium</option>
          <option value="Q">Quartile - recommended</option>
          <option value="H">High - best for logos</option>
        </Select>
        <Select
          label="Export size"
          value={String(design.size)}
          onChange={(event) =>
            onDesignChange((previous) => ({
              ...previous,
              size: Number(event.target.value),
            }))
          }
          hint="PNG and PDF exports use this source size."
        >
          <option value="512">512 x 512</option>
          <option value="1024">1024 x 1024</option>
          <option value="2048">2048 x 2048</option>
        </Select>
      </div>

      <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-end">
        <FileUpload
          id="qr-logo-upload"
          ref={logoInputRef}
          label="Logo"
          accept="image/*"
          onChange={onLogoUpload}
          hint="Square PNG or SVG logos work best."
        />
        <Button
          variant="secondary"
          onClick={onRemoveLogo}
          disabled={!logoUrl}
          leftIcon={<X className="h-4 w-4" aria-hidden="true" />}
        >
          Remove logo
        </Button>
      </div>

      <div className="space-y-2" aria-live="polite">
        {warnings.length > 0 ? (
          warnings.map((warning) => (
            <Alert key={warning} variant="warning" icon={<AlertTriangle className="h-4 w-4" aria-hidden="true" />}>
              {warning}
            </Alert>
          ))
        ) : (
          <Alert variant="success" icon={<ShieldCheck className="h-4 w-4" aria-hidden="true" />}>
            No scanability warnings detected for the current design.
          </Alert>
        )}
      </div>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
        <Button variant="secondary" onClick={onBack}>
          Back to content
        </Button>
        <Button
          variant="primary"
          onClick={onContinue}
          rightIcon={<FileDown className="h-4 w-4" aria-hidden="true" />}
        >
          Continue to export
        </Button>
      </div>
    </div>
  );
}

function ExportStep({
  mode,
  type,
  form,
  payload,
  design,
  isReady,
  copied,
  publishStatus,
  publishError,
  isPublishing,
  onBack,
  onCopyPayload,
  onDownloadPng,
  onDownloadSvg,
  onDownloadPdf,
  onPublishDynamic,
}: {
  readonly mode: QRMode;
  readonly type: QRType;
  readonly form: FormState;
  readonly payload: PayloadResult | null;
  readonly design: DesignState;
  readonly isReady: boolean;
  readonly copied: boolean;
  readonly publishStatus: string | null;
  readonly publishError: string | null;
  readonly isPublishing: boolean;
  readonly onBack: () => void;
  readonly onCopyPayload: () => void;
  readonly onDownloadPng: () => void;
  readonly onDownloadSvg: () => void;
  readonly onDownloadPdf: () => void;
  readonly onPublishDynamic: () => void;
}) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-slate-950">
          3. Export and publish
        </h2>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          Download a static artifact, or publish a dynamic QR redirect if you
          are signed in.
        </p>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <ExportCard
          title="PNG"
          description={`${design.size} x ${design.size} raster image for print and social use.`}
          onClick={onDownloadPng}
          disabled={!isReady}
        />
        <ExportCard
          title="SVG"
          description="Vector QR for layouts, signs, and design tools."
          onClick={onDownloadSvg}
          disabled={!isReady}
        />
        <ExportCard
          title="PDF"
          description="A4 PDF sheet with the QR code embedded."
          onClick={onDownloadPdf}
          disabled={!isReady}
        />
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={mode === "dynamic" ? "info" : "neutral"}>
            {mode === "dynamic" ? "Dynamic" : "Static"}
          </Badge>
          <Badge variant="neutral">{getTypeLabel(type)}</Badge>
          <Badge variant="info">{design.errorCorrectionLevel} correction</Badge>
          <Badge variant="neutral">{getFrameExportLabel(design.frameStyle)}</Badge>
        </div>
        <p className="mt-3 break-all text-sm leading-6 text-slate-700">
          {payload?.summary ?? "No payload generated."}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            variant="secondary"
            onClick={onCopyPayload}
            disabled={!payload}
            leftIcon={
              copied ? (
                <Check className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Copy className="h-4 w-4" aria-hidden="true" />
              )
            }
          >
            {copied ? "Copied payload" : "Copy payload"}
          </Button>
          {mode === "dynamic" && (
            <Button
              variant="primary"
              onClick={onPublishDynamic}
              isLoading={isPublishing}
              leftIcon={<Rocket className="h-4 w-4" aria-hidden="true" />}
            >
              Publish dynamic QR
            </Button>
          )}
        </div>
      </div>

      {mode === "dynamic" && (
        <Alert variant="info" title="Dynamic destination">
          Destination: {form.url || "Add a destination URL"}; slug:{" "}
          {form.slug || "required"}
        </Alert>
      )}
      {publishStatus && <Alert variant="success">{publishStatus}</Alert>}
      {publishError && <Alert variant="danger">{publishError}</Alert>}

      <Button variant="secondary" onClick={onBack}>
        Back to design
      </Button>
    </div>
  );
}

function ExportCard({
  title,
  description,
  disabled,
  onClick,
}: {
  readonly title: string;
  readonly description: string;
  readonly disabled: boolean;
  readonly onClick: () => void;
}) {
  return (
    <Button
      variant="secondary"
      onClick={onClick}
      disabled={disabled}
      className="h-full justify-start p-4 text-left"
      leftIcon={<Download className="h-5 w-5" aria-hidden="true" />}
    >
      <span>
        <span className="block text-sm font-semibold">{title}</span>
        <span className="mt-1 block text-xs font-normal leading-5 text-slate-600">
          {description}
        </span>
      </span>
    </Button>
  );
}

function FramePicker({
  value,
  onChange,
}: {
  readonly value: FrameStyle;
  readonly onChange: (value: FrameStyle) => void;
}) {
  return (
    <fieldset className="space-y-4">
      <legend className="text-sm font-semibold text-slate-900">
        QR frame
      </legend>
      <p className="max-w-xl text-xs leading-5 text-slate-600">
        Frames sit outside the quiet zone and add a clear scan cue without
        covering the QR modules.
      </p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {frameOptions.map((option) => {
          const isSelected = value === option.value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              aria-pressed={isSelected}
              aria-label={`Select ${option.label} frame`}
              className={[
                "group relative flex min-h-64 flex-col rounded-xl border p-3 text-left shadow-sm transition-colors",
                isSelected
                  ? "border-sky-500 bg-sky-50 text-sky-950 ring-2 ring-sky-100"
                  : "border-slate-200 bg-white text-slate-800 hover:border-sky-300 hover:bg-sky-50/60",
              ].join(" ")}
            >
              <span className="flex items-start justify-between gap-3">
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">
                    {option.label}
                  </span>
                  <span className="mt-1 block text-xs leading-5 text-slate-600">
                    {option.description}
                  </span>
                </span>
                <span
                  className={[
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-colors",
                    isSelected
                      ? "border-sky-700 bg-sky-700 text-white"
                      : "border-slate-200 bg-white text-transparent group-hover:border-sky-300",
                  ].join(" ")}
                  aria-hidden="true"
                >
                  <Check className="h-3.5 w-3.5" />
                </span>
              </span>
              <span className="mt-3 block text-[11px] font-medium uppercase text-slate-500">
                {option.bestFor}
              </span>
              <span className="mt-3 block grow">
                <FrameThumbnail frameStyle={option.value} />
              </span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

function FrameThumbnail({ frameStyle }: { readonly frameStyle: FrameStyle }) {
  return (
    <div className="flex h-full min-h-32 items-center justify-center rounded-lg border border-slate-100 bg-slate-50 p-3">
      <QRFrame frameStyle={frameStyle} title="Scan me" isThumbnail>
        <MiniQRCode />
      </QRFrame>
    </div>
  );
}

function MiniQRCode() {
  return (
    <div className="grid aspect-square w-full grid-cols-9 gap-0.5 rounded-md bg-white p-1 shadow-sm ring-1 ring-slate-100">
      {Array.from({ length: 81 }, (_, index) => (
        <span
          key={index}
          className={
            thumbnailQrActiveCells.has(index)
              ? "rounded-[1px] bg-slate-950"
              : "rounded-[1px] bg-slate-100"
          }
        />
      ))}
    </div>
  );
}

function QRFrame({
  frameStyle,
  title,
  isThumbnail = false,
  children,
}: {
  readonly frameStyle: FrameStyle;
  readonly title: string;
  readonly isThumbnail?: boolean;
  readonly children: React.ReactNode;
}) {
  const safeTitle = title.trim() || "Scan me";
  const displayTitle = getShortFrameTitle(safeTitle);
  const qrSlotClass = isThumbnail
    ? "mx-auto w-14"
    : "mx-auto w-[76%] max-w-[236px]";
  const compactQrSlotClass = isThumbnail
    ? "mx-auto w-14"
    : "mx-auto w-[72%] max-w-[224px]";
  const frameWidthClass = isThumbnail
    ? "w-full max-w-[152px]"
    : "w-full max-w-[292px]";

  if (frameStyle === "none") {
    return (
      <div
        className={
          isThumbnail
            ? "mx-auto w-16 rounded-lg bg-white p-1 shadow-sm ring-1 ring-slate-100"
            : "w-full"
        }
      >
        {children}
      </div>
    );
  }

  if (frameStyle === "scan-me") {
    return (
      <div
        className={`${frameWidthClass} mx-auto overflow-hidden rounded-[22px] border-2 border-sky-700 bg-white text-center shadow-sm`}
      >
        <div className={isThumbnail ? "px-3 pt-2" : "px-5 pt-5"}>
          <div className={qrSlotClass}>{children}</div>
        </div>
        <p
          className={
            isThumbnail
              ? "mt-1 bg-sky-700 px-2 py-1 text-[8px] font-bold uppercase text-white"
              : "mt-4 bg-sky-700 px-4 py-2 text-xs font-bold uppercase tracking-normal text-white"
          }
        >
          SCAN ME
        </p>
      </div>
    );
  }

  if (frameStyle === "classic") {
    return (
      <div
        className={`${frameWidthClass} mx-auto rounded-2xl border border-slate-300 bg-white text-center shadow-sm`}
      >
        <p
          title={safeTitle}
          className={
            isThumbnail
              ? "truncate border-b border-slate-200 px-3 py-1 text-[8px] font-semibold text-slate-700"
              : "truncate border-b border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-800"
          }
        >
          {displayTitle}
        </p>
        <div className={isThumbnail ? "p-2" : "p-5"}>
          <div className={qrSlotClass}>{children}</div>
        </div>
      </div>
    );
  }

  if (frameStyle === "ticket") {
    return (
      <div
        className={`${frameWidthClass} relative mx-auto rounded-[24px] border border-dashed border-sky-500 bg-sky-50 text-center shadow-sm`}
      >
        <span
          className={
            isThumbnail
              ? "absolute -left-1.5 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border border-sky-300 bg-white"
              : "absolute -left-2.5 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full border border-sky-300 bg-white"
          }
          aria-hidden="true"
        />
        <span
          className={
            isThumbnail
              ? "absolute -right-1.5 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border border-sky-300 bg-white"
              : "absolute -right-2.5 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full border border-sky-300 bg-white"
          }
          aria-hidden="true"
        />
        <div className={isThumbnail ? "px-3 pt-2" : "px-5 pt-5"}>
          <div className={compactQrSlotClass}>{children}</div>
        </div>
        <p
          className={
            isThumbnail
              ? "mt-1 border-t border-dashed border-sky-300 px-3 py-1 text-[8px] font-bold uppercase text-sky-900"
              : "mt-4 border-t border-dashed border-sky-300 px-5 py-2.5 text-xs font-bold uppercase tracking-normal text-sky-900"
          }
        >
          TICKET
        </p>
      </div>
    );
  }

  if (frameStyle === "badge") {
    return (
      <div
        className={`${frameWidthClass} mx-auto rounded-[28px] bg-slate-950 text-center shadow-sm ring-1 ring-slate-900`}
      >
        <div className={isThumbnail ? "p-2 pb-1" : "p-4 pb-2"}>
          <div className="rounded-[18px] bg-white p-2 shadow-inner">
            <div className={isThumbnail ? "mx-auto w-14" : "mx-auto w-[78%]"}>
              {children}
            </div>
          </div>
        </div>
        <p
          title={safeTitle}
          className={
            isThumbnail
              ? "truncate px-3 pb-2 text-[8px] font-bold text-white"
              : "truncate px-5 pb-4 text-sm font-bold text-white"
          }
        >
          {displayTitle}
        </p>
      </div>
    );
  }

  return (
    <div
      className={`${frameWidthClass} mx-auto rounded-2xl border border-slate-200 bg-white text-center shadow-sm`}
    >
      <p
        className={
          isThumbnail
            ? "px-3 pt-2 text-[8px] font-bold uppercase text-sky-800"
            : "px-5 pt-4 text-xs font-bold uppercase tracking-normal text-sky-800"
        }
      >
        SCAN
      </p>
      <div className={isThumbnail ? "p-2 pt-1" : "p-5 pt-3"}>
        <div className={qrSlotClass}>{children}</div>
      </div>
    </div>
  );
}

function validateContent({
  type,
  mode,
  form,
}: {
  readonly type: QRType;
  readonly mode: QRMode;
  readonly form: FormState;
}): { isValid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  if (mode === "dynamic") {
    if (!/^[a-z0-9](?:[a-z0-9-]{1,62}[a-z0-9])$/.test(form.slug)) {
      errors.slug =
        "Use 3-64 lowercase letters, numbers, and hyphens. Start and end with a letter or number.";
    }
    if (type !== "url") {
      errors.type = "Dynamic QR codes currently require a website URL.";
    }
  }

  if (type === "url") {
    if (!isValidHttpUrl(form.url)) {
      errors.url = "Enter a valid http or https URL.";
    }
  }

  if (type === "text" && form.text.trim().length < 1) {
    errors.text = "Enter text to encode.";
  }

  if (type === "email" && !isValidEmail(form.email)) {
    errors.email = "Enter a valid email address.";
  }

  if (type === "phone" && normalizePhone(form.phone).length < 3) {
    errors.phone = "Enter a phone number.";
  }

  if (type === "sms" && normalizePhone(form.smsPhone).length < 3) {
    errors.smsPhone = "Enter a phone number.";
  }

  if (type === "whatsapp" && normalizePhone(form.whatsappPhone).length < 3) {
    errors.whatsappPhone = "Enter a WhatsApp phone number.";
  }

  if (type === "wifi" && form.wifiSsid.trim().length < 1) {
    errors.wifiSsid = "Enter the Wi-Fi network name.";
  }

  if (
    type === "vcard" &&
    !form.firstName.trim() &&
    !form.lastName.trim() &&
    !form.organization.trim()
  ) {
    errors.vcardName = "Enter a name or organization.";
  }

  if (type === "vcard" && form.vcardEmail && !isValidEmail(form.vcardEmail)) {
    errors.vcardEmail = "Enter a valid email address.";
  }

  if (type === "vcard" && form.vcardWebsite && !isValidHttpUrl(form.vcardWebsite)) {
    errors.vcardWebsite = "Enter a valid website URL.";
  }

  return { isValid: Object.keys(errors).length === 0, errors };
}

function buildPayload({
  type,
  mode,
  form,
}: {
  readonly type: QRType;
  readonly mode: QRMode;
  readonly form: FormState;
}): PayloadResult | null {
  try {
    if (mode === "dynamic") {
      const redirectUrl = getDynamicRedirectUrl(form.slug);
      return {
        value: redirectUrl,
        destinationUrl: normalizeHttpUrl(form.url),
        summary: `${redirectUrl} -> ${normalizeHttpUrl(form.url)}`,
      };
    }

    if (type === "url") {
      const url = normalizeHttpUrl(form.url);
      return { value: url, destinationUrl: url, summary: url };
    }

    if (type === "text") {
      return { value: form.text, summary: form.text };
    }

    if (type === "email") {
      const params = new URLSearchParams();
      if (form.emailSubject) params.set("subject", form.emailSubject);
      if (form.emailBody) params.set("body", form.emailBody);
      const query = params.toString();
      const value = `mailto:${form.email}${query ? `?${query}` : ""}`;
      return { value, summary: value };
    }

    if (type === "phone") {
      const value = `tel:${normalizePhone(form.phone)}`;
      return { value, summary: value };
    }

    if (type === "sms") {
      const value = `SMSTO:${normalizePhone(form.smsPhone)}:${form.smsMessage}`;
      return { value, summary: value };
    }

    if (type === "whatsapp") {
      const phone = normalizePhone(form.whatsappPhone).replace(/^\+/, "");
      const message = form.whatsappMessage
        ? `?text=${encodeURIComponent(form.whatsappMessage)}`
        : "";
      const value = `https://wa.me/${phone}${message}`;
      return { value, destinationUrl: value, summary: value };
    }

    if (type === "wifi") {
      const value = [
        "WIFI:",
        `T:${form.wifiEncryption};`,
        `S:${escapeWifiValue(form.wifiSsid)};`,
        `P:${escapeWifiValue(form.wifiPassword)};`,
        `H:${form.wifiHidden ? "true" : "false"};`,
        ";",
      ].join("");
      return { value, summary: `Wi-Fi network: ${form.wifiSsid}` };
    }

    const fullName = [form.firstName, form.lastName].filter(Boolean).join(" ");
    const lines = [
      "BEGIN:VCARD",
      "VERSION:3.0",
      `N:${escapeVCardValue(form.lastName)};${escapeVCardValue(form.firstName)};;;`,
      fullName ? `FN:${escapeVCardValue(fullName)}` : undefined,
      form.organization ? `ORG:${escapeVCardValue(form.organization)}` : undefined,
      form.jobTitle ? `TITLE:${escapeVCardValue(form.jobTitle)}` : undefined,
      form.vcardPhone ? `TEL:${escapeVCardValue(form.vcardPhone)}` : undefined,
      form.vcardEmail ? `EMAIL:${escapeVCardValue(form.vcardEmail)}` : undefined,
      form.vcardWebsite ? `URL:${normalizeHttpUrl(form.vcardWebsite)}` : undefined,
      form.vcardAddress ? `ADR:;;${escapeVCardValue(form.vcardAddress)};;;;` : undefined,
      "END:VCARD",
    ];
    const value = lines.filter(Boolean).join("\n");

    return { value, summary: fullName || form.organization || "vCard contact" };
  } catch {
    return null;
  }
}

function getDesignWarnings({
  design,
  hasLogo,
}: {
  readonly design: DesignState;
  readonly hasLogo: boolean;
}): string[] {
  const warnings: string[] = [];

  if (!isValidHexColor(design.foregroundColor) || !isValidHexColor(design.backgroundColor)) {
    warnings.push("Use valid 6-digit hex colors before exporting.");
  }

  if (getContrastRatio(design.foregroundColor, design.backgroundColor) < 4.5) {
    warnings.push(
      "Foreground and background colors may not have enough contrast for reliable scanning."
    );
  }

  if (design.margin < 4) {
    warnings.push(
      "Quiet zone is smaller than recommended. Use margin 4 or higher."
    );
  }

  if (hasLogo && design.logoSizeRatio > 0.2) {
    warnings.push("Logo size is above 20% and may cover required QR modules.");
  }

  if (hasLogo && design.errorCorrectionLevel !== "H") {
    warnings.push("Use high error correction when adding a logo.");
  }

  return warnings;
}

function getApiDesign(design: DesignState, hasLogo: boolean) {
  return {
    foregroundColor: getSafeHex(
      design.foregroundColor,
      initialDesignState.foregroundColor
    ),
    backgroundColor: getSafeHex(
      design.backgroundColor,
      initialDesignState.backgroundColor
    ),
    margin: design.margin,
    logoSizeRatio: hasLogo ? design.logoSizeRatio : 0,
    dotStyle: design.dotStyle,
    cornerStyle: design.cornerStyle,
    errorCorrectionLevel: design.errorCorrectionLevel,
    size: design.size,
  };
}

function getCornerSquareType(cornerStyle: CornerStyle): QROptions["cornersSquareType"] {
  if (cornerStyle === "rounded") return "extra-rounded";
  if (cornerStyle === "dot") return "dot";

  return "square";
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

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function normalizePhone(value: string): string {
  return value.replace(/[^\d+]/g, "");
}

function normalizeSlugInput(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 64);
}

function getDynamicRedirectUrl(slug: string): string {
  const origin =
    typeof window === "undefined" ? "https://decode.local" : window.location.origin;

  return `${origin}/r/${slug || "your-slug"}`;
}

function normalizeHexDraft(value: string): string {
  const sanitizedValue = value.trim().toUpperCase();

  if (/^#[0-9A-F]{6}$/.test(sanitizedValue)) return sanitizedValue;

  return sanitizedValue.startsWith("#") ? sanitizedValue : `#${sanitizedValue}`;
}

function getSafeHex(value: string, fallback: string): string {
  const normalizedValue = normalizeHexDraft(value);

  return isValidHexColor(normalizedValue) ? normalizedValue : fallback;
}

function isValidHexColor(value: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(value);
}

function getContrastRatio(foreground: string, background: string): number {
  if (!isValidHexColor(foreground) || !isValidHexColor(background)) {
    return 1;
  }

  const foregroundLuminance = getRelativeLuminance(foreground);
  const backgroundLuminance = getRelativeLuminance(background);
  const lighter = Math.max(foregroundLuminance, backgroundLuminance);
  const darker = Math.min(foregroundLuminance, backgroundLuminance);

  return (lighter + 0.05) / (darker + 0.05);
}

function getRelativeLuminance(color: string): number {
  const [red, green, blue] = [
    Number.parseInt(color.slice(1, 3), 16),
    Number.parseInt(color.slice(3, 5), 16),
    Number.parseInt(color.slice(5, 7), 16),
  ].map((channel) => {
    const normalized = channel / 255;

    return normalized <= 0.03928
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function escapeWifiValue(value: string): string {
  return value.replace(/([\\;,:"])/g, "\\$1");
}

function escapeVCardValue(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,");
}

function getTypeLabel(type: QRType): string {
  return typeOptions.find((option) => option.value === type)?.label ?? type;
}

function getFrameLabel(frameStyle: FrameStyle): string {
  return (
    frameOptions.find((option) => option.value === frameStyle)?.label ??
    frameStyle
  );
}

function getFrameExportLabel(frameStyle: FrameStyle): string {
  if (frameStyle === "none") return "No frame";

  return `${getFrameLabel(frameStyle)} frame`;
}

function getShortFrameTitle(value: string): string {
  const normalizedValue = value.trim();

  if (normalizedValue.length <= 28) return normalizedValue;

  return `${normalizedValue.slice(0, 25)}...`;
}
