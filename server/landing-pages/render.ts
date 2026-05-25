import type { Prisma } from "@prisma/client";
import { LANDING_PAGE_TYPE } from "./constants";

export interface PublicLandingPageRenderInput {
  readonly title: string;
  readonly type: string;
  readonly content: Prisma.JsonValue;
}

interface ImageDimensions {
  readonly width: number;
  readonly height: number;
}

interface ImageReference extends ImageDimensions {
  readonly src: string;
  readonly alt: string;
  readonly caption?: string;
}

interface ImageRenderOptions extends ImageReference {
  readonly className?: string;
  readonly loading?: "eager" | "lazy";
  readonly fetchPriority?: "high" | "low" | "auto";
}

const AVATAR_IMAGE_DIMENSIONS = { width: 512, height: 512 } as const;
const HERO_IMAGE_DIMENSIONS = { width: 1600, height: 900 } as const;
const GALLERY_IMAGE_DIMENSIONS = { width: 1200, height: 800 } as const;

export function renderLandingPageHtml({
  title,
  type,
  content,
}: PublicLandingPageRenderInput): string {
  const body = renderLandingPageBody(type, getRecord(content), title);
  const pageClass = getPageTypeClass(type);

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
    `<article class="landing-page ${pageClass}">`,
    body,
    "</article>",
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
    case "institution":
      return renderInstitution(content, fallbackTitle);
    case "product":
      return renderProduct(content, fallbackTitle);
    case "property":
      return renderProperty(content, fallbackTitle);
    case "program":
      return renderProgram(content, fallbackTitle);
    default:
      return renderGenericPage(content, fallbackTitle);
  }
}

function renderProfile(
  content: Record<string, Prisma.JsonValue>,
  fallbackTitle: string
): string {
  const title = getFirstString(content, ["displayName", "name"]) ?? fallbackTitle;

  return [
    getIdentityImageHtml(
      getFirstValue(content, ["avatarAssetId", "avatarAssetPath"]),
      title,
      "avatar"
    ),
    renderHeader(title, getFirstString(content, ["headline", "role"])),
    renderHeroMedia(content, title),
    renderParagraph(getFirstValue(content, ["bio", "description"])),
    renderLinkList(content.links, `${title} links`),
  ].join("");
}

function renderBusiness(
  content: Record<string, Prisma.JsonValue>,
  fallbackTitle: string
): string {
  const title =
    getFirstString(content, ["businessName", "institutionName", "organizationName"]) ??
    fallbackTitle;
  const contactLinks = buildContactLinks(content, title);

  return [
    getIdentityImageHtml(
      getFirstValue(content, ["logoAssetId", "logoAssetPath"]),
      title,
      "avatar"
    ),
    renderHeader(title, getFirstString(content, ["tagline", "category"])),
    renderHeroMedia(content, title),
    renderParagraph(getFirstValue(content, ["description", "summary"])),
    renderMetadataList([
      { label: "Address", value: getString(content.address) },
      { label: "Hours", value: getString(content.openingHours) },
    ]),
    renderRawLinks(contactLinks, `${title} contact actions`),
    renderLinkList(content.links, `${title} links`),
  ].join("");
}

function renderLinks(
  content: Record<string, Prisma.JsonValue>,
  fallbackTitle: string
): string {
  const title = getFirstString(content, ["heading", "title"]) ?? fallbackTitle;

  return [
    renderHeader(title, undefined),
    renderHeroMedia(content, title),
    renderParagraph(content.description),
    renderLinkList(content.links, `${title} links`),
  ].join("");
}

function renderMenu(
  content: Record<string, Prisma.JsonValue>,
  fallbackTitle: string
): string {
  const title =
    getFirstString(content, ["restaurantName", "businessName", "title"]) ??
    fallbackTitle;
  const sections = getArray(content.sections)
    .map((section, index) => renderMenuSection(getRecord(section), index))
    .join("");

  return [
    renderHeader(title, getString(content.description)),
    renderHeroMedia(content, title),
    sections ? `<div class="stack" aria-label="Menu sections">${sections}</div>` : "",
  ].join("");
}

function renderCoupon(
  content: Record<string, Prisma.JsonValue>,
  fallbackTitle: string
): string {
  const title = getFirstString(content, ["headline", "couponHeadline"]) ?? fallbackTitle;
  const code = getFirstString(content, ["code", "couponCode"]);

  return [
    renderHeader(title, undefined),
    renderHeroMedia(content, title),
    code ? `<p class="coupon-code" aria-label="Coupon code">${escapeHtml(code)}</p>` : "",
    renderParagraph(getFirstValue(content, ["details", "couponDetails", "description"])),
    renderMetadataList([
      { label: "Expires", value: getFirstString(content, ["expiresAt", "expiryDate"]) },
    ]),
    renderRawLinks(
      [
        getOptionalLink(
          "Redeem offer",
          getFirstValue(content, ["redemptionUrl", "redeemUrl"]),
          `Redeem offer: ${title}`
        ),
      ].filter(Boolean),
      `${title} actions`
    ),
  ].join("");
}

function renderEvent(
  content: Record<string, Prisma.JsonValue>,
  fallbackTitle: string
): string {
  const title = getFirstString(content, ["name", "eventName", "title"]) ?? fallbackTitle;

  return [
    renderHeader(title, undefined),
    renderHeroMedia(content, title),
    renderMetadataList([
      { label: "Starts", value: getFirstString(content, ["startAt", "dateOrSchedule"]) },
      { label: "Ends", value: getString(content.endAt) },
      { label: "Location", value: getString(content.location) },
    ]),
    renderParagraph(content.description),
    renderRawLinks(
      [
        getOptionalLink(
          "Register for event",
          content.registrationUrl,
          `Register for ${title}`
        ),
      ].filter(Boolean),
      `${title} actions`
    ),
  ].join("");
}

function renderFeedback(
  content: Record<string, Prisma.JsonValue>,
  fallbackTitle: string
): string {
  const title = getFirstString(content, ["heading", "title"]) ?? fallbackTitle;

  return [
    renderHeader(title, undefined),
    renderHeroMedia(content, title),
    renderParagraph(content.description),
    renderRawLinks(
      [
        getOptionalLink(
          "Open feedback form",
          content.formUrl,
          `Open feedback form: ${title}`
        ),
      ].filter(Boolean),
      `${title} actions`
    ),
  ].join("");
}

function renderPdf(
  content: Record<string, Prisma.JsonValue>,
  fallbackTitle: string
): string {
  const title = getFirstString(content, ["title", "pdfTitle"]) ?? fallbackTitle;
  const pdfAssetId =
    getString(content.pdfAssetId) ?? getString(getRecord(content.pdf).assetId);
  const pdfSource =
    getAllowedMediaSource(getFirstValue(content, ["pdfAssetPath"])) ??
    (pdfAssetId ? getAssetUrl(pdfAssetId) : undefined);

  return [
    renderHeader(title, undefined),
    renderHeroMedia(content, title),
    renderParagraph(content.description),
    renderRawLinks(
      [
        pdfSource
          ? getOptionalLink("Open PDF document", pdfSource, `Open ${title} PDF`)
          : "",
      ].filter(Boolean),
      `${title} document actions`
    ),
  ].join("");
}

function renderImages(
  content: Record<string, Prisma.JsonValue>,
  fallbackTitle: string
): string {
  const title = getFirstString(content, ["title", "heading"]) ?? fallbackTitle;

  return [
    renderHeader(title, undefined),
    renderHeroMedia(content, title),
    renderParagraph(content.description),
    renderImageGallery(content.images, `${title} image gallery`),
  ].join("");
}

function renderVideoLink(
  content: Record<string, Prisma.JsonValue>,
  fallbackTitle: string
): string {
  const title = getFirstString(content, ["title", "videoTitle"]) ?? fallbackTitle;

  return [
    renderHeader(title, undefined),
    renderHeroMedia(content, title),
    renderParagraph(content.description),
    renderRawLinks(
      [
        getOptionalLink(
          `Watch ${title}`,
          content.videoUrl,
          `Open video: ${title}`
        ),
      ].filter(Boolean),
      `${title} video actions`
    ),
  ].join("");
}

function renderAudioLink(
  content: Record<string, Prisma.JsonValue>,
  fallbackTitle: string
): string {
  const title = getFirstString(content, ["title", "audioTitle"]) ?? fallbackTitle;
  const audioAssetId =
    getString(content.audioAssetId) ?? getString(getRecord(content.audio).assetId);
  const audioSource =
    getAllowedMediaSource(getFirstValue(content, ["audioAssetPath"])) ??
    (audioAssetId ? getAssetUrl(audioAssetId) : undefined);

  return [
    renderHeader(title, undefined),
    renderHeroMedia(content, title),
    renderParagraph(content.description),
    audioSource
      ? [
          '<section class="media-panel" aria-labelledby="audio-heading">',
          '<h2 id="audio-heading" class="section-title">Audio</h2>',
          `<audio controls preload="metadata" src="${escapeAttribute(
            audioSource
          )}" aria-label="${escapeAttribute(title)} audio"></audio>`,
          "</section>",
        ].join("")
      : "",
    renderRawLinks(
      [
        getOptionalLink(
          `Listen to ${title}`,
          content.audioUrl,
          `Open audio: ${title}`
        ),
      ].filter(Boolean),
      `${title} audio actions`
    ),
  ].join("");
}

function renderInstitution(
  content: Record<string, Prisma.JsonValue>,
  fallbackTitle: string
): string {
  const title =
    getFirstString(content, ["institutionName", "organizationName", "businessName"]) ??
    fallbackTitle;

  return [
    getIdentityImageHtml(content.logoAssetId, title, "avatar"),
    renderHeader(title, getFirstString(content, ["category", "tagline"])),
    renderHeroMedia(content, title),
    renderParagraph(getFirstValue(content, ["summary", "description"])),
    renderMetadataList([
      { label: "Address", value: getString(content.address) },
      { label: "Hours", value: getString(content.openingHours) },
    ]),
    renderRawLinks(buildContactLinks(content, title), `${title} contact actions`),
    renderLinkList(
      getFirstValue(content, ["secondaryLinks", "links"]),
      `${title} links`
    ),
  ].join("");
}

function renderProduct(
  content: Record<string, Prisma.JsonValue>,
  fallbackTitle: string
): string {
  const title = getFirstString(content, ["productName", "title"]) ?? fallbackTitle;
  const manualPdfAssetId =
    getString(content.manualPdfAssetId) ?? getString(content.pdfAssetId);

  return [
    renderHeader(title, getString(content.brandName)),
    renderHeroMedia(content, title),
    renderParagraph(getFirstValue(content, ["summary", "description"])),
    renderImageGallery(
      getFirstValue(content, ["gallery", "images"]),
      `${title} product images`
    ),
    renderRawLinks(
      [
        getOptionalLink("Buy product", content.buyUrl, `Buy ${title}`),
        getOptionalLink("Warranty support", content.warrantyUrl, `${title} warranty support`),
        getOptionalLink("Product support", content.supportUrl, `${title} support`),
        manualPdfAssetId
          ? getOptionalLink(
              "Open product manual",
              getAssetUrl(manualPdfAssetId),
              `Open ${title} manual`
            )
          : "",
      ].filter(Boolean),
      `${title} product actions`
    ),
  ].join("");
}

function renderProperty(
  content: Record<string, Prisma.JsonValue>,
  fallbackTitle: string
): string {
  const title = getFirstString(content, ["propertyTitle", "title"]) ?? fallbackTitle;

  return [
    renderHeader(title, getString(content.address)),
    renderHeroMedia(content, title),
    renderMetadataList([
      { label: "Price", value: getString(content.price) },
      { label: "Bedrooms", value: getString(content.bedrooms) },
      { label: "Bathrooms", value: getString(content.bathrooms) },
      { label: "Size", value: getString(content.size) },
      { label: "Agent", value: getString(content.agentName) },
    ]),
    renderParagraph(getFirstValue(content, ["summary", "description"])),
    renderImageGallery(
      getFirstValue(content, ["gallery", "images"]),
      `${title} property gallery`
    ),
    renderRawLinks(
      [
        getOptionalLink("Book viewing", content.viewingUrl, `Book a viewing for ${title}`),
        getOptionalLink("Call agent", getTelUrl(content.phone), `Call about ${title}`),
      ].filter(Boolean),
      `${title} property actions`
    ),
  ].join("");
}

function renderProgram(
  content: Record<string, Prisma.JsonValue>,
  fallbackTitle: string
): string {
  const title = getFirstString(content, ["programName", "title"]) ?? fallbackTitle;

  return [
    renderHeader(title, getString(content.organizationName)),
    renderHeroMedia(content, title),
    renderMetadataList([
      { label: "Schedule", value: getString(content.dateOrSchedule) },
      { label: "Location", value: getString(content.location) },
    ]),
    renderParagraph(content.description),
    renderAgenda(content.agenda),
    renderRawLinks(
      [
        getOptionalLink(
          "Register for program",
          content.registrationUrl,
          `Register for ${title}`
        ),
      ].filter(Boolean),
      `${title} program actions`
    ),
    renderLinkList(content.contactLinks, `${title} contact links`),
  ].join("");
}

function renderGenericPage(
  content: Record<string, Prisma.JsonValue>,
  fallbackTitle: string
): string {
  const title =
    getFirstString(content, [
      "title",
      "heading",
      "name",
      "businessName",
      "displayName",
      "organizationName",
    ]) ?? fallbackTitle;

  return [
    renderHeader(title, getFirstString(content, ["subtitle", "tagline", "category"])),
    renderHeroMedia(content, title),
    renderParagraph(getFirstValue(content, ["summary", "description", "bio"])),
    renderRawLinks(buildContactLinks(content, title), `${title} contact actions`),
    renderLinkList(content.links, `${title} links`),
  ].join("");
}

function renderHeader(title: string, subtitle: string | undefined): string {
  return [
    '<header class="page-header">',
    '<p class="eyebrow">Decode</p>',
    `<h1>${escapeHtml(title)}</h1>`,
    subtitle ? `<p class="subtitle">${escapeHtml(subtitle)}</p>` : "",
    "</header>",
  ].join("");
}

function renderHeroMedia(
  content: Record<string, Prisma.JsonValue>,
  fallbackAlt: string
): string {
  const hero = getHeroImageReference(content, fallbackAlt);
  if (!hero) return "";

  return [
    '<figure class="hero-media">',
    renderImageElement({
      ...hero,
      className: "hero-image",
      loading: "eager",
      fetchPriority: "high",
    }),
    hero.caption ? `<figcaption>${escapeHtml(hero.caption)}</figcaption>` : "",
    "</figure>",
  ].join("");
}

function renderMenuSection(
  section: Record<string, Prisma.JsonValue>,
  index: number
): string {
  const title = getString(section.name) ?? "Menu";
  const titleId = `menu-section-title-${index + 1}`;
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
    `<section class="panel" aria-labelledby="${titleId}">`,
    `<h2 id="${titleId}">${escapeHtml(title)}</h2>`,
    `<ul class="menu-list">${items}</ul>`,
    "</section>",
  ].join("");
}

function renderImageGallery(
  value: Prisma.JsonValue | undefined,
  label: string
): string {
  const images = getArray(value)
    .map((image, index) => {
      const record = getRecord(image);
      const imageReference = getImageReferenceFromRecord(
        record,
        `${label} image ${index + 1}`,
        GALLERY_IMAGE_DIMENSIONS
      );
      if (!imageReference) return "";

      return [
        '<figure class="image-frame">',
        renderImageElement({
          ...imageReference,
          className: "gallery-image",
          loading: "lazy",
        }),
        imageReference.caption
          ? `<figcaption>${escapeHtml(imageReference.caption)}</figcaption>`
          : "",
        "</figure>",
      ].join("");
    })
    .filter((item): item is string => Boolean(item))
    .join("");

  if (!images) return "";

  return `<section class="image-gallery" aria-label="${escapeAttribute(
    label
  )}"><div class="image-grid">${images}</div></section>`;
}

function renderAgenda(value: Prisma.JsonValue | undefined): string {
  const items = getArray(value)
    .map((item) => {
      if (typeof item === "string") return getString(item);

      const record = getRecord(item);
      return getFirstString(record, ["label", "title", "name", "description"]);
    })
    .filter((item): item is string => Boolean(item))
    .map((item) => `<li>${escapeHtml(item)}</li>`)
    .join("");

  if (!items) return "";

  return `<section class="panel"><h2>Agenda</h2><ul class="simple-list">${items}</ul></section>`;
}

function renderParagraph(value: Prisma.JsonValue | string | undefined): string {
  const text = getString(value);
  if (!text) return "";

  return `<p>${escapeHtml(text)}</p>`;
}

function renderMetadataList(
  items: readonly { readonly label: string; readonly value: string | undefined }[]
): string {
  const rows = items
    .filter((item) => item.value)
    .map(
      (item) =>
        `<div><dt>${escapeHtml(item.label)}</dt><dd>${escapeHtml(
          item.value ?? ""
        )}</dd></div>`
    )
    .join("");

  return rows ? `<dl class="meta-list">${rows}</dl>` : "";
}

function renderLinkList(
  value: Prisma.JsonValue | undefined,
  label: string
): string {
  const links = getArray(value)
    .map((link) => {
      const record = getRecord(link);
      const linkLabel = getString(record.label);
      const url = getString(record.url);
      if (!linkLabel || !url) return "";

      return getOptionalLink(linkLabel, url, `Open ${linkLabel}`);
    })
    .filter(Boolean);

  return renderRawLinks(links, label);
}

function renderRawLinks(links: readonly string[], label: string): string {
  if (links.length === 0) return "";

  return `<nav class="links" aria-label="${escapeAttribute(label)}">${links.join(
    ""
  )}</nav>`;
}

function getOptionalLink(
  label: string,
  url: Prisma.JsonValue | string | undefined,
  ariaLabel?: string
): string {
  const href = getSafeHref(getString(url));
  if (!href) return "";

  const aria = ariaLabel
    ? ` aria-label="${escapeAttribute(ariaLabel)}"`
    : "";

  return `<a class="primary-link" href="${escapeAttribute(
    href
  )}" rel="noopener noreferrer"${aria}>${escapeHtml(label)}</a>`;
}

const SAFE_LINK_PROTOCOLS = new Set([
  "http:",
  "https:",
  "mailto:",
  "tel:",
]);

/** Returns the href only if it is safe to render on a public landing page.
 *  Same-origin relative paths are allowed; absolute URLs must use an allowed
 *  protocol so `javascript:`, `data:`, and similar XSS vectors are dropped. */
function getSafeHref(value: string | undefined): string | undefined {
  if (!value) return undefined;

  const trimmed = value.trim();
  if (!trimmed) return undefined;

  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) return trimmed;

  try {
    const url = new URL(trimmed);

    return SAFE_LINK_PROTOCOLS.has(url.protocol) ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

function getIdentityImageHtml(
  assetId: Prisma.JsonValue | undefined,
  alt: string,
  className: string
): string {
  const id = getString(assetId);
  if (!id) return "";
  const source = getAllowedMediaSource(id) ?? getAssetUrl(id);

  return renderImageElement({
    src: source,
    alt,
    className,
    loading: "eager",
    ...AVATAR_IMAGE_DIMENSIONS,
  });
}

function renderImageElement(options: ImageRenderOptions): string {
  const classAttribute = options.className
    ? ` class="${escapeAttribute(options.className)}"`
    : "";
  const fetchPriorityAttribute = options.fetchPriority
    ? ` fetchpriority="${escapeAttribute(options.fetchPriority)}"`
    : "";

  return `<img${classAttribute} src="${escapeAttribute(
    options.src
  )}" alt="${escapeAttribute(options.alt)}" width="${options.width}" height="${
    options.height
  }" loading="${options.loading ?? "lazy"}" decoding="async"${fetchPriorityAttribute}>`;
}

function getHeroImageReference(
  content: Record<string, Prisma.JsonValue>,
  fallbackAlt: string
): ImageReference | undefined {
  for (const key of ["hero", "heroImage", "coverImage"] as const) {
    const reference = getImageReferenceFromRecord(
      getRecord(content[key]),
      fallbackAlt,
      HERO_IMAGE_DIMENSIONS
    );
    if (reference) return reference;
  }

  const assetId = getFirstString(content, ["heroAssetId", "coverAssetId"]);
  const source =
    getAllowedMediaSource(getFirstValue(content, ["heroAssetPath", "coverAssetPath"])) ??
    getAllowedMediaSource(
      getFirstValue(content, ["heroImageUrl", "heroUrl", "coverImageUrl", "coverUrl"])
    ) ??
    (assetId ? getAssetUrl(assetId) : undefined);

  if (!source) return undefined;

  return {
    src: source,
    alt: getFirstString(content, ["heroAlt", "heroImageAlt", "coverAlt"]) ?? fallbackAlt,
    caption: getFirstString(content, ["heroCaption", "coverCaption"]),
    ...getImageDimensions(content, HERO_IMAGE_DIMENSIONS, "hero"),
  };
}

function getImageReferenceFromRecord(
  record: Record<string, Prisma.JsonValue>,
  fallbackAlt: string,
  fallbackDimensions: ImageDimensions
): ImageReference | undefined {
  const assetId = getString(record.assetId);
  const source =
    getAllowedMediaSource(
      getFirstValue(record, ["assetPath", "publicUrl", "previewUrl", "src", "url"])
    ) ?? (assetId ? getAssetUrl(assetId) : undefined);

  if (!source) return undefined;

  return {
    src: source,
    alt: getFirstString(record, ["alt", "assetAlt", "caption", "label", "title"]) ?? fallbackAlt,
    caption: getString(record.caption),
    ...getImageDimensions(record, fallbackDimensions),
  };
}

function getImageDimensions(
  record: Record<string, Prisma.JsonValue>,
  fallback: ImageDimensions,
  prefix?: string
): ImageDimensions {
  const width =
    (prefix ? getPositiveInteger(record[`${prefix}Width`]) : undefined) ??
    getPositiveInteger(record.width) ??
    fallback.width;
  const height =
    (prefix ? getPositiveInteger(record[`${prefix}Height`]) : undefined) ??
    getPositiveInteger(record.height) ??
    fallback.height;

  return { width, height };
}

function buildContactLinks(
  content: Record<string, Prisma.JsonValue>,
  title: string
): string[] {
  return [
    getOptionalLink("Website", content.website, `Open ${title} website`),
    getOptionalLink("Email", getMailtoUrl(content.email), `Email ${title}`),
    getOptionalLink("Call", getTelUrl(content.phone), `Call ${title}`),
  ].filter(Boolean);
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

function getPageTypeClass(type: string): string {
  return `landing-page--${type.replace(/[^a-z0-9_-]/gi, "-").toLowerCase()}`;
}

function getRecord(
  value: Prisma.JsonValue | undefined
): Record<string, Prisma.JsonValue> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};

  return value as Record<string, Prisma.JsonValue>;
}

function getArray(value: Prisma.JsonValue | undefined): Prisma.JsonValue[] {
  return Array.isArray(value) ? value : [];
}

function getFirstValue(
  record: Record<string, Prisma.JsonValue>,
  keys: readonly string[]
): Prisma.JsonValue | undefined {
  for (const key of keys) {
    const value = record[key];
    if (value !== undefined && value !== null) return value;
  }

  return undefined;
}

function getFirstString(
  record: Record<string, Prisma.JsonValue>,
  keys: readonly string[]
): string | undefined {
  for (const key of keys) {
    const value = getString(record[key]);
    if (value) return value;
  }

  return undefined;
}

function getString(
  value: Prisma.JsonValue | string | undefined
): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function getPositiveInteger(value: Prisma.JsonValue | undefined): number | undefined {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return Math.round(value);
  }

  const text = getString(value);
  if (!text) return undefined;

  const parsed = Number.parseInt(text, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function getAllowedMediaSource(value: Prisma.JsonValue | undefined): string | undefined {
  const source = getString(value);
  if (!source) return undefined;

  if (source.startsWith("/") && !source.startsWith("//")) return source;

  return undefined;
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
    :root {
      color-scheme: light;
      --accent: #0369A1;
      --accent-strong: #075985;
      --accent-soft: #E0F2FE;
      --border: #DCE6EF;
      --ink: #0F172A;
      --muted: #475569;
      --soft: #F1F5F9;
      --surface: #FFFFFF;
      --page: #F6F8FB;
      --focus: #F59E0B;
    }
    * { box-sizing: border-box; }
    html { min-height: 100%; }
    body {
      margin: 0;
      min-height: 100vh;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      color: var(--ink);
      background: var(--page);
      text-rendering: optimizeLegibility;
    }
    .page-shell {
      width: 100%;
      min-height: 100vh;
      display: grid;
      place-items: start center;
      padding: 32px 16px 56px;
    }
    .landing-page {
      width: min(760px, 100%);
      display: grid;
      gap: 24px;
    }
    .page-header {
      display: grid;
      gap: 10px;
      margin: 0;
    }
    .eyebrow {
      color: var(--accent-strong);
      font-size: 0.8125rem;
      font-weight: 800;
      letter-spacing: 0;
      line-height: 1.2;
      margin: 0;
      text-transform: uppercase;
    }
    h1 {
      color: var(--ink);
      font-size: 2.125rem;
      font-weight: 850;
      letter-spacing: 0;
      line-height: 1.08;
      margin: 0;
      max-width: 14ch;
      overflow-wrap: anywhere;
    }
    h2,
    .section-title {
      color: var(--ink);
      font-size: 1.125rem;
      letter-spacing: 0;
      line-height: 1.3;
      margin: 0 0 14px;
    }
    p {
      color: var(--muted);
      font-size: 1rem;
      line-height: 1.7;
      margin: 0;
      max-width: 68ch;
    }
    .subtitle {
      color: #334155;
      font-size: 1.125rem;
      line-height: 1.55;
      max-width: 58ch;
    }
    .avatar {
      width: 112px;
      height: 112px;
      border-radius: 8px;
      object-fit: cover;
      border: 1px solid var(--border);
      background: var(--surface);
    }
    .hero-media,
    .image-frame,
    .panel,
    .media-panel {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 8px;
      overflow: hidden;
    }
    .hero-media {
      margin: 0;
    }
    .hero-image,
    .gallery-image {
      width: 100%;
      height: auto;
      display: block;
      object-fit: cover;
      background: var(--soft);
    }
    .hero-image {
      aspect-ratio: 16 / 9;
    }
    .gallery-image {
      aspect-ratio: 3 / 2;
    }
    figcaption {
      color: var(--muted);
      font-size: 0.9375rem;
      line-height: 1.5;
      padding: 12px 14px;
    }
    .links {
      display: grid;
      gap: 12px;
      margin-top: 4px;
    }
    .primary-link {
      min-height: 48px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 12px 18px;
      border-radius: 8px;
      background: var(--accent);
      color: white;
      font-weight: 800;
      line-height: 1.25;
      text-align: center;
      text-decoration: none;
      overflow-wrap: anywhere;
    }
    .primary-link:hover {
      background: var(--accent-strong);
    }
    .primary-link:focus-visible {
      outline: 3px solid var(--focus);
      outline-offset: 3px;
    }
    .stack,
    .image-grid {
      display: grid;
      gap: 16px;
    }
    .panel,
    .media-panel {
      padding: 20px;
    }
    .menu-list,
    .simple-list {
      list-style: none;
      padding: 0;
      margin: 0;
      display: grid;
      gap: 16px;
    }
    .simple-list {
      list-style: disc;
      padding-left: 20px;
    }
    .menu-item {
      display: flex;
      justify-content: space-between;
      gap: 16px;
      border-top: 1px solid var(--border);
      padding-top: 16px;
    }
    .menu-item:first-child {
      border-top: 0;
      padding-top: 0;
    }
    .menu-item strong,
    .price {
      color: var(--ink);
      font-weight: 850;
    }
    .price {
      color: var(--accent-strong);
      white-space: nowrap;
    }
    .coupon-code {
      width: fit-content;
      max-width: 100%;
      display: inline-flex;
      padding: 12px 18px;
      border: 1px dashed var(--accent-strong);
      border-radius: 8px;
      background: var(--accent-soft);
      color: var(--accent-strong);
      font-size: 1.35rem;
      font-weight: 850;
      line-height: 1.2;
      overflow-wrap: anywhere;
    }
    .meta-list {
      display: grid;
      gap: 10px;
      margin: 0;
      padding: 16px;
      border: 1px solid var(--border);
      border-radius: 8px;
      background: var(--surface);
    }
    .meta-list div {
      display: grid;
      gap: 2px;
    }
    .meta-list dt {
      color: var(--accent-strong);
      font-size: 0.8125rem;
      font-weight: 800;
      letter-spacing: 0;
      text-transform: uppercase;
    }
    .meta-list dd {
      color: var(--ink);
      margin: 0;
      overflow-wrap: anywhere;
    }
    .image-gallery {
      display: grid;
      gap: 16px;
    }
    .image-frame {
      margin: 0;
    }
    audio {
      width: 100%;
      min-height: 44px;
      margin: 4px 0 0;
    }
    @media (min-width: 640px) {
      .page-shell {
        padding-top: 56px;
      }
      .landing-page {
        gap: 28px;
      }
      h1 {
        font-size: 3rem;
      }
      .image-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }
    @media (prefers-reduced-motion: reduce) {
      *,
      *::before,
      *::after {
        scroll-behavior: auto !important;
      }
    }
  `;
}
