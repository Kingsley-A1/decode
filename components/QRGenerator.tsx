"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
} from "react";
import {
  AlertTriangle,
  Check,
  Contact as ContactIcon,
  Copy,
  Download,
  FileDown,
  Link as LinkIcon,
  Mail,
  MessageCircle,
  Palette,
  Phone,
  Rocket,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  Wifi,
  X,
} from "lucide-react";
import {
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
  FaWhatsapp,
  FaYoutube,
} from "react-icons/fa";
import { useQRCode, type QROptions } from "@/hooks/useQRCode";
import { OAuthSignInPanel } from "@/components/auth/OAuthSignInPanel";
import { getFreshClientSession } from "@/lib/client-auth";
import { PageHeader } from "./PageHeader";
import {
  Alert,
  Badge,
  BuilderActionBar,
  Button,
  ChoiceRail,
  ColorInput,
  ColorSwatch,
  DisclosureSection,
  FileUpload,
  IconButton,
  Input,
  MobilePreviewTray,
  ProgressStepper,
  QRPreviewPanel,
  Select,
  SegmentedControl,
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
type ExportFormat = "png" | "svg" | "pdf";
type FrameStyle =
  | "none"
  | "scan-me"
  | "classic"
  | "ticket"
  | "badge"
  | "minimal";
type ClientAuthState = "checking" | "authenticated" | "anonymous";
type LogoChoiceValue =
  | "none"
  | "upload"
  | "link"
  | "instagram"
  | "facebook"
  | "youtube"
  | "linkedin"
  | "email"
  | "phone"
  | "sms"
  | "whatsapp"
  | "wifi"
  | "vcard";
type DesignPreset =
  | "clean"
  | "corporate"
  | "event"
  | "menu"
  | "social"
  | "coupon"
  | "custom";
type ScanabilityState = "ready" | "needs-attention" | "blocked";

interface QRGeneratorProps {
  showHeader?: boolean;
  initialMode?: QRMode;
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
}

interface DesignState {
  foregroundColor: string;
  backgroundColor: string;
  frameColor: string;
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
  requiresPublish?: boolean;
  isStale?: boolean;
}

interface PublishedDynamicPayload {
  readonly qrCodeId: string;
  readonly slug: string | null;
  readonly payloadValue: string;
  readonly destinationUrl: string;
  readonly signature: string;
}

interface ScanabilityResult {
  state: ScanabilityState;
  label: string;
  description: string;
  reasons: string[];
  blocksPublish: boolean;
}

interface LogoChoiceOption {
  value: LogoChoiceValue;
  label: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  color: string;
  iconColor?: string;
  initials: string;
  logoSvg?: string;
  qrTypes?: readonly QRType[];
  ariaLabel?: string;
}

interface ApiResponse<TData> {
  ok: boolean;
  data?: TData;
  error?: { message: string };
}

interface RenderSavedQRCodeResponse {
  readonly downloadUrl: string;
}

interface QRGeneratorAuthDraft {
  readonly version: 1;
  readonly currentStep: WorkflowStep;
  readonly mode: QRMode;
  readonly type: QRType;
  readonly form: FormState;
  readonly design: DesignState;
  readonly selectedPreset: DesignPreset;
  readonly logoUrl: string;
  readonly logoChoice: LogoChoiceValue;
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
  shortLabel: string;
  description: string;
}[] = [
  {
    value: "url",
    label: "Website URL",
    shortLabel: "URL",
    description: "Open a web destination.",
  },
  {
    value: "text",
    label: "Plain text",
    shortLabel: "Text",
    description: "Encode readable text.",
  },
  {
    value: "email",
    label: "Email",
    shortLabel: "Email",
    description: "Create a mailto action.",
  },
  {
    value: "phone",
    label: "Phone call",
    shortLabel: "Phone",
    description: "Dial a phone number.",
  },
  {
    value: "sms",
    label: "SMS",
    shortLabel: "SMS",
    description: "Pre-fill a text message.",
  },
  {
    value: "whatsapp",
    label: "WhatsApp",
    shortLabel: "WhatsApp",
    description: "Open a WhatsApp chat.",
  },
  {
    value: "wifi",
    label: "Wi-Fi",
    shortLabel: "Wi-Fi",
    description: "Share network access.",
  },
  {
    value: "vcard",
    label: "vCard",
    shortLabel: "vCard",
    description: "Share contact details.",
  },
];

const modeOptions = [
  {
    value: "static",
    label: "Static",
    description: "Fixed after download.",
  },
  {
    value: "dynamic",
    label: "Dynamic",
    description: "Editable and trackable.",
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

const exportFormatOptions: {
  readonly value: ExportFormat;
  readonly label: string;
  readonly description: string;
}[] = [
  {
    value: "png",
    label: "PNG",
    description: "Raster image for print and social use.",
  },
  {
    value: "svg",
    label: "SVG",
    description: "Vector QR for layouts, signs, and design tools.",
  },
  {
    value: "pdf",
    label: "PDF",
    description: "A4 sheet with the QR code embedded.",
  },
];

const colorPresets = [
  { name: "Blue", value: "#2563EB" },
  { name: "Violet", value: "#2B16D0" },
  { name: "Red", value: "#D01616" },
  { name: "Emerald", value: "#059669" },
  { name: "Cyan", value: "#0891B2" },
  { name: "Amber", value: "#B45309" },
  { name: "Rose", value: "#BE123C" },
  { name: "Ink", value: "#0F172A" },
];

type PresetDesignState = Pick<
  DesignState,
  | "foregroundColor"
  | "backgroundColor"
  | "frameColor"
  | "dotStyle"
  | "cornerStyle"
  | "margin"
  | "errorCorrectionLevel"
  | "frameStyle"
>;

const defaultLogoSizeRatio = 0.26;

const designPresetOptions: {
  readonly value: DesignPreset;
  readonly label: string;
  readonly description: string;
}[] = [
  {
    value: "clean",
    label: "Clean",
    description: "Neutral color with a minimal, scan-first setup.",
  },
  {
    value: "corporate",
    label: "Corporate",
    description: "Structured blue styling for business materials.",
  },
  {
    value: "event",
    label: "Event",
    description: "Ticket framing with a stronger campaign color.",
  },
  {
    value: "menu",
    label: "Menu",
    description: "Fresh color and low-noise framing for tables and counters.",
  },
  {
    value: "social",
    label: "Social",
    description: "CTA-forward styling with logo-safe correction.",
  },
  {
    value: "coupon",
    label: "Coupon",
    description: "Promotional soft-plate styling for offers and flyers.",
  },
  {
    value: "custom",
    label: "Custom",
    description: "Manual settings are active.",
  },
];

const designPresets: Record<Exclude<DesignPreset, "custom">, PresetDesignState> = {
  clean: {
    foregroundColor: "#0F172A",
    backgroundColor: "#FFFFFF",
    frameColor: "#2563EB",
    dotStyle: "square",
    cornerStyle: "square",
    margin: 16,
    errorCorrectionLevel: "Q",
    frameStyle: "none",
  },
  corporate: {
    foregroundColor: "#0F172A",
    backgroundColor: "#FFFFFF",
    frameColor: "#2563EB",
    dotStyle: "square",
    cornerStyle: "square",
    margin: 16,
    errorCorrectionLevel: "Q",
    frameStyle: "classic",
  },
  event: {
    foregroundColor: "#0F172A",
    backgroundColor: "#FFFFFF",
    frameColor: "#2B16D0",
    dotStyle: "dots",
    cornerStyle: "dot",
    margin: 16,
    errorCorrectionLevel: "Q",
    frameStyle: "ticket",
  },
  menu: {
    foregroundColor: "#0F172A",
    backgroundColor: "#FFFFFF",
    frameColor: "#047857",
    dotStyle: "rounded",
    cornerStyle: "rounded",
    margin: 16,
    errorCorrectionLevel: "Q",
    frameStyle: "minimal",
  },
  social: {
    foregroundColor: "#0F172A",
    backgroundColor: "#FFFFFF",
    frameColor: "#0891B2",
    dotStyle: "classy",
    cornerStyle: "dot",
    margin: 16,
    errorCorrectionLevel: "Q",
    frameStyle: "scan-me",
  },
  coupon: {
    foregroundColor: "#0F172A",
    backgroundColor: "#FFFFFF",
    frameColor: "#D01616",
    dotStyle: "extra-rounded",
    cornerStyle: "rounded",
    margin: 16,
    errorCorrectionLevel: "Q",
    frameStyle: "badge",
  },
};

const noLogoChoice: LogoChoiceOption = {
  value: "none",
  label: "None",
  description: "Use the QR without a center logo.",
  icon: X,
  color: "#64748B",
  initials: "X",
  ariaLabel: "Use no logo",
};

const uploadedLogoChoice: LogoChoiceOption = {
  value: "upload",
  label: "Uploaded",
  description: "Use the image selected from your device.",
  icon: UploadCloud,
  color: "#0F172A",
  initials: "IMG",
  ariaLabel: "Use uploaded logo",
};

type BrandLogoKey =
  | "facebook"
  | "instagram"
  | "linkedin"
  | "youtube"
  | "whatsapp";
type UtilityLogoKey = "email" | "link" | "phone" | "sms" | "vcard" | "wifi";

const brandLogoSvgByKey: Record<BrandLogoKey, string> = {
  facebook: [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">`,
    `<rect x="8" y="8" width="112" height="112" rx="28" fill="#FFFFFF"/>`,
    `<rect x="8" y="8" width="112" height="112" rx="28" fill="#1877F2" fill-opacity="0.1"/>`,
    `<path fill="#1877F2" d="M72 46h12V28H70c-16 0-26 10-26 27v10H32v18h12v37h20V83h16l3-18H64V55c0-6 3-9 8-9Z"/>`,
    `</svg>`,
  ].join(""),
  instagram: [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">`,
    `<defs><linearGradient id="ig" x1="24" y1="104" x2="104" y2="24" gradientUnits="userSpaceOnUse"><stop stop-color="#F58529"/><stop offset=".45" stop-color="#DD2A7B"/><stop offset="1" stop-color="#515BD4"/></linearGradient></defs>`,
    `<rect x="8" y="8" width="112" height="112" rx="28" fill="#FFFFFF"/>`,
    `<rect x="29" y="29" width="70" height="70" rx="20" fill="none" stroke="url(#ig)" stroke-width="10"/>`,
    `<circle cx="64" cy="64" r="16" fill="none" stroke="url(#ig)" stroke-width="10"/>`,
    `<circle cx="84" cy="44" r="6" fill="#DD2A7B"/>`,
    `</svg>`,
  ].join(""),
  linkedin: [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">`,
    `<rect x="8" y="8" width="112" height="112" rx="28" fill="#FFFFFF"/>`,
    `<rect x="8" y="8" width="112" height="112" rx="28" fill="#0A66C2" fill-opacity="0.1"/>`,
    `<rect x="34" y="54" width="16" height="43" rx="4" fill="#0A66C2"/>`,
    `<circle cx="42" cy="38" r="9" fill="#0A66C2"/>`,
    `<path fill="#0A66C2" d="M60 54h15v6c3-5 8-8 17-8 13 0 22 9 22 28v17H98V82c0-10-4-15-11-15-8 0-11 6-11 15v15H60V54Z"/>`,
    `</svg>`,
  ].join(""),
  youtube: [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">`,
    `<rect x="8" y="8" width="112" height="112" rx="28" fill="#FFFFFF"/>`,
    `<rect x="8" y="8" width="112" height="112" rx="28" fill="#FF0000" fill-opacity="0.1"/>`,
    `<path fill="#FF0000" d="M101 43c-1-7-5-12-12-13-7-1-18-2-25-2s-18 1-25 2c-7 1-11 6-12 13-1 6-1 15-1 21s0 15 1 21c1 7 5 12 12 13 7 1 18 2 25 2s18-1 25-2c7-1 11-6 12-13 1-6 1-15 1-21s0-15-1-21Z"/>`,
    `<path fill="#FFFFFF" d="M56 78V50l27 14-27 14Z"/>`,
    `</svg>`,
  ].join(""),
  whatsapp: [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">`,
    `<rect x="8" y="8" width="112" height="112" rx="28" fill="#FFFFFF"/>`,
    `<rect x="8" y="8" width="112" height="112" rx="28" fill="#25D366" fill-opacity="0.1"/>`,
    `<path fill="#25D366" d="M31 101l5-19a39 39 0 1 1 15 13l-20 6Zm22-21c6 4 13 6 20 4 14-3 23-16 20-30S77 31 63 34 40 50 43 64c1 5 3 9 6 13l-3 10 7-7Z"/>`,
    `<path fill="#25D366" d="M56 47c2-1 4-1 5 1l4 9c1 2 0 4-2 5l-2 1c2 5 6 9 11 11l2-2c1-2 3-2 5-1l8 4c2 1 2 3 1 5-2 4-6 7-10 7-10-1-26-13-30-27-2-5 2-11 8-13Z"/>`,
    `</svg>`,
  ].join(""),
};

function createBrandLogoSvg(key: BrandLogoKey): string {
  return brandLogoSvgByKey[key];
}

const utilityLogoSvgByKey: Record<UtilityLogoKey, string> = {
  email: createUtilityLogoSvg({
    color: "#F59E0B",
    path: `<path d="M31 42h66v44H31V42Zm6 8 27 20 27-20M37 80l19-16m35 16L72 64" fill="none" stroke="currentColor" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>`,
  }),
  link: createUtilityLogoSvg({
    color: "#7C3AED",
    path: `<path d="M52 76 42 86c-9 9-23-5-14-14l17-17c6-6 15-6 21-1m10-2 10-10c9-9 23 5 14 14L83 73c-6 6-15 6-21 1m-9-10h22" fill="none" stroke="currentColor" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>`,
  }),
  phone: createUtilityLogoSvg({
    color: "#0F766E",
    path: `<path d="M43 29 32 40c-4 4 3 24 21 42s38 25 42 21l11-11-17-18-10 8c-8-4-15-11-20-20l8-10L43 29Z" fill="none" stroke="currentColor" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>`,
  }),
  sms: createUtilityLogoSvg({
    color: "#2563EB",
    path: `<path d="M29 38h70a9 9 0 0 1 9 9v32a9 9 0 0 1-9 9H57l-23 15V88h-5a9 9 0 0 1-9-9V47a9 9 0 0 1 9-9Z" fill="none" stroke="currentColor" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/><path d="M43 63h42M43 76h26" fill="none" stroke="currentColor" stroke-width="8" stroke-linecap="round"/>`,
  }),
  vcard: createUtilityLogoSvg({
    color: "#007AFF",
    path: `<rect x="28" y="37" width="72" height="54" rx="10" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="51" cy="61" r="9" fill="currentColor"/><path d="M38 80c4-9 22-9 26 0m15-19h12m-12 16h12" fill="none" stroke="currentColor" stroke-width="7" stroke-linecap="round"/>`,
  }),
  wifi: createUtilityLogoSvg({
    color: "#0284C7",
    path: `<path d="M31 55c19-17 47-17 66 0M45 70c11-10 27-10 38 0M58 84c4-4 8-4 12 0" fill="none" stroke="currentColor" stroke-width="8" stroke-linecap="round"/><circle cx="64" cy="98" r="5" fill="currentColor"/>`,
  }),
};

function createUtilityLogoSvg({
  color,
  path,
}: {
  readonly color: string;
  readonly path: string;
}): string {
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" style="color:${color}">`,
    `<rect x="8" y="8" width="112" height="112" rx="28" fill="#FFFFFF"/>`,
    `<rect x="8" y="8" width="112" height="112" rx="28" fill="${color}" fill-opacity="0.1"/>`,
    path,
    `</svg>`,
  ].join("");
}

const logoPresetOptions: readonly LogoChoiceOption[] = [
  {
    value: "link",
    label: "Link",
    description: "Generic web link icon for website QR codes.",
    icon: LinkIcon,
    color: "#7C3AED",
    initials: "URL",
    logoSvg: utilityLogoSvgByKey.link,
    qrTypes: ["url"],
  },
  {
    value: "instagram",
    label: "IG",
    description: "Social profile icon for Instagram destinations.",
    icon: FaInstagram,
    color: "#E1306C",
    iconColor: "#C13584",
    initials: "IG",
    logoSvg: createBrandLogoSvg("instagram"),
    qrTypes: ["url"],
    ariaLabel: "Use Instagram logo",
  },
  {
    value: "facebook",
    label: "FB",
    description: "Social profile icon for Facebook destinations.",
    icon: FaFacebookF,
    color: "#1877F2",
    iconColor: "#1877F2",
    initials: "FB",
    logoSvg: createBrandLogoSvg("facebook"),
    qrTypes: ["url"],
    ariaLabel: "Use Facebook logo",
  },
  {
    value: "youtube",
    label: "YT",
    description: "Video channel icon for YouTube destinations.",
    icon: FaYoutube,
    color: "#FF0000",
    iconColor: "#FF0000",
    initials: "YT",
    logoSvg: createBrandLogoSvg("youtube"),
    qrTypes: ["url"],
    ariaLabel: "Use YouTube logo",
  },
  {
    value: "linkedin",
    label: "IN",
    description: "Professional profile icon for LinkedIn destinations.",
    icon: FaLinkedinIn,
    color: "#0A66C2",
    iconColor: "#0A66C2",
    initials: "IN",
    logoSvg: createBrandLogoSvg("linkedin"),
    qrTypes: ["url"],
    ariaLabel: "Use LinkedIn logo",
  },
  {
    value: "email",
    label: "Email",
    description: "Mail icon for email QR codes.",
    icon: Mail,
    color: "#F59E0B",
    initials: "@",
    logoSvg: utilityLogoSvgByKey.email,
    qrTypes: ["email"],
  },
  {
    value: "phone",
    label: "Phone",
    description: "Phone icon for call QR codes.",
    icon: Phone,
    color: "#0F766E",
    initials: "TEL",
    logoSvg: utilityLogoSvgByKey.phone,
    qrTypes: ["phone"],
  },
  {
    value: "sms",
    label: "SMS",
    description: "Message icon for SMS QR codes.",
    icon: MessageCircle,
    color: "#2563EB",
    initials: "SMS",
    logoSvg: utilityLogoSvgByKey.sms,
    qrTypes: ["sms"],
  },
  {
    value: "whatsapp",
    label: "WA",
    description: "Chat icon for WhatsApp QR codes.",
    icon: FaWhatsapp,
    color: "#25D366",
    iconColor: "#16A34A",
    initials: "WA",
    logoSvg: createBrandLogoSvg("whatsapp"),
    qrTypes: ["whatsapp"],
    ariaLabel: "Use WhatsApp logo",
  },
  {
    value: "wifi",
    label: "Wi-Fi",
    description: "Wi-Fi icon for network access QR codes.",
    icon: Wifi,
    color: "#0284C7",
    initials: "WiFi",
    logoSvg: utilityLogoSvgByKey.wifi,
    qrTypes: ["wifi"],
  },
  {
    value: "vcard",
    label: "vCard",
    description: "Contact card icon for vCard QR codes.",
    icon: ContactIcon,
    color: "#007AFF",
    initials: "VC",
    logoSvg: utilityLogoSvgByKey.vcard,
    qrTypes: ["vcard"],
  },
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
    description: "Small CTA chip below the QR.",
    bestFor: "Posters and flyers",
  },
  {
    value: "classic",
    label: "Classic",
    description: "Thin border with a compact title.",
    bestFor: "Business material",
  },
  {
    value: "ticket",
    label: "Ticket",
    description: "Light dashed frame for event material.",
    bestFor: "Events and coupons",
  },
  {
    value: "badge",
    label: "Soft plate",
    description: "Subtle label plate without heavy fill.",
    bestFor: "Cards and counters",
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
  url: "",
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
};

const initialDesignState: DesignState = {
  foregroundColor: "#0F172A",
  backgroundColor: "#FFFFFF",
  frameColor: "#2563EB",
  dotStyle: "square",
  cornerStyle: "square",
  margin: 16,
  logoSizeRatio: 0,
  errorCorrectionLevel: "Q",
  size: 1024,
  frameStyle: "none",
};

const qrGeneratorAuthDraftStorageKey = "decode:qr-generator:auth-draft:v1";

export function QRGenerator({
  showHeader = true,
  initialMode = "static",
}: QRGeneratorProps) {
  const [currentStep, setCurrentStep] = useState<WorkflowStep>("content");
  const [mode, setMode] = useState<QRMode>(initialMode);
  const [type, setType] = useState<QRType>("url");
  const [form, setForm] = useState<FormState>(initialFormState);
  const [design, setDesign] = useState<DesignState>(initialDesignState);
  const [selectedPreset, setSelectedPreset] = useState<DesignPreset>("clean");
  const [logoUrl, setLogoUrl] = useState("");
  const [logoChoice, setLogoChoice] = useState<LogoChoiceValue>("none");
  const [copied, setCopied] = useState(false);
  const [publishStatus, setPublishStatus] = useState<string | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishedDynamicPayload, setPublishedDynamicPayload] =
    useState<PublishedDynamicPayload | null>(null);
  const [authPromptVisible, setAuthPromptVisible] = useState(false);
  const [authPromptMessage, setAuthPromptMessage] = useState<string | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(false);
  const [authState, setAuthState] = useState<ClientAuthState>("checking");
  const [draftNotice, setDraftNotice] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const builderPanelRef = useRef<HTMLElement>(null);
  const builderTopRef = useRef<HTMLDivElement>(null);
  const stepHeadingRef = useRef<HTMLHeadingElement>(null);
  const previousStepRef = useRef(currentStep);

  const refreshAuthSession = useCallback(async () => {
    const session = await getFreshClientSession();

    if (session?.user) {
      setAuthState("authenticated");
      setAuthPromptVisible(false);
      setAuthPromptMessage(null);
      return session;
    }

    setAuthState("anonymous");
    return null;
  }, []);

  const validation = useMemo(
    () => validateContent({ type, mode, form }),
    [type, mode, form]
  );
  const dynamicPublishSignature = useMemo(
    () =>
      getDynamicPublishSignature({
        form,
        design,
        hasLogo: Boolean(logoUrl),
      }),
    [form, design, logoUrl]
  );
  const payload = useMemo(
    () =>
      buildPayload({
        type,
        mode,
        form,
        publishedDynamicPayload,
        dynamicPublishSignature,
      }),
    [type, mode, form, publishedDynamicPayload, dynamicPublishSignature]
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
      frameColor: getSafeHex(
        design.frameColor,
        initialDesignState.frameColor
      ),
    }),
    [design]
  );
  const scanability = useMemo(
    () => getScanability({ design, hasLogo: Boolean(logoUrl) }),
    [design, logoUrl]
  );
  const logoChoices = useMemo(
    () => getLogoChoiceOptions(type, logoChoice),
    [type, logoChoice]
  );
  const stepIndex = ["content", "design", "export"].indexOf(currentStep);
  const previewValue = useMemo(() => {
    if (payload?.value) return payload.value;

    if (mode === "dynamic" && type === "url" && validation.isValid) {
      try {
        return normalizeHttpUrl(form.url);
      } catch {
        return "";
      }
    }

    return "";
  }, [form.url, mode, payload?.value, type, validation.isValid]);
  const hasPreviewPayload = Boolean(previewValue);
  const qrOptions = useMemo<QROptions>(() => ({
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
  }), [
    previewValue,
    renderableDesign.size,
    renderableDesign.margin,
    renderableDesign.foregroundColor,
    renderableDesign.backgroundColor,
    renderableDesign.dotStyle,
    renderableDesign.cornerStyle,
    renderableDesign.errorCorrectionLevel,
    renderableDesign.frameStyle,
    logoUrl,
    renderableDesign.logoSizeRatio,
  ]);
  const mobileQrOptions = useMemo<QROptions>(() => ({
    ...qrOptions,
    width: 256,
    height: 256,
  }), [qrOptions]);

  const {
    ref: qrRef,
    download,
    downloadPdf,
    isReady,
  } = useQRCode(qrOptions);
  const {
    ref: mobileQrRef,
    isReady: isMobilePreviewReady,
  } = useQRCode(mobileQrOptions);

  useEffect(() => {
    const draft = readQRGeneratorAuthDraft();
    if (!draft) return;

    setCurrentStep(draft.currentStep);
    setMode(draft.mode);
    setType(draft.type);
    setForm(draft.form);
    setDesign(draft.design);
    setSelectedPreset(draft.selectedPreset);
    setLogoUrl(draft.logoUrl);
    setLogoChoice(draft.logoChoice);
    setDraftNotice("Restored your QR draft after sign-in.");
    window.localStorage.removeItem(qrGeneratorAuthDraftStorageKey);
  }, []);

  useEffect(() => {
    const handleFocus = () => {
      void refreshAuthSession();
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void refreshAuthSession();
      }
    };

    void refreshAuthSession();
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [refreshAuthSession]);

  useEffect(() => {
    if (previousStepRef.current === currentStep) return;

    previousStepRef.current = currentStep;
    builderPanelRef.current?.scrollTo({ top: 0 });
    builderTopRef.current?.scrollIntoView({ block: "start" });
    window.requestAnimationFrame(() => {
      stepHeadingRef.current?.focus({ preventScroll: true });
    });
  }, [currentStep]);

  useEffect(() => {
    if (!publishedDynamicPayload || !dynamicPublishSignature) return;
    if (publishedDynamicPayload.signature === dynamicPublishSignature) return;

    setPublishStatus(null);
  }, [publishedDynamicPayload, dynamicPublishSignature]);

  const goToStep = (nextStep: WorkflowStep) => {
    setCurrentStep(nextStep);
  };

  const persistAuthDraft = () => {
    if (typeof window === "undefined") return;

    const draft: QRGeneratorAuthDraft = {
      version: 1,
      currentStep,
      mode,
      type,
      form,
      design,
      selectedPreset,
      logoUrl,
      logoChoice,
    };

    window.localStorage.setItem(
      qrGeneratorAuthDraftStorageKey,
      JSON.stringify(draft)
    );
    setDraftNotice("Your QR draft is saved in this browser before sign-in.");
  };

  const handleFormChange = (key: keyof FormState, value: string | boolean) => {
    setForm((previous) => ({ ...previous, [key]: value }));
  };

  const handleModeChange = (nextMode: QRMode) => {
    setMode(nextMode);
    if (nextMode === "dynamic") {
      setType("url");
    }
  };

  const handlePresetChange = (nextPreset: DesignPreset) => {
    setSelectedPreset(nextPreset);

    if (nextPreset === "custom") return;

    setDesign((previous) => ({
      ...previous,
      ...designPresets[nextPreset],
    }));
  };

  const handleDesignChange: React.Dispatch<React.SetStateAction<DesignState>> = (
    nextDesign
  ) => {
    setSelectedPreset("custom");
    setDesign(nextDesign);
  };

  const handleResetDesign = () => {
    setSelectedPreset("clean");
    setLogoUrl("");
    setLogoChoice("none");
    setDesign(initialDesignState);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const applyLogoSafeDesign = () => {
    setDesign((previous) => ({
      ...previous,
      logoSizeRatio:
        previous.logoSizeRatio > 0
          ? previous.logoSizeRatio
          : defaultLogoSizeRatio,
    }));
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedPreset("custom");
    setLogoChoice("upload");
    const reader = new FileReader();
    reader.onloadend = () => setLogoUrl(reader.result as string);
    reader.readAsDataURL(file);
    applyLogoSafeDesign();
  };

  const handleRemoveLogo = () => {
    setSelectedPreset("custom");
    setLogoUrl("");
    setLogoChoice("none");
    setDesign((previous) => ({ ...previous, logoSizeRatio: 0 }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleLogoChoiceChange = (nextChoice: LogoChoiceValue) => {
    setSelectedPreset("custom");

    if (nextChoice === "upload") return;

    if (nextChoice === "none") {
      handleRemoveLogo();
      return;
    }

    const option = logoPresetOptions.find((item) => item.value === nextChoice);
    if (!option) return;

    setLogoChoice(nextChoice);
    setLogoUrl(createLogoPresetDataUrl(option));
    applyLogoSafeDesign();
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleCopyPayload = async () => {
    if (!payload?.value) {
      setPublishError("Publish to assign public link before copying the dynamic QR payload.");
      return;
    }

    await navigator.clipboard.writeText(payload.value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleContinueToDesign = () => {
    if (!validation.isValid) return;
    goToStep("design");
  };

  const handleDownloadSelected = async (format: ExportFormat) => {
    if (!isReady) return;

    if (!payload?.value) {
      setPublishError("Publish to assign public link before downloading this dynamic QR.");
      setPublishStatus(null);
      return;
    }

    setIsCheckingAuth(true);
    setPublishError(null);

    try {
      const session = await refreshAuthSession();

      if (!session?.user) {
        persistAuthDraft();
        setAuthPromptVisible(true);
        setAuthPromptMessage(
          `Sign in to download the ${format.toUpperCase()} export. Your current QR draft is saved in this browser.`
        );
        return;
      }

      setAuthPromptVisible(false);
      setAuthPromptMessage(null);

      if (mode === "dynamic") {
        if (!publishedDynamicPayload?.qrCodeId) {
          throw new Error("Publish this dynamic QR before downloading it.");
        }

        await downloadSavedDynamicQRCode({
          qrCodeId: publishedDynamicPayload.qrCodeId,
          format,
        });
        setPublishStatus(`Download ready for ${format.toUpperCase()} export.`);
        return;
      }

      if (format === "png") {
        await download("png");
        return;
      }

      if (format === "svg") {
        await download("svg");
        return;
      }

      await downloadPdf(form.title || "Decode QR Code");
    } catch (error) {
      if (error instanceof Error && error.message.toLowerCase().includes("sign in")) {
        persistAuthDraft();
        setAuthPromptVisible(true);
        setAuthPromptMessage(
          "We could not confirm your sign-in state. Sign in again to continue the download."
        );
      } else {
        setPublishError(
          error instanceof Error ? error.message : "Could not download QR code."
        );
      }
    } finally {
      setIsCheckingAuth(false);
    }
  };

  const downloadSavedDynamicQRCode = async ({
    qrCodeId,
    format,
  }: {
    readonly qrCodeId: string;
    readonly format: ExportFormat;
  }) => {
    const response = await fetch(
      `/api/qr-codes/${encodeURIComponent(qrCodeId)}/render`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ format }),
      }
    );
    const result = (await response.json()) as ApiResponse<RenderSavedQRCodeResponse>;

    if (!result.ok) {
      throw new Error(result.error?.message ?? "Could not render QR code export.");
    }

    if (!result.data?.downloadUrl) {
      throw new Error("The rendered QR export did not include a download URL.");
    }

    const link = document.createElement("a");
    link.href = result.data.downloadUrl;
    link.rel = "noopener noreferrer";
    link.download = `${form.title || "Decode QR Code"}.${format}`;
    document.body.append(link);
    link.click();
    link.remove();
  };

  const handlePublishDynamic = async () => {
    if (mode !== "dynamic" || type !== "url" || !validation.isValid) return;

    if (scanability.blocksPublish) {
      setPublishError("Resolve blocked scanability issues before publishing.");
      setPublishStatus(null);
      return;
    }

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
          content: { url: form.url },
          design: getApiDesign(design, Boolean(logoUrl)),
        }),
      });
      const result = (await response.json()) as ApiResponse<{
        qrCode: {
          id: string;
          slug: string | null;
          redirectUrl?: string | null;
          destinationUrl?: string | null;
        };
        payload: {
          value: string;
          destinationUrl?: string;
        };
      }>;

      if (!result.ok) {
        if (response.status === 401) {
          persistAuthDraft();
          setAuthPromptVisible(true);
          setAuthPromptMessage(
            "Sign in to publish this dynamic QR. Your current QR draft is saved in this browser."
          );
          return;
        }

        throw new Error(result.error?.message ?? "Could not publish QR code.");
      }

      const qrCodeId = result.data?.qrCode.id;
      const payloadValue = result.data?.payload.value;
      const destinationUrl = result.data?.payload.destinationUrl;

      if (!qrCodeId || !payloadValue || !destinationUrl || !dynamicPublishSignature) {
        throw new Error("Published QR response did not include a public payload.");
      }

      setPublishedDynamicPayload({
        qrCodeId,
        slug: result.data?.qrCode.slug ?? null,
        payloadValue,
        destinationUrl,
        signature: dynamicPublishSignature,
      });
      setAuthState("authenticated");
      setAuthPromptVisible(false);
      setAuthPromptMessage(null);
      setPublishStatus(`Published dynamic QR: ${payloadValue}`);
    } catch (error) {
      setPublishError(
        error instanceof Error ? error.message : "Could not publish QR code."
      );
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="space-y-4">
      {showHeader && (
        <PageHeader
          title="QR Generator"
          subtitle="Create static QR codes now, or prepare dynamic QR codes for editable destinations."
        />
      )}

      <MobilePreviewTray
        title={`${mode === "dynamic" ? "Dynamic" : "Static"} / ${getTypeLabel(type)}`}
        summary={payload?.summary ?? "Complete content to preview the payload."}
        preview={
          hasPreviewPayload ? (
            <div
              ref={mobileQrRef}
              className="w-full overflow-hidden rounded-md [&_canvas]:!h-auto [&_canvas]:!w-full"
            />
          ) : (
            <QRPayloadPlaceholder mode={mode} compact />
          )
        }
        status={{
          label: scanability.label,
          variant: getScanabilityBadgeVariant(scanability.state),
        }}
        isLoading={hasPreviewPayload && !isMobilePreviewReady}
        data-testid="mobile-preview-tray"
      />

      {draftNotice && (
        <Alert variant="success" title="Draft preserved">
          {draftNotice}
        </Alert>
      )}

      <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,65fr)_minmax(320px,30fr)] xl:items-start">
        <section
          ref={builderPanelRef}
          className="min-w-0 space-y-5 xl:pr-2"
          data-testid="qr-builder-panel"
        >
          <div ref={builderTopRef} className="min-w-0 scroll-mt-28">
            <ProgressStepper
              steps={workflowSteps}
              currentStep={Math.max(stepIndex, 0)}
            />
          </div>

          {currentStep === "content" && (
            <ContentStep
              headingRef={stepHeadingRef}
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
              headingRef={stepHeadingRef}
              design={design}
              logoUrl={logoUrl}
              logoChoice={logoChoice}
              logoChoices={logoChoices}
              selectedPreset={selectedPreset}
              scanability={scanability}
              onPresetChange={handlePresetChange}
              onDesignChange={handleDesignChange}
              onLogoChoiceChange={handleLogoChoiceChange}
              onLogoUpload={handleLogoUpload}
              onRemoveLogo={handleRemoveLogo}
              onResetDesign={handleResetDesign}
              logoInputRef={fileInputRef}
              onBack={() => goToStep("content")}
              onContinue={() => goToStep("export")}
            />
          )}

          {currentStep === "export" && (
            <ExportStep
              headingRef={stepHeadingRef}
              mode={mode}
              type={type}
              form={form}
              payload={payload}
              design={design}
              scanability={scanability}
              isReady={isReady}
              copied={copied}
              publishStatus={publishStatus}
              publishError={publishError}
              isPublishing={isPublishing}
              authPromptVisible={
                authPromptVisible && authState !== "authenticated"
              }
              authPromptMessage={authPromptMessage}
              isCheckingAuth={isCheckingAuth}
              onBack={() => goToStep("design")}
              onCopyPayload={handleCopyPayload}
              onDownloadSelected={(format) => void handleDownloadSelected(format)}
              onPublishDynamic={handlePublishDynamic}
              onBeforeSignIn={persistAuthDraft}
            />
          )}
        </section>

        <aside className="hidden min-w-0 xl:block xl:self-start">
          <div className="sticky top-24 space-y-3">
            <QRPreviewPanel
              isLoading={hasPreviewPayload && !isReady}
              variant="bare"
              previewClassName="max-w-[300px] p-4 shadow-[0_12px_36px_rgba(15,23,42,0.08)]"
            >
              {hasPreviewPayload ? (
                <QRFrame
                  key={design.frameStyle}
                  frameStyle={design.frameStyle}
                  frameColor={renderableDesign.frameColor}
                  title={form.title}
                >
                  <div
                    ref={qrRef}
                    className="w-full overflow-hidden rounded-lg [&_canvas]:!h-auto [&_canvas]:!w-full"
                  />
                </QRFrame>
              ) : (
                <QRPayloadPlaceholder mode={mode} />
              )}
              {logoUrl && (
                <IconButton
                  onClick={handleRemoveLogo}
                  aria-label="Remove QR logo"
                  variant="danger"
                  className="absolute right-6 top-6 h-9 w-9 rounded-full"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </IconButton>
              )}
            </QRPreviewPanel>

            <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={mode === "dynamic" ? "info" : "neutral"}>
                  {mode === "dynamic" ? "Dynamic" : "Static"}
                </Badge>
                <Badge variant="neutral">{getTypeLabel(type)}</Badge>
                {mode === "dynamic" && payload?.requiresPublish && (
                  <Badge variant="warning">Preview only</Badge>
                )}
                <Badge variant={getScanabilityBadgeVariant(scanability.state)}>
                  {scanability.label}
                </Badge>
              </div>
              <p className="mt-3 break-all text-sm leading-6 text-slate-600">
                {payload?.summary ?? "Complete the content step to preview payload."}
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function ContentStep({
  headingRef,
  mode,
  type,
  form,
  validationErrors,
  onModeChange,
  onTypeChange,
  onFormChange,
  onContinue,
}: {
  readonly headingRef: React.RefObject<HTMLHeadingElement | null>;
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
        <h2
          id="qr-step-content-heading"
          ref={headingRef}
          tabIndex={-1}
          className="scroll-mt-28 text-lg font-semibold text-slate-950 focus:outline-none"
        >
          1. Choose content
        </h2>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          Pick the QR behavior, then enter the minimum content needed.
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
          Dynamic QR codes require a website URL. Decode assigns the stable public link when you publish.
        </Alert>
      )}

      <ChoiceRail
        value={type}
        options={visibleTypeOptions.map((option) => ({
          value: option.value,
          label: option.shortLabel,
          disabled: option.disabled,
          ariaLabel: `${option.shortLabel} QR type`,
        }))}
        onChange={onTypeChange}
        label="QR type"
        size="sm"
        desktopColumns={4}
        getDescription={(option) => {
          const typeOption = typeOptions.find(
            (item) => item.value === option.value
          );

          return (
            <>
              <span className="font-medium text-slate-800">
                {typeOption?.label ?? option.label}:
              </span>{" "}
              {typeOption?.description}
              {isDynamic ? " Dynamic v1 supports URL codes only." : ""}
            </>
          );
        }}
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

      <p className="text-sm text-slate-600 sm:hidden" aria-live="polite">
        {validation.isValid
          ? "Content is valid."
          : "Complete the required fields to continue."}
      </p>
      <BuilderActionBar
        desktop={
          <>
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
          </>
        }
        mobile={
          <Button
            variant="primary"
            onClick={onContinue}
            disabled={!validation.isValid}
            className="w-full"
            rightIcon={<Sparkles className="h-4 w-4" aria-hidden="true" />}
          >
            Continue to design
          </Button>
        }
      />
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
  headingRef,
  design,
  logoUrl,
  logoChoice,
  logoChoices,
  selectedPreset,
  scanability,
  logoInputRef,
  onPresetChange,
  onDesignChange,
  onLogoChoiceChange,
  onLogoUpload,
  onRemoveLogo,
  onResetDesign,
  onBack,
  onContinue,
}: {
  readonly headingRef: React.RefObject<HTMLHeadingElement | null>;
  readonly design: DesignState;
  readonly logoUrl: string;
  readonly logoChoice: LogoChoiceValue;
  readonly logoChoices: readonly LogoChoiceOption[];
  readonly selectedPreset: DesignPreset;
  readonly scanability: ScanabilityResult;
  readonly logoInputRef: React.RefObject<HTMLInputElement | null>;
  readonly onPresetChange: (preset: DesignPreset) => void;
  readonly onDesignChange: React.Dispatch<React.SetStateAction<DesignState>>;
  readonly onLogoChoiceChange: (value: LogoChoiceValue) => void;
  readonly onLogoUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  readonly onRemoveLogo: () => void;
  readonly onResetDesign: () => void;
  readonly onBack: () => void;
  readonly onContinue: () => void;
}) {
  const shouldOpenAdvanced = scanability.state !== "ready";

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2
            id="qr-step-design-heading"
            ref={headingRef}
            tabIndex={-1}
            className="scroll-mt-28 text-lg font-semibold text-slate-950 focus:outline-none"
          >
            2. Design and guardrails
          </h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Start with a safe preset, then refine only what matters.
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onResetDesign}
          className="self-start"
        >
          Reset design
        </Button>
      </div>

      <ChoiceRail
        value={selectedPreset}
        options={designPresetOptions}
        onChange={onPresetChange}
        label="Template preset"
        size="md"
        desktopColumns={3}
        getDescription={(option) => (
          <>
            <span className="font-medium text-slate-800">
              {option.label}:
            </span>{" "}
            {option.description}
          </>
        )}
      />

      <FramePicker
        value={design.frameStyle}
        frameColor={design.frameColor}
        onChange={(value) =>
          onDesignChange((previous) => ({ ...previous, frameStyle: value }))
        }
      />

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(220px,320px)] lg:items-end">
          <div>
            <ColorInput
              label="Frame color hex"
              value={design.frameColor}
              onChange={(value) =>
                onDesignChange((previous) => ({
                  ...previous,
                  frameColor: normalizeHexDraft(value),
                }))
              }
            />
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Frame color changes the border, label bar, and call-to-action only.
              QR modules stay scan-safe unless changed in advanced controls.
            </p>
          </div>
          <div
            className="h-12 rounded-lg border border-slate-200 shadow-inner"
            style={{ backgroundColor: getSafeHex(design.frameColor, "#2563EB") }}
            aria-hidden="true"
          />
        </div>

        <div className="space-y-2">
          <p className="mt-4 flex items-center gap-2 text-sm font-medium text-slate-800">
            <Palette className="h-4 w-4" aria-hidden="true" />
            Frame color presets
          </p>
          <div className="flex flex-wrap gap-2">
            {colorPresets.map((preset) => (
              <ColorSwatch
                key={preset.value}
                color={preset.value}
                label={`Use ${preset.name} frame color`}
                isSelected={
                  design.frameColor.toLowerCase() === preset.value.toLowerCase()
                }
                onClick={() =>
                  onDesignChange((previous) => ({
                    ...previous,
                    frameColor: preset.value.toUpperCase(),
                  }))
                }
              />
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-end">
        <FileUpload
          id="qr-logo-upload"
          ref={logoInputRef}
          label="Logo"
          accept="image/*"
          onChange={onLogoUpload}
          hint="Upload a square PNG or SVG, or choose a preset icon below."
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

      <ChoiceRail
        value={logoChoice}
        options={logoChoices}
        onChange={onLogoChoiceChange}
        label="Logo icon"
        size="icon"
        desktopColumns={4}
        data-testid="logo-choice-picker"
        railTestId="logo-choice-rail"
        renderPreview={(option) => <LogoChoicePreview option={option} />}
        getDescription={(option) => (
          <>
            <span className="font-medium text-slate-800">
              {option.label}:
            </span>{" "}
            {option.description}
          </>
        )}
      />

      <ScanabilityMeter scanability={scanability} />

      <DisclosureSection
        title="Advanced design controls"
        description="QR module colors, dots, corners, and export source size."
        defaultOpen={shouldOpenAdvanced}
      >
        <div className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <ColorInput
              label="QR dots hex"
              value={design.foregroundColor}
              onChange={(value) =>
                onDesignChange((previous) => ({
                  ...previous,
                  foregroundColor: normalizeHexDraft(value),
                }))
              }
            />
            <ColorInput
              label="QR background hex"
              value={design.backgroundColor}
              onChange={(value) =>
                onDesignChange((previous) => ({
                  ...previous,
                  backgroundColor: normalizeHexDraft(value),
                }))
              }
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <ChoiceRail
              value={design.dotStyle}
              options={dotStyleOptions}
              onChange={(value) =>
                onDesignChange((previous) => ({
                  ...previous,
                  dotStyle: value,
                }))
              }
              label="Dot style"
              size="sm"
              desktopColumns={3}
            />
            <ChoiceRail
              value={design.cornerStyle}
              options={cornerStyleOptions}
              onChange={(value) =>
                onDesignChange((previous) => ({
                  ...previous,
                  cornerStyle: value,
                }))
              }
              label="Corner style"
              size="sm"
              desktopColumns={3}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
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
        </div>
      </DisclosureSection>

      <BuilderActionBar
        desktop={
          <>
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
          </>
        }
        desktopClassName="sm:justify-between"
        mobile={
          <div className="grid grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] gap-2">
            <Button variant="secondary" onClick={onBack} className="w-full">
              Back
            </Button>
            <Button
              variant="primary"
              onClick={onContinue}
              className="w-full"
              rightIcon={<FileDown className="h-4 w-4" aria-hidden="true" />}
            >
              Continue
            </Button>
          </div>
        }
      />
    </div>
  );
}

function LogoChoicePreview({
  option,
}: {
  readonly option: LogoChoiceOption;
}) {
  const Icon = option.icon;
  const isNone = option.value === "none";

  return (
    <span
      className={[
        "mx-auto flex h-11 w-11 items-center justify-center rounded-xl border shadow-sm",
        isNone
          ? "border-slate-200 bg-white text-slate-600"
          : "border-slate-200 bg-white",
      ].join(" ")}
      style={isNone ? undefined : { color: option.iconColor ?? option.color }}
      aria-hidden="true"
    >
      <Icon className="h-5 w-5" />
    </span>
  );
}

function ScanabilityMeter({
  scanability,
}: {
  readonly scanability: ScanabilityResult;
}) {
  const isReady = scanability.state === "ready";
  const icon = isReady ? (
    <ShieldCheck className="h-5 w-5" aria-hidden="true" />
  ) : (
    <AlertTriangle className="h-5 w-5" aria-hidden="true" />
  );

  return (
    <section
      aria-live="polite"
      aria-label="Scanability meter"
      className={`rounded-xl border p-4 ${getScanabilityPanelClassName(
        scanability.state
      )}`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 gap-3">
          <span
            className={`mt-0.5 shrink-0 ${getScanabilityIconClassName(
              scanability.state
            )}`}
          >
            {icon}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-950">
              {scanability.label}
            </p>
            <p className="mt-1 text-sm leading-5 text-slate-700">
              {scanability.description}
            </p>
          </div>
        </div>
        <Badge
          variant={getScanabilityBadgeVariant(scanability.state)}
          className="self-start"
        >
          {scanability.label}
        </Badge>
      </div>
      {scanability.reasons.length > 0 && (
        <ul className="mt-3 space-y-1.5 text-sm leading-5 text-slate-700">
          {scanability.reasons.map((reason) => (
            <li key={reason} className="flex gap-2">
              <span aria-hidden="true">-</span>
              <span>{reason}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function ExportStep({
  headingRef,
  mode,
  type,
  form,
  payload,
  design,
  scanability,
  isReady,
  copied,
  publishStatus,
  publishError,
  isPublishing,
  authPromptVisible,
  authPromptMessage,
  isCheckingAuth,
  onBack,
  onCopyPayload,
  onDownloadSelected,
  onPublishDynamic,
  onBeforeSignIn,
}: {
  readonly headingRef: React.RefObject<HTMLHeadingElement | null>;
  readonly mode: QRMode;
  readonly type: QRType;
  readonly form: FormState;
  readonly payload: PayloadResult | null;
  readonly design: DesignState;
  readonly scanability: ScanabilityResult;
  readonly isReady: boolean;
  readonly copied: boolean;
  readonly publishStatus: string | null;
  readonly publishError: string | null;
  readonly isPublishing: boolean;
  readonly authPromptVisible: boolean;
  readonly authPromptMessage: string | null;
  readonly isCheckingAuth: boolean;
  readonly onBack: () => void;
  readonly onCopyPayload: () => void;
  readonly onDownloadSelected: (format: ExportFormat) => void;
  readonly onPublishDynamic: () => void;
  readonly onBeforeSignIn: () => void;
}) {
  const [exportFormat, setExportFormat] = useState<ExportFormat>("png");
  const authPromptRef = useRef<HTMLDivElement>(null);
  const selectedExport =
    exportFormatOptions.find((option) => option.value === exportFormat) ??
    exportFormatOptions[0];
  const canUsePayload = Boolean(payload?.value);
  const handleDownloadSelected = () => {
    onDownloadSelected(exportFormat);
  };

  useEffect(() => {
    if (!authPromptVisible) return;

    window.requestAnimationFrame(() => {
      authPromptRef.current?.scrollIntoView({
        block: "center",
        behavior: "smooth",
      });
    });
  }, [authPromptVisible, authPromptMessage]);

  return (
    <div className="space-y-5">
      <div>
        <h2
          id="qr-step-export-heading"
          ref={headingRef}
          tabIndex={-1}
          className="scroll-mt-28 text-lg font-semibold text-slate-950 focus:outline-none"
        >
          3. Export and publish
        </h2>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          Download the QR or publish a dynamic redirect when signed in.
        </p>
      </div>

      <ChoiceRail
        value={exportFormat}
        options={exportFormatOptions}
        onChange={setExportFormat}
        label="Export format"
        size="md"
        desktopColumns={3}
        getDescription={(option) => (
          <>
            <span className="font-medium text-slate-800">
              {option.label}:
            </span>{" "}
            {option.value === "png"
              ? `${design.size} x ${design.size} ${option.description.toLowerCase()}`
              : option.description}
          </>
        )}
      />

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
            disabled={!canUsePayload}
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
              disabled={scanability.blocksPublish}
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
          {payload?.isStale
            ? "Destination or design changed after publish. Publish again before downloading or copying the updated dynamic QR."
            : payload?.requiresPublish
              ? "Publish to assign public link before copying or downloading this dynamic QR."
              : "This dynamic QR has a server-assigned public link."}{" "}
          Destination: {form.url || "Add a destination URL"}.
        </Alert>
      )}
      {mode === "dynamic" && scanability.blocksPublish && (
        <Alert variant="danger" title="Publish blocked">
          Resolve blocked scanability issues before publishing this dynamic QR.
        </Alert>
      )}
      {publishStatus && <Alert variant="success">{publishStatus}</Alert>}
      {publishError && <Alert variant="danger">{publishError}</Alert>}
      {authPromptVisible && (
        <div ref={authPromptRef}>
          <OAuthSignInPanel
            callbackUrl="/generate"
            title="Sign in to finish export"
            description={
              authPromptMessage ??
              "Sign in with Google or GitHub to download or publish from this QR workspace."
            }
            className="border-sky-200 bg-sky-50/50"
            onBeforeSignIn={onBeforeSignIn}
          />
        </div>
      )}

      <BuilderActionBar
        desktop={
          <>
            <Button variant="secondary" onClick={onBack}>
              Back to design
            </Button>
            <Button
              variant="primary"
              onClick={handleDownloadSelected}
              disabled={!isReady || isCheckingAuth || !canUsePayload}
              isLoading={isCheckingAuth}
              leftIcon={<Download className="h-4 w-4" aria-hidden="true" />}
            >
              Download {selectedExport.label}
            </Button>
          </>
        }
        desktopClassName="sm:justify-between"
        mobile={
          <div className="grid grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] gap-2">
            <Button variant="secondary" onClick={onBack} className="w-full">
              Back
            </Button>
            <Button
              variant="primary"
              onClick={handleDownloadSelected}
              disabled={!isReady || isCheckingAuth || !canUsePayload}
              isLoading={isCheckingAuth}
              className="w-full"
              leftIcon={<Download className="h-4 w-4" aria-hidden="true" />}
            >
              Download {selectedExport.label}
            </Button>
          </div>
        }
      />
    </div>
  );
}

function FramePicker({
  value,
  frameColor,
  onChange,
}: {
  readonly value: FrameStyle;
  readonly frameColor: string;
  readonly onChange: (value: FrameStyle) => void;
}) {
  return (
    <ChoiceRail
      value={value}
      options={frameOptions.map((option) => ({
        value: option.value,
        label: option.label,
        ariaLabel: `Select ${option.label} frame`,
      }))}
      onChange={onChange}
      label="QR frame"
      size="lg"
      desktopColumns={3}
      data-testid="frame-picker"
      railTestId="frame-picker-rail"
      renderPreview={(option) => (
        <FrameThumbnail
          frameStyle={option.value as FrameStyle}
          frameColor={frameColor}
        />
      )}
      getDescription={(option) => {
        const frameOption = frameOptions.find(
          (item) => item.value === option.value
        );

        return (
          <>
            <span className="font-medium text-slate-800">
              {frameOption?.label ?? option.label}:
            </span>{" "}
            {frameOption?.description} Best for{" "}
            {frameOption?.bestFor.toLowerCase()}.
          </>
        );
      }}
    />
  );
}

function FrameThumbnail({
  frameStyle,
  frameColor,
}: {
  readonly frameStyle: FrameStyle;
  readonly frameColor: string;
}) {
  return (
    <div className="flex h-24 items-center justify-center overflow-hidden rounded-lg border border-slate-100 bg-white p-2 sm:h-28">
      <QRFrame
        frameStyle={frameStyle}
        frameColor={frameColor}
        title="Scan me"
        isThumbnail
      >
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

function QRPayloadPlaceholder({
  mode,
  compact = false,
}: {
  readonly mode: QRMode;
  readonly compact?: boolean;
}) {
  const isDynamic = mode === "dynamic";

  return (
    <div
      className={
        compact
          ? "flex aspect-square w-full min-w-0 items-center justify-center rounded-md border border-dashed border-slate-300 bg-slate-50 text-sky-700"
          : "flex aspect-square w-full min-w-0 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-center"
      }
      data-testid="qr-payload-placeholder"
    >
      <span
        className={
          compact
            ? "inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white shadow-sm ring-1 ring-slate-200"
            : "inline-flex h-10 w-10 items-center justify-center rounded-lg bg-white text-sky-700 shadow-sm ring-1 ring-slate-200"
        }
      >
        <AlertTriangle
          className={compact ? "h-4 w-4" : "h-5 w-5"}
          aria-hidden="true"
        />
      </span>
      {!compact && (
        <>
          <p className="text-sm font-semibold text-slate-900">
            {isDynamic ? "Add destination" : "Add content"}
          </p>
          <p className="max-w-48 text-xs leading-5 text-slate-600">
            {isDynamic
              ? "Enter a valid destination URL to preview before publishing."
              : "Complete the content step to render a QR preview."}
          </p>
        </>
      )}
    </div>
  );
}

function QRFrame({
  frameStyle,
  frameColor,
  title,
  isThumbnail = false,
  children,
}: {
  readonly frameStyle: FrameStyle;
  readonly frameColor: string;
  readonly title: string;
  readonly isThumbnail?: boolean;
  readonly children: React.ReactNode;
}) {
  const safeTitle = title.trim() || "Scan me";
  const displayTitle = getShortFrameTitle(safeTitle);
  const accentColor = getSafeHex(frameColor, initialDesignState.frameColor);
  const accentSoft = hexToRgba(accentColor, 0.1);
  const accentSofter = hexToRgba(accentColor, 0.06);
  const qrSlotClass = isThumbnail
    ? "mx-auto w-14"
    : "mx-auto w-[84%] max-w-[208px]";
  const frameWidthClass = isThumbnail
    ? "w-full max-w-[124px]"
    : "w-full max-w-[248px]";

  if (frameStyle === "none") {
    return (
      <div
        className={
          isThumbnail
            ? "mx-auto w-16 rounded-md bg-white p-1 ring-1 ring-slate-100"
            : "mx-auto w-full max-w-[232px] rounded-xl bg-white p-1 ring-1 ring-slate-100"
        }
      >
        {children}
      </div>
    );
  }

  if (frameStyle === "scan-me") {
    return (
      <div
        className={`${frameWidthClass} mx-auto rounded-2xl border-4 bg-white text-center shadow-sm`}
        style={{ borderColor: accentColor }}
      >
        <div className={isThumbnail ? "px-3 pt-2" : "px-4 pt-4"}>
          <div className={qrSlotClass}>{children}</div>
        </div>
        <p
          className={
            isThumbnail
              ? "mx-auto my-1 inline-flex rounded-full px-2 py-0.5 text-[7px] font-semibold uppercase text-white"
              : "mx-auto my-2.5 inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-normal text-white"
          }
          style={{ backgroundColor: accentColor }}
        >
          Scan me
        </p>
      </div>
    );
  }

  if (frameStyle === "classic") {
    return (
      <div
        className={`${frameWidthClass} mx-auto overflow-hidden rounded-2xl border-4 bg-white text-center shadow-sm`}
        style={{ borderColor: accentColor }}
      >
        <p
          title={safeTitle}
          className={
            isThumbnail
              ? "truncate px-3 py-1 text-[7px] font-bold uppercase text-white"
              : "truncate px-5 py-2 text-xs font-bold uppercase tracking-normal text-white"
          }
          style={{ backgroundColor: accentColor }}
        >
          {displayTitle}
        </p>
        <div className={isThumbnail ? "p-2" : "p-4"}>
          <div className={qrSlotClass}>{children}</div>
        </div>
      </div>
    );
  }

  if (frameStyle === "ticket") {
    return (
      <div
        className={`${frameWidthClass} mx-auto rounded-2xl border-4 bg-white text-center shadow-sm`}
        style={{ borderColor: accentColor }}
      >
        <div className={isThumbnail ? "px-3 pt-2" : "px-4 pt-4"}>
          <div className={qrSlotClass}>{children}</div>
        </div>
        <span
          className={
            isThumbnail
              ? "mx-auto block h-0 w-0 border-x-[7px] border-b-[7px] border-x-transparent"
              : "mx-auto block h-0 w-0 border-x-[11px] border-b-[11px] border-x-transparent"
          }
          style={{ borderBottomColor: accentColor }}
          aria-hidden="true"
        />
        <p
          className={
            isThumbnail
              ? "rounded-b-xl px-3 py-1 text-[7px] font-bold uppercase text-white"
              : "rounded-b-xl px-5 py-2 text-[11px] font-bold uppercase tracking-normal text-white"
          }
          style={{ backgroundColor: accentColor }}
        >
          Scan me
        </p>
      </div>
    );
  }

  if (frameStyle === "badge") {
    return (
      <div
        className={`${frameWidthClass} mx-auto rounded-2xl border bg-white text-center shadow-sm`}
        style={{ borderColor: accentSoft, backgroundColor: accentSofter }}
      >
        <div className={isThumbnail ? "p-2 pb-1" : "p-4 pb-2"}>
          <div
            className="rounded-xl bg-white p-2 ring-1"
            style={{ boxShadow: `inset 0 0 0 1px ${accentSoft}` }}
          >
            <div className={qrSlotClass}>{children}</div>
          </div>
        </div>
        <p
          title={safeTitle}
          className={
            isThumbnail
              ? "truncate px-3 pb-2 text-[7px] font-bold uppercase"
              : "truncate px-4 pb-3 text-xs font-bold uppercase"
          }
          style={{ color: accentColor }}
        >
          {displayTitle}
        </p>
      </div>
    );
  }

  return (
    <div
      className={`${frameWidthClass} mx-auto rounded-2xl border bg-white text-center shadow-sm`}
      style={{ borderColor: accentSoft }}
    >
      <p
        className={
          isThumbnail
            ? "px-3 pt-2 text-[7px] font-bold uppercase"
            : "px-5 pt-4 text-[11px] font-bold uppercase tracking-normal"
        }
        style={{ color: accentColor }}
      >
        Scan
      </p>
      <div className={isThumbnail ? "p-2 pt-1" : "p-4 pt-2"}>
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
  publishedDynamicPayload,
  dynamicPublishSignature,
}: {
  readonly type: QRType;
  readonly mode: QRMode;
  readonly form: FormState;
  readonly publishedDynamicPayload?: PublishedDynamicPayload | null;
  readonly dynamicPublishSignature?: string | null;
}): PayloadResult | null {
  try {
    if (mode === "dynamic") {
      const destinationUrl = normalizeHttpUrl(form.url);
      const hasCurrentPublishedPayload =
        publishedDynamicPayload &&
        dynamicPublishSignature &&
        publishedDynamicPayload.signature === dynamicPublishSignature;

      if (hasCurrentPublishedPayload) {
        return {
          value: publishedDynamicPayload.payloadValue,
          destinationUrl,
          summary: `${publishedDynamicPayload.payloadValue} -> ${destinationUrl}`,
        };
      }

      return {
        value: "",
        destinationUrl,
        summary: publishedDynamicPayload
          ? `Publish again to update public link -> ${destinationUrl}`
          : `Publish to assign public link -> ${destinationUrl}`,
        requiresPublish: true,
        isStale: Boolean(publishedDynamicPayload),
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

function getScanability({
  design,
  hasLogo,
}: {
  readonly design: DesignState;
  readonly hasLogo: boolean;
}): ScanabilityResult {
  const reasons: string[] = [];
  let isBlocked = false;
  const hasValidColors =
    isValidHexColor(design.foregroundColor) &&
    isValidHexColor(design.backgroundColor);

  if (!hasValidColors) {
    isBlocked = true;
    reasons.push("Enter valid 6-digit foreground and background hex colors.");
  } else {
    const contrastRatio = getContrastRatio(
      design.foregroundColor,
      design.backgroundColor
    );

    if (contrastRatio < 2) {
      isBlocked = true;
      reasons.push(
        "Increase foreground and background contrast before publishing."
      );
    } else if (contrastRatio < 3) {
      reasons.push(
        "Increase color contrast for more reliable scanning in low light."
      );
    }
  }

  if (design.margin < 2) {
    isBlocked = true;
    reasons.push("Increase the quiet zone to at least 4 modules.");
  } else if (design.margin < 4) {
    reasons.push("Quiet zone is small. Use margin 4 or higher.");
  }

  if (hasLogo && design.logoSizeRatio > 0.3) {
    isBlocked = true;
    reasons.push("Reduce logo size below 30% so it does not cover QR modules.");
  } else if (hasLogo && design.logoSizeRatio > defaultLogoSizeRatio) {
    reasons.push("Logo size is above 26% and may cover required QR modules.");
  }

  if (
    hasLogo &&
    !["Q", "H"].includes(design.errorCorrectionLevel)
  ) {
    reasons.push("Use quartile or high error correction when adding a logo.");
  }

  if (isBlocked) {
    return {
      state: "blocked",
      label: "Blocked for publish",
      description: "Resolve the required scanability fixes before publishing.",
      reasons,
      blocksPublish: true,
    };
  }

  if (reasons.length > 0) {
    return {
      state: "needs-attention",
      label: "Needs attention",
      description: "The QR can be exported, but these settings should be fixed.",
      reasons,
      blocksPublish: false,
    };
  }

  return {
    state: "ready",
    label: "Ready",
    description: "Design passes current scanability checks.",
    reasons,
    blocksPublish: false,
  };
}

function getScanabilityBadgeVariant(
  state: ScanabilityState
): "success" | "warning" | "danger" {
  if (state === "blocked") return "danger";
  if (state === "needs-attention") return "warning";

  return "success";
}

function getScanabilityPanelClassName(state: ScanabilityState): string {
  if (state === "blocked") return "border-rose-200 bg-rose-50";
  if (state === "needs-attention") return "border-amber-200 bg-amber-50";

  return "border-emerald-200 bg-emerald-50";
}

function getScanabilityIconClassName(state: ScanabilityState): string {
  if (state === "blocked") return "text-rose-700";
  if (state === "needs-attention") return "text-amber-700";

  return "text-emerald-700";
}

function getLogoChoiceOptions(
  type: QRType,
  currentChoice: LogoChoiceValue
): readonly LogoChoiceOption[] {
  const options = logoPresetOptions.filter(
    (option) => !option.qrTypes || option.qrTypes.includes(type)
  );
  const currentPreset = logoPresetOptions.find(
    (option) => option.value === currentChoice
  );
  const shouldIncludeCurrentPreset =
    currentPreset && !options.some((option) => option.value === currentChoice);

  return [
    noLogoChoice,
    ...(currentChoice === "upload" ? [uploadedLogoChoice] : []),
    ...options,
    ...(shouldIncludeCurrentPreset ? [currentPreset] : []),
  ];
}

function createLogoPresetDataUrl(option: LogoChoiceOption): string {
  if (option.logoSvg) {
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(option.logoSvg)}`;
  }

  const safeText = option.initials.replace(/[<>&]/g, "");
  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">`,
    `<rect x="8" y="8" width="112" height="112" rx="28" fill="#FFFFFF"/>`,
    `<rect x="8" y="8" width="112" height="112" rx="28" fill="${option.color}" fill-opacity="0.1"/>`,
    `<text x="64" y="75" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="${safeText.length > 2 ? 26 : 34}" font-weight="700" fill="${option.color}">${safeText}</text>`,
    `</svg>`,
  ].join("");

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
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
    frameColor: getSafeHex(design.frameColor, initialDesignState.frameColor),
    margin: design.margin,
    logoSizeRatio: hasLogo ? design.logoSizeRatio : 0,
    dotStyle: design.dotStyle,
    cornerStyle: design.cornerStyle,
    errorCorrectionLevel: design.errorCorrectionLevel,
    size: design.size,
    frameStyle: design.frameStyle,
  };
}

function readQRGeneratorAuthDraft(): QRGeneratorAuthDraft | null {
  if (typeof window === "undefined") return null;

  try {
    const rawDraft = window.localStorage.getItem(qrGeneratorAuthDraftStorageKey);
    if (!rawDraft) return null;

    const draft = JSON.parse(rawDraft) as unknown;
    if (!isRecord(draft) || draft.version !== 1) return null;

    const form = isRecord(draft.form)
      ? ({ ...initialFormState, ...draft.form } as FormState)
      : initialFormState;
    const design = isRecord(draft.design)
      ? ({ ...initialDesignState, ...draft.design } as DesignState)
      : initialDesignState;

    return {
      version: 1,
      currentStep: isWorkflowStep(draft.currentStep)
        ? draft.currentStep
        : "export",
      mode: isQRMode(draft.mode) ? draft.mode : "static",
      type: isQRType(draft.type) ? draft.type : "url",
      form,
      design,
      selectedPreset: isDesignPreset(draft.selectedPreset)
        ? draft.selectedPreset
        : "custom",
      logoUrl: typeof draft.logoUrl === "string" ? draft.logoUrl : "",
      logoChoice: isLogoChoiceValue(draft.logoChoice)
        ? draft.logoChoice
        : "none",
    };
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isWorkflowStep(value: unknown): value is WorkflowStep {
  return value === "content" || value === "design" || value === "export";
}

function isQRMode(value: unknown): value is QRMode {
  return value === "static" || value === "dynamic";
}

function isQRType(value: unknown): value is QRType {
  return typeOptions.some((option) => option.value === value);
}

function isDesignPreset(value: unknown): value is DesignPreset {
  return designPresetOptions.some((option) => option.value === value);
}

function isLogoChoiceValue(value: unknown): value is LogoChoiceValue {
  if (value === "none" || value === "upload") return true;

  return logoPresetOptions.some((option) => option.value === value);
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

function getDynamicPublishSignature({
  form,
  design,
  hasLogo,
}: {
  readonly form: FormState;
  readonly design: DesignState;
  readonly hasLogo: boolean;
}): string | null {
  try {
    return JSON.stringify({
      destinationUrl: normalizeHttpUrl(form.url),
      design: getApiDesign(design, hasLogo),
    });
  } catch {
    return null;
  }
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

function hexToRgba(value: string, alpha: number): string {
  const safeValue = getSafeHex(value, initialDesignState.frameColor);
  const red = Number.parseInt(safeValue.slice(1, 3), 16);
  const green = Number.parseInt(safeValue.slice(3, 5), 16);
  const blue = Number.parseInt(safeValue.slice(5, 7), 16);

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
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
