import type {
  CornerStyle,
  DesignPreset,
  DesignState,
  DotStyle,
  ErrorCorrectionLevel,
  ExportFormat,
  FormState,
  FrameStyle,
  QRType,
  WorkflowStep,
} from "./types";

export const workflowSteps = [
  { label: "Content" },
  { label: "Design" },
  { label: "Export" },
];

export const workflowStepOrder: readonly WorkflowStep[] = [
  "content",
  "design",
  "export",
];

export const typeOptions: {
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

export const modeOptions = [
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

export const dotStyleOptions: { value: DotStyle; label: string }[] = [
  { value: "square", label: "Square" },
  { value: "rounded", label: "Rounded" },
  { value: "dots", label: "Dots" },
  { value: "classy", label: "Classy" },
  { value: "extra-rounded", label: "Extra Rounded" },
];

export const cornerStyleOptions: { value: CornerStyle; label: string }[] = [
  { value: "square", label: "Square" },
  { value: "rounded", label: "Rounded" },
  { value: "dot", label: "Dot" },
];

export const errorCorrectionOptions: {
  readonly value: ErrorCorrectionLevel;
  readonly label: string;
}[] = [
  { value: "L", label: "Low (7%)" },
  { value: "M", label: "Medium (15%)" },
  { value: "Q", label: "Quartile (25%)" },
  { value: "H", label: "High (30%)" },
];

// Quiet-zone (margin) bounds mirror the server schema (`server/qr/schemas.ts`),
// which accepts an integer margin between 0 and 16.
export const minMargin = 0;
export const maxMargin = 16;

// Logo size bounds mirror the server schema's `logoSizeRatio` (0 - 0.35). The
// scanability meter warns above `defaultLogoSizeRatio` and blocks above 0.3.
export const minLogoSizeRatio = 0.15;
export const maxLogoSizeRatio = 0.35;

export const exportFormatOptions: {
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

export const colorPresets = [
  { name: "Blue", value: "#2563EB" },
  { name: "Violet", value: "#2B16D0" },
  { name: "Red", value: "#D01616" },
  { name: "Emerald", value: "#059669" },
  { name: "Cyan", value: "#0891B2" },
  { name: "Amber", value: "#B45309" },
  { name: "Rose", value: "#BE123C" },
  { name: "Ink", value: "#0F172A" },
];

export const backgroundColorPresets = [
  { name: "White", value: "#FFFFFF" },
  { name: "Mist", value: "#F8FAFC" },
  { name: "Ice", value: "#EFF6FF" },
  { name: "Mint", value: "#ECFDF5" },
  { name: "Warm", value: "#FFFBEB" },
];

export type PresetDesignState = Pick<
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

export const defaultLogoSizeRatio = 0.26;

export const designPresetOptions: {
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

export const designPresets: Record<
  Exclude<DesignPreset, "custom">,
  PresetDesignState
> = {
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

export const frameOptions: {
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

export const thumbnailQrActiveCells = new Set([
  0, 1, 2, 6, 7, 8, 9, 11, 15, 17, 18, 19, 20, 24, 25, 26, 28, 31, 33, 36, 37,
  40, 43, 44, 45, 47, 49, 52, 55, 57, 60, 61, 62, 63, 64, 67, 69, 70, 72, 73,
  74, 78, 80,
]);

export const initialFormState: FormState = {
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

export const initialDesignState: DesignState = {
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

export const qrGeneratorAuthDraftStorageKey =
  "decode:qr-generator:auth-draft:v1";
