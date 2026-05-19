import type { Prisma } from "@prisma/client";
import { LANDING_PAGE_TYPE } from "@/server/landing-pages/constants";

export interface PublicLandingPageRenderInput {
  readonly title: string;
  readonly type: string;
  readonly content: Prisma.JsonValue;
}

export function renderLandingPageHtml({
  title,
  type,
  content,
}: PublicLandingPageRenderInput): string {
  const body = renderLandingPageBody(type, getRecord(content), title);

  return [
    "<!doctype html>",
    '<html lang="en">',
    "<head>",
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    `<title>${escapeHtml(title)}</title>`,
    "<style>",
    getLandingPageCss(),
    "</style>",
    "</head>",
    "<body>",
    '<main class="page-shell">',
    body,
    "</main>",
    "</body>",
    "</html>",
  ].join("");
}

function renderLandingPageBody(
  type: string,
  content: Record<string, Prisma.JsonValue>,
  fallbackTitle: string
): string {
  switch (type) {
    case LANDING_PAGE_TYPE.PROFILE:
      return renderProfile(content, fallbackTitle);
    case LANDING_PAGE_TYPE.BUSINESS:
      return renderBusiness(content, fallbackTitle);
    case LANDING_PAGE_TYPE.LINKS:
      return renderLinks(content, fallbackTitle);
    case LANDING_PAGE_TYPE.MENU:
      return renderMenu(content, fallbackTitle);
    case LANDING_PAGE_TYPE.COUPON:
      return renderCoupon(content, fallbackTitle);
    case LANDING_PAGE_TYPE.EVENT:
      return renderEvent(content, fallbackTitle);
    case LANDING_PAGE_TYPE.FEEDBACK:
      return renderFeedback(content, fallbackTitle);
    case LANDING_PAGE_TYPE.PDF:
      return renderPdf(content, fallbackTitle);
    case LANDING_PAGE_TYPE.IMAGES:
      return renderImages(content, fallbackTitle);
    case LANDING_PAGE_TYPE.VIDEO_LINK:
      return renderVideoLink(content, fallbackTitle);
    case LANDING_PAGE_TYPE.AUDIO_LINK:
      return renderAudioLink(content, fallbackTitle);
    default:
      return renderHeader(fallbackTitle, undefined);
  }
}

function renderProfile(
  content: Record<string, Prisma.JsonValue>,
  fallbackTitle: string
): string {
  return [
    getAssetImageHtml(content.avatarAssetId, getString(content.displayName)),
    renderHeader(
      getString(content.displayName) ?? fallbackTitle,
      getString(content.headline)
    ),
    renderParagraph(content.bio),
    renderLinkList(content.links),
  ].join("");
}

function renderBusiness(
  content: Record<string, Prisma.JsonValue>,
  fallbackTitle: string
): string {
  const contactLinks = [
    getOptionalLink("Website", content.website),
    getOptionalLink("Email", getMailtoUrl(content.email)),
    getOptionalLink("Call", getTelUrl(content.phone)),
  ].filter(Boolean);

  return [
    getAssetImageHtml(content.logoAssetId, getString(content.businessName)),
    renderHeader(
      getString(content.businessName) ?? fallbackTitle,
      getString(content.tagline)
    ),
    renderParagraph(content.description),
    renderParagraph(content.address),
    renderRawLinks(contactLinks),
    renderLinkList(content.links),
  ].join("");
}

function renderLinks(
  content: Record<string, Prisma.JsonValue>,
  fallbackTitle: string
): string {
  return [
    renderHeader(getString(content.heading) ?? fallbackTitle, undefined),
    renderParagraph(content.description),
    renderLinkList(content.links),
  ].join("");
}

function renderMenu(
  content: Record<string, Prisma.JsonValue>,
  fallbackTitle: string
): string {
  const sections = getArray(content.sections)
    .map((section) => renderMenuSection(getRecord(section)))
    .join("");

  return [
    renderHeader(
      getString(content.restaurantName) ?? fallbackTitle,
      getString(content.description)
    ),
    `<div class="stack">${sections}</div>`,
  ].join("");
}

function renderCoupon(
  content: Record<string, Prisma.JsonValue>,
  fallbackTitle: string
): string {
  return [
    renderHeader(getString(content.headline) ?? fallbackTitle, undefined),
    `<div class="coupon-code">${escapeHtml(getString(content.code) ?? "")}</div>`,
    renderParagraph(content.details),
    renderMuted(getString(content.expiresAt), "Expires"),
    renderRawLinks([getOptionalLink("Redeem", content.redemptionUrl)].filter(Boolean)),
  ].join("");
}

function renderEvent(
  content: Record<string, Prisma.JsonValue>,
  fallbackTitle: string
): string {
  return [
    renderHeader(getString(content.name) ?? fallbackTitle, undefined),
    renderMuted(getString(content.startAt), "Starts"),
    renderMuted(getString(content.endAt), "Ends"),
    renderParagraph(content.location),
    renderParagraph(content.description),
    renderRawLinks([
      getOptionalLink("Register", content.registrationUrl),
    ].filter(Boolean)),
  ].join("");
}

function renderFeedback(
  content: Record<string, Prisma.JsonValue>,
  fallbackTitle: string
): string {
  return [
    renderHeader(getString(content.heading) ?? fallbackTitle, undefined),
    renderParagraph(content.description),
    renderRawLinks([getOptionalLink("Open form", content.formUrl)].filter(Boolean)),
  ].join("");
}

function renderPdf(
  content: Record<string, Prisma.JsonValue>,
  fallbackTitle: string
): string {
  const assetId = getString(content.pdfAssetId);

  return [
    renderHeader(getString(content.title) ?? fallbackTitle, undefined),
    renderParagraph(content.description),
    assetId
      ? `<a class="primary-link" href="${getAssetUrl(assetId)}" aria-label="Open ${escapeAttribute(
          getString(content.title) ?? fallbackTitle
        )} PDF">Open PDF</a>`
      : "",
  ].join("");
}

function renderImages(
  content: Record<string, Prisma.JsonValue>,
  fallbackTitle: string
): string {
  const images = getArray(content.images)
    .map((image) => {
      const record = getRecord(image);
      const assetId = getString(record.assetId);
      if (!assetId) return "";

      const altText = getString(record.alt) ?? getString(record.caption) ?? "Landing page image";

      return [
        '<figure class="image-frame">',
        `<img src="${getAssetUrl(assetId)}" alt="${escapeHtml(altText)}" loading="lazy">`,
        getString(record.caption)
          ? `<figcaption>${escapeHtml(getString(record.caption) ?? "")}</figcaption>`
          : "",
        "</figure>",
      ].join("");
    })
    .join("");

  return [
    renderHeader(getString(content.title) ?? fallbackTitle, undefined),
    renderParagraph(content.description),
    `<div class="image-grid">${images}</div>`,
  ].join("");
}

function renderVideoLink(
  content: Record<string, Prisma.JsonValue>,
  fallbackTitle: string
): string {
  return [
    renderHeader(getString(content.title) ?? fallbackTitle, undefined),
    renderParagraph(content.description),
    renderRawLinks([getOptionalLink("Open video", content.videoUrl)].filter(Boolean)),
  ].join("");
}

function renderAudioLink(
  content: Record<string, Prisma.JsonValue>,
  fallbackTitle: string
): string {
  const audioAssetId = getString(content.audioAssetId);

  return [
    renderHeader(getString(content.title) ?? fallbackTitle, undefined),
    renderParagraph(content.description),
    audioAssetId
      ? `<audio controls preload="metadata" src="${getAssetUrl(audioAssetId)}" aria-label="${escapeAttribute(
          getString(content.title) ?? fallbackTitle
        )} audio"></audio>`
      : "",
    renderRawLinks([getOptionalLink("Open audio", content.audioUrl)].filter(Boolean)),
  ].join("");
}

function renderHeader(title: string, subtitle: string | undefined): string {
  return [
    "<header>",
    `<p class="eyebrow">Decode</p>`,
    `<h1>${escapeHtml(title)}</h1>`,
    subtitle ? `<p class="subtitle">${escapeHtml(subtitle)}</p>` : "",
    "</header>",
  ].join("");
}

function renderMenuSection(section: Record<string, Prisma.JsonValue>): string {
  const items = getArray(section.items)
    .map((item) => {
      const record = getRecord(item);

      return [
        '<li class="menu-item">',
        "<span>",
        `<strong>${escapeHtml(getString(record.name) ?? "")}</strong>`,
        renderParagraph(record.description),
        "</span>",
        getString(record.price)
          ? `<span class="price">${escapeHtml(getString(record.price) ?? "")}</span>`
          : "",
        "</li>",
      ].join("");
    })
    .join("");

  return [
    '<section class="panel">',
    `<h2>${escapeHtml(getString(section.name) ?? "Menu")}</h2>`,
    `<ul class="menu-list">${items}</ul>`,
    "</section>",
  ].join("");
}

function renderParagraph(value: Prisma.JsonValue | undefined): string {
  const text = getString(value);
  if (!text) return "";

  return `<p>${escapeHtml(text)}</p>`;
}

function renderMuted(value: string | undefined, label: string): string {
  if (!value) return "";

  return `<p class="muted"><strong>${escapeHtml(label)}:</strong> ${escapeHtml(
    value
  )}</p>`;
}

function renderLinkList(value: Prisma.JsonValue | undefined): string {
  const links = getArray(value)
    .map((link) => {
      const record = getRecord(link);
      const label = getString(record.label);
      const url = getString(record.url);
      if (!label || !url) return "";

      return `<a class="primary-link" href="${escapeAttribute(url)}" rel="noopener noreferrer">${escapeHtml(
        label
      )}</a>`;
    })
    .join("");

  return links ? `<div class="links">${links}</div>` : "";
}

function renderRawLinks(links: readonly string[]): string {
  if (links.length === 0) return "";

  return `<div class="links">${links.join("")}</div>`;
}

function getOptionalLink(
  label: string,
  url: Prisma.JsonValue | string | undefined
): string {
  const href = getString(url);
  if (!href) return "";

  return `<a class="primary-link" href="${escapeAttribute(href)}" rel="noopener noreferrer">${escapeHtml(
    label
  )}</a>`;
}

function getAssetImageHtml(
  assetId: Prisma.JsonValue | undefined,
  alt: string | undefined
): string {
  const id = getString(assetId);
  if (!id) return "";

  return `<img class="avatar" src="${getAssetUrl(id)}" alt="${escapeHtml(
    alt ?? ""
  )}">`;
}

function getAssetUrl(assetId: string): string {
  return `/api/assets/${encodeURIComponent(assetId)}`;
}

function getMailtoUrl(value: Prisma.JsonValue | undefined): string | undefined {
  const email = getString(value);
  if (!email) return undefined;

  return `mailto:${email}`;
}

function getTelUrl(value: Prisma.JsonValue | undefined): string | undefined {
  const phone = getString(value);
  if (!phone) return undefined;

  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

function getRecord(value: Prisma.JsonValue): Record<string, Prisma.JsonValue> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};

  return value as Record<string, Prisma.JsonValue>;
}

function getArray(value: Prisma.JsonValue | undefined): Prisma.JsonValue[] {
  return Array.isArray(value) ? value : [];
}

function getString(value: Prisma.JsonValue | string | undefined): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttribute(value: string): string {
  return escapeHtml(value).replace(/`/g, "&#96;");
}

function getLandingPageCss(): string {
  return `
    :root { color-scheme: light; --sky: #0EA5E9; --sky-dark: #0369A1; --sky-soft: #E0F2FE; --ink: #0F172A; --muted: #475569; --surface: #FFFFFF; --page: #F8FAFC; }
    * { box-sizing: border-box; }
    body { margin: 0; min-height: 100vh; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: var(--ink); background: var(--page); }
    .page-shell { width: min(720px, calc(100% - 32px)); margin: 0 auto; padding: 48px 0; }
    header { margin-bottom: 28px; }
    .eyebrow { color: var(--sky-dark); font-weight: 700; letter-spacing: 0; margin: 0 0 8px; }
    h1 { font-size: clamp(2rem, 5vw, 3.5rem); line-height: 1.05; margin: 0; letter-spacing: 0; }
    h2 { font-size: 1.125rem; margin: 0 0 16px; }
    p { color: var(--muted); line-height: 1.65; margin: 12px 0; }
    .subtitle { font-size: 1.125rem; color: #334155; }
    .avatar { width: 112px; height: 112px; border-radius: 28px; object-fit: cover; margin-bottom: 24px; border: 1px solid #BAE6FD; }
    .links { display: grid; gap: 12px; margin-top: 24px; }
    .primary-link { display: inline-flex; align-items: center; justify-content: center; min-height: 48px; padding: 12px 18px; border-radius: 8px; background: var(--sky); color: white; text-decoration: none; font-weight: 700; }
    .primary-link:focus-visible { outline: 3px solid #7DD3FC; outline-offset: 3px; }
    .panel, .image-frame { background: var(--surface); border: 1px solid #E2E8F0; border-radius: 8px; padding: 20px; }
    .stack { display: grid; gap: 16px; }
    .menu-list { list-style: none; padding: 0; margin: 0; display: grid; gap: 16px; }
    .menu-item { display: flex; justify-content: space-between; gap: 16px; border-top: 1px solid #E2E8F0; padding-top: 16px; }
    .menu-item:first-child { border-top: 0; padding-top: 0; }
    .price { color: var(--sky-dark); font-weight: 800; white-space: nowrap; }
    .coupon-code { display: inline-flex; padding: 12px 18px; border: 1px dashed var(--sky-dark); border-radius: 8px; background: var(--sky-soft); font-size: 1.35rem; font-weight: 800; margin: 16px 0; }
    .muted { color: #64748B; }
    .image-grid { display: grid; gap: 16px; margin-top: 24px; }
    .image-frame { margin: 0; padding: 0; overflow: hidden; }
    .image-frame img { width: 100%; display: block; object-fit: cover; }
    figcaption { padding: 14px 16px; color: var(--muted); }
    audio { width: 100%; margin: 20px 0 4px; }
  `;
}
