import { isDynamicCapableType } from "./constants";
import type { FormState, QRMode, QRType } from "./types";

export function validateContent({
  type,
  mode,
  form,
}: {
  readonly type: QRType;
  readonly mode: QRMode;
  readonly form: FormState;
}): { isValid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  if (mode === "dynamic" && !isDynamicCapableType(type)) {
    errors.type =
      "Dynamic QR codes support website URL, text, and contact card content.";
  }

  if (type === "url") {
    const urlError = getHttpUrlValidationError(form.url);
    if (urlError) {
      errors.url = urlError;
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

  if (type === "vcard" && form.vcardWebsite) {
    const websiteError = getHttpUrlValidationError(form.vcardWebsite);
    if (websiteError) {
      errors.vcardWebsite = websiteError;
    }
  }

  return { isValid: Object.keys(errors).length === 0, errors };
}

export function normalizeHttpUrl(value: string): string {
  const trimmedValue = value.trim();
  const validationError = getHttpUrlValidationError(trimmedValue);
  if (validationError) {
    throw new Error(validationError);
  }

  const hasScheme = /^[a-z][a-z0-9+.-]*:/i.test(trimmedValue);
  const candidate = hasScheme ? trimmedValue : `https://${trimmedValue}`;
  const url = new URL(candidate);

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Unsupported URL protocol.");
  }

  return url.toString();
}

export function getHttpUrlValidationError(value: string): string | null {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return "Enter a website URL.";
  }

  if (/\s/.test(trimmedValue)) {
    return "Remove spaces from the URL.";
  }

  if (/^https?\/\//i.test(trimmedValue)) {
    return "Add a colon after the protocol, for example https://example.com.";
  }

  if (/^https?:[^/]/i.test(trimmedValue) || /^https?:\/[^/]/i.test(trimmedValue)) {
    return "Use https:// or http:// with two slashes.";
  }

  const hasScheme = /^[a-z][a-z0-9+.-]*:/i.test(trimmedValue);
  if (hasScheme && !/^https?:/i.test(trimmedValue)) {
    return "Use http:// or https:// URLs only.";
  }

  try {
    const candidate = hasScheme ? trimmedValue : `https://${trimmedValue}`;
    const url = new URL(candidate);

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return "Use http:// or https:// URLs only.";
    }

    if (!url.hostname) {
      return "Enter a valid host name.";
    }

    return null;
  } catch {
    return "Enter a valid http or https URL.";
  }
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function normalizePhone(value: string): string {
  return value.replace(/[^\d+]/g, "");
}
