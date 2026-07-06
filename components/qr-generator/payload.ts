import { getApiDesign } from "./design";
import { normalizeHttpUrl, normalizePhone } from "./validation";
import type {
  DesignState,
  FormState,
  PayloadResult,
  PublishedDynamicPayload,
  QRMode,
  QRType,
} from "./types";

export function buildPayload({
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
      // Only URL dynamic codes redirect to an external destination; text and
      // contact-card dynamics are hosted by Decode behind the same /r/<slug>.
      const destinationUrl = type === "url" ? normalizeHttpUrl(form.url) : undefined;
      const target = destinationUrl ?? "Decode-hosted content";
      const hasCurrentPublishedPayload =
        publishedDynamicPayload &&
        dynamicPublishSignature &&
        publishedDynamicPayload.signature === dynamicPublishSignature;

      if (hasCurrentPublishedPayload) {
        return {
          value: publishedDynamicPayload.payloadValue,
          destinationUrl,
          summary: `${publishedDynamicPayload.payloadValue} -> ${target}`,
        };
      }

      return {
        value: "",
        destinationUrl,
        summary: publishedDynamicPayload
          ? `Publish again to update public link -> ${target}`
          : `Publish to assign public link -> ${target}`,
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
      // URLSearchParams encodes spaces as "+", which several mail clients render
      // literally in the subject/body. Use percent-encoded spaces instead.
      const query = params.toString().replace(/\+/g, "%20");
      const value = `mailto:${form.email}${query ? `?${query}` : ""}`;
      return { value, summary: value };
    }

    if (type === "phone") {
      const value = `tel:${normalizePhone(form.phone)}`;
      return { value, summary: value };
    }

    if (type === "sms") {
      // SMSTO uses ":" as a field delimiter, so strip newlines/returns that
      // would otherwise corrupt the payload structure for some scanners.
      const message = sanitizeSmsMessage(form.smsMessage);
      const value = `SMSTO:${normalizePhone(form.smsPhone)}:${message}`;
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

export function buildApiContent(
  type: QRType,
  form: FormState
): Record<string, unknown> {
  switch (type) {
    case "url":
      return { url: form.url };
    case "text":
      return { text: form.text };
    case "email":
      return {
        email: form.email,
        ...(form.emailSubject ? { subject: form.emailSubject } : {}),
        ...(form.emailBody ? { body: form.emailBody } : {}),
      };
    case "phone":
      return { phone: form.phone };
    case "sms":
      return {
        phone: form.smsPhone,
        ...(form.smsMessage ? { message: form.smsMessage } : {}),
      };
    case "whatsapp":
      return {
        phone: form.whatsappPhone,
        ...(form.whatsappMessage ? { message: form.whatsappMessage } : {}),
      };
    case "wifi":
      return {
        ssid: form.wifiSsid,
        ...(form.wifiPassword ? { password: form.wifiPassword } : {}),
        encryption: form.wifiEncryption,
        hidden: form.wifiHidden,
      };
    case "vcard":
      return {
        ...(form.firstName ? { firstName: form.firstName } : {}),
        ...(form.lastName ? { lastName: form.lastName } : {}),
        ...(form.organization ? { organization: form.organization } : {}),
        ...(form.jobTitle ? { title: form.jobTitle } : {}),
        ...(form.vcardPhone ? { phone: form.vcardPhone } : {}),
        ...(form.vcardEmail ? { email: form.vcardEmail } : {}),
        ...(form.vcardWebsite ? { website: form.vcardWebsite } : {}),
        ...(form.vcardAddress ? { address: form.vcardAddress } : {}),
      };
  }
}

export function getDynamicPublishSignature({
  type,
  form,
  design,
  logoUrl,
}: {
  readonly type: QRType;
  readonly form: FormState;
  readonly design: DesignState;
  readonly logoUrl: string;
}): string | null {
  try {
    // The signature changes whenever the type, content, or design changes, so a
    // published dynamic QR is flagged as stale until it is republished.
    return JSON.stringify({
      type,
      content:
        type === "url"
          ? { url: normalizeHttpUrl(form.url) }
          : buildApiContent(type, form),
      // Use a presence marker rather than the full data URL so the memoized
      // signature stays small even with a large uploaded logo.
      design: getApiDesign(design, logoUrl ? "x" : ""),
    });
  } catch {
    return null;
  }
}

export function escapeWifiValue(value: string): string {
  return value.replace(/([\\;,:"])/g, "\\$1");
}

export function escapeVCardValue(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,");
}

function sanitizeSmsMessage(value: string): string {
  return value.replace(/[\r\n]+/g, " ");
}
