import type { ComponentType } from "react";

export type WorkflowStep = "content" | "design" | "export";
export type QRMode = "static" | "dynamic";
export type QRType =
  | "url"
  | "text"
  | "email"
  | "phone"
  | "sms"
  | "whatsapp"
  | "wifi"
  | "vcard";
export type DotStyle = "square" | "rounded" | "dots" | "classy" | "extra-rounded";
export type CornerStyle = "square" | "rounded" | "dot";
export type ErrorCorrectionLevel = "L" | "M" | "Q" | "H";
/**
 * "auto" derives the level from mode/logo/payload (see
 * lib/qr/error-correction.ts); "user" pins design.errorCorrectionLevel.
 */
export type ErrorCorrectionSource = "auto" | "user";
export type ExportFormat = "png" | "svg" | "pdf";
export type FrameStyle =
  | "none"
  | "scan-me"
  | "classic"
  | "ticket"
  | "badge"
  | "minimal";
export type DesignTab = "preset" | "frame" | "color" | "logo";
export type ClientAuthState = "checking" | "authenticated" | "anonymous";
export type LogoChoiceValue =
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
export type DesignPreset =
  | "clean"
  | "corporate"
  | "event"
  | "menu"
  | "social"
  | "coupon"
  | "custom";
export type ScanabilityState = "ready" | "needs-attention" | "blocked";

export interface QRGeneratorProps {
  showHeader?: boolean;
  initialMode?: QRMode;
  returnTo?: string | null;
}

export interface FormState {
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

export interface DesignState {
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

export interface PayloadResult {
  value: string;
  destinationUrl?: string;
  summary: string;
  requiresPublish?: boolean;
  isStale?: boolean;
}

export interface PublishedDynamicPayload {
  readonly qrCodeId: string;
  readonly slug: string | null;
  readonly payloadValue: string;
  readonly destinationUrl: string;
  readonly signature: string;
}

export interface ScanabilityResult {
  state: ScanabilityState;
  label: string;
  description: string;
  reasons: string[];
  blocksPublish: boolean;
}

export interface LogoChoiceOption {
  value: LogoChoiceValue;
  label: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  color: string;
  iconColor?: string;
  initials: string;
  logoSvg?: string;
  logoAssetPath?: string;
  qrTypes?: readonly QRType[];
  ariaLabel?: string;
}

export interface ApiResponse<TData> {
  ok: boolean;
  data?: TData;
  error?: { message: string };
}

export interface RenderSavedQRCodeResponse {
  readonly downloadUrl: string;
}

export interface QRGeneratorAuthDraft {
  readonly version: 1;
  readonly currentStep: WorkflowStep;
  readonly mode: QRMode;
  readonly type: QRType;
  readonly form: FormState;
  readonly design: DesignState;
  readonly selectedPreset: DesignPreset;
  readonly logoUrl: string;
  readonly logoChoice: LogoChoiceValue;
  /** Optional for drafts written before adaptive error correction shipped. */
  readonly ecSource?: ErrorCorrectionSource;
}
