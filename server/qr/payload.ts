import {
  QR_CODE_TYPE,
  type QRCodeType,
} from "@/server/qr/constants";
import { QRCodePayloadError } from "@/server/qr/errors";
import type { CreateQRCodeRequest } from "@/server/qr/schemas";

export interface BuiltQRPayload {
  readonly type: QRCodeType;
  readonly value: string;
  readonly normalizedContent: Record<string, string | boolean | undefined>;
  readonly destinationUrl?: string;
}

export function buildQRPayload(input: CreateQRCodeRequest): BuiltQRPayload {
  switch (input.type) {
    case QR_CODE_TYPE.URL:
      return buildUrlPayload(input.content);
    case QR_CODE_TYPE.TEXT:
      return buildTextPayload(input.content);
    case QR_CODE_TYPE.EMAIL:
      return buildEmailPayload(input.content);
    case QR_CODE_TYPE.PHONE:
      return buildPhonePayload(input.content);
    case QR_CODE_TYPE.SMS:
      return buildSmsPayload(input.content);
    case QR_CODE_TYPE.WIFI:
      return buildWifiPayload(input.content);
    case QR_CODE_TYPE.VCARD:
      return buildVCardPayload(input.content);
  }
}

function buildUrlPayload(content: { readonly url: string }): BuiltQRPayload {
  const normalizedUrl = normalizeHttpUrl(content.url);

  return {
    type: QR_CODE_TYPE.URL,
    value: normalizedUrl,
    destinationUrl: normalizedUrl,
    normalizedContent: { url: normalizedUrl },
  };
}

function buildTextPayload(content: { readonly text: string }): BuiltQRPayload {
  return {
    type: QR_CODE_TYPE.TEXT,
    value: content.text,
    normalizedContent: { text: content.text },
  };
}

function buildEmailPayload(content: {
  readonly email: string;
  readonly subject?: string;
  readonly body?: string;
}): BuiltQRPayload {
  const params = new URLSearchParams();
  if (content.subject) params.set("subject", content.subject);
  if (content.body) params.set("body", content.body);
  const query = params.toString();
  const value = `mailto:${content.email}${query ? `?${query}` : ""}`;

  return {
    type: QR_CODE_TYPE.EMAIL,
    value,
    normalizedContent: content,
  };
}

function buildPhonePayload(content: { readonly phone: string }): BuiltQRPayload {
  const phone = normalizePhone(content.phone);

  return {
    type: QR_CODE_TYPE.PHONE,
    value: `tel:${phone}`,
    normalizedContent: { phone },
  };
}

function buildSmsPayload(content: {
  readonly phone: string;
  readonly message?: string;
}): BuiltQRPayload {
  const phone = normalizePhone(content.phone);

  return {
    type: QR_CODE_TYPE.SMS,
    value: `SMSTO:${phone}:${content.message ?? ""}`,
    normalizedContent: { phone, message: content.message },
  };
}

function buildWifiPayload(content: {
  readonly ssid: string;
  readonly password?: string;
  readonly encryption: "WPA" | "WEP" | "nopass";
  readonly hidden: boolean;
}): BuiltQRPayload {
  const value = [
    "WIFI:",
    `T:${content.encryption};`,
    `S:${escapeWifiValue(content.ssid)};`,
    `P:${escapeWifiValue(content.password ?? "")};`,
    `H:${content.hidden ? "true" : "false"};`,
    ";",
  ].join("");

  return {
    type: QR_CODE_TYPE.WIFI,
    value,
    normalizedContent: content,
  };
}

function buildVCardPayload(content: {
  readonly firstName?: string;
  readonly lastName?: string;
  readonly organization?: string;
  readonly title?: string;
  readonly phone?: string;
  readonly email?: string;
  readonly website?: string;
  readonly address?: string;
}): BuiltQRPayload {
  const firstName = content.firstName ?? "";
  const lastName = content.lastName ?? "";
  const fullName = [firstName, lastName].filter(Boolean).join(" ");
  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `N:${escapeVCardValue(lastName)};${escapeVCardValue(firstName)};;;`,
    fullName ? `FN:${escapeVCardValue(fullName)}` : undefined,
    content.organization ? `ORG:${escapeVCardValue(content.organization)}` : undefined,
    content.title ? `TITLE:${escapeVCardValue(content.title)}` : undefined,
    content.phone ? `TEL:${escapeVCardValue(content.phone)}` : undefined,
    content.email ? `EMAIL:${escapeVCardValue(content.email)}` : undefined,
    content.website ? `URL:${normalizeHttpUrl(content.website)}` : undefined,
    content.address ? `ADR:;;${escapeVCardValue(content.address)};;;;` : undefined,
    "END:VCARD",
  ];

  return {
    type: QR_CODE_TYPE.VCARD,
    value: lines.filter(Boolean).join("\n"),
    normalizedContent: content,
  };
}

export function normalizeHttpUrl(value: string): string {
  const trimmedValue = value.trim();
  const hasScheme = /^[a-z][a-z0-9+.-]*:/i.test(trimmedValue);
  const candidate = hasScheme ? trimmedValue : `https://${trimmedValue}`;
  const url = new URL(candidate);

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new QRCodePayloadError(
      "Only http and https URLs can be encoded as website QR codes."
    );
  }

  return url.toString();
}

function normalizePhone(value: string): string {
  return value.replace(/[^\d+]/g, "");
}

function escapeWifiValue(value: string): string {
  return value.replace(/([\\;,:"])/g, "\\$1");
}

function escapeVCardValue(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,");
}
