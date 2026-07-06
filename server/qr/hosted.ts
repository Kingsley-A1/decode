import "server-only";

import type { Prisma } from "@prisma/client";
import { prisma } from "@/server/db/prisma";
import { ASSET_PURPOSE, ASSET_STATUS } from "@/server/assets/constants";
import { getR2SignedDownloadUrl } from "@/server/assets/r2";
import {
  escapeHtml,
  getLandingPageCss,
} from "@/server/landing-pages/render";

/**
 * Hosted pages for dynamic QR types served directly by /r/[slug]: a text
 * notice and a contact card. They reuse the landing-page CSS and escaping so
 * every Decode-hosted surface renders with one visual system and one
 * sanitization path, and they ship zero JavaScript (same CSP as landing
 * pages).
 */

export interface StoredVCardContent {
  readonly firstName?: string;
  readonly lastName?: string;
  readonly organization?: string;
  readonly title?: string;
  readonly phone?: string;
  readonly email?: string;
  readonly website?: string;
  readonly address?: string;
}

export function getStoredContent(
  payload: Prisma.JsonValue
): Record<string, unknown> {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return {};
  }

  const content = (payload as Record<string, unknown>).content;
  if (!content || typeof content !== "object" || Array.isArray(content)) {
    return {};
  }

  return content as Record<string, unknown>;
}

export function parseStoredVCardContent(
  content: Record<string, unknown>
): StoredVCardContent {
  const text = (key: string): string | undefined => {
    const value = content[key];

    return typeof value === "string" && value.trim() ? value.trim() : undefined;
  };

  return {
    firstName: text("firstName"),
    lastName: text("lastName"),
    organization: text("organization"),
    title: text("title"),
    phone: text("phone"),
    email: text("email"),
    website: text("website"),
    address: text("address"),
  };
}

export function renderTextPage({
  title,
  text,
}: {
  readonly title: string;
  readonly text: string;
}): string {
  const safeTitle = escapeHtml(title);
  // Preserve line breaks without allowing any markup through.
  const paragraphs = text
    .split(/\r?\n\r?\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map(
      (paragraph) =>
        `<p>${escapeHtml(paragraph).replace(/\r?\n/g, "<br/>")}</p>`
    )
    .join("");

  return hostedDocument({
    title: safeTitle,
    body:
      `<header><h1>${safeTitle}</h1></header>` +
      `<main class="hosted-card">${paragraphs || "<p></p>"}</main>`,
  });
}

export function renderContactPage({
  title,
  content,
  vcfUrl,
}: {
  readonly title: string;
  readonly content: StoredVCardContent;
  readonly vcfUrl: string;
}): string {
  const fullName =
    [content.firstName, content.lastName].filter(Boolean).join(" ") || title;
  const rows = [
    contactRow("Organization", content.organization),
    contactRow("Role", content.title),
    contactRow("Phone", content.phone, `tel:${content.phone ?? ""}`),
    contactRow("Email", content.email, `mailto:${content.email ?? ""}`),
    contactRow("Website", content.website, content.website),
    contactRow("Address", content.address),
  ]
    .filter(Boolean)
    .join("");

  return hostedDocument({
    title: escapeHtml(fullName),
    body:
      `<header><h1>${escapeHtml(fullName)}</h1></header>` +
      `<main class="hosted-card">` +
      `<dl>${rows}</dl>` +
      `<a class="hosted-action" href="${escapeHtml(vcfUrl)}">Save contact</a>` +
      `</main>`,
  });
}

function contactRow(
  label: string,
  value: string | undefined,
  href?: string
): string {
  if (!value) return "";

  const safeValue = escapeHtml(value);
  const isSafeHref =
    href !== undefined &&
    (href.startsWith("tel:") ||
      href.startsWith("mailto:") ||
      /^https?:\/\//i.test(href));
  const rendered = isSafeHref
    ? `<a href="${escapeHtml(href)}">${safeValue}</a>`
    : safeValue;

  return `<div><dt>${escapeHtml(label)}</dt><dd>${rendered}</dd></div>`;
}

function hostedDocument({
  title,
  body,
}: {
  readonly title: string;
  readonly body: string;
}): string {
  return (
    `<!doctype html><html lang="en"><head><meta charset="utf-8"/>` +
    `<meta name="viewport" content="width=device-width, initial-scale=1"/>` +
    `<meta name="robots" content="noindex"/>` +
    `<title>${title}</title>` +
    `<style>${getLandingPageCss()}${getHostedCss()}</style>` +
    `</head><body><div class="page">${body}</div></body></html>`
  );
}

function getHostedCss(): string {
  return `
    .hosted-card {
      background: #FFFFFF;
      border: 1px solid var(--border, #DCE6EF);
      border-radius: 16px;
      padding: 20px;
      margin-top: 16px;
    }
    .hosted-card p { margin: 0 0 12px; line-height: 1.6; overflow-wrap: anywhere; }
    .hosted-card p:last-child { margin-bottom: 0; }
    .hosted-card dl { margin: 0; display: grid; gap: 12px; }
    .hosted-card dt { font-size: 12px; text-transform: uppercase; letter-spacing: 0.04em; color: #64748B; }
    .hosted-card dd { margin: 2px 0 0; overflow-wrap: anywhere; }
    .hosted-action {
      display: inline-block;
      margin-top: 16px;
      padding: 12px 20px;
      min-height: 44px;
      border-radius: 10px;
      background: var(--accent, #0369A1);
      color: #FFFFFF;
      text-decoration: none;
      font-weight: 600;
    }
  `;
}

/**
 * Resolves the signed download URL for a file-type dynamic QR. Returns null
 * when the referenced asset is missing, deleted, or belongs to a different
 * workspace/QR — the caller treats that as "no active destination".
 */
export async function getQRFileDownloadUrl({
  qrCodeId,
  workspaceId,
  assetId,
}: {
  readonly qrCodeId: string;
  readonly workspaceId: string;
  readonly assetId: string;
}): Promise<string | null> {
  const asset = await prisma.qRCodeAsset.findFirst({
    where: {
      id: assetId,
      workspaceId,
      purpose: ASSET_PURPOSE.QR_FILE,
      status: ASSET_STATUS.READY,
      deletedAt: null,
      OR: [{ qrCodeId }, { qrCodeId: null }],
    },
    select: { key: true },
  });
  if (!asset) return null;

  return getR2SignedDownloadUrl(asset.key);
}
