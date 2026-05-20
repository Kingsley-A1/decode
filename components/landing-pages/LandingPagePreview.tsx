import {
  CalendarDays,
  FileText,
  Image as ImageIcon,
  Link2,
  MapPin,
  Music2,
  Phone,
  TicketPercent,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  LandingPageContent,
  LandingPageType,
  PreviewMode,
} from "@/components/landing-pages/landing-page-types";

interface LandingPagePreviewProps {
  readonly type: LandingPageType;
  readonly title: string;
  readonly content: LandingPageContent;
  readonly mode: PreviewMode;
}

export function LandingPagePreview({
  type,
  title,
  content,
  mode,
}: LandingPagePreviewProps) {
  return (
    <section
      aria-label="Landing page preview"
      className={cn(
        "mx-auto overflow-hidden rounded-[28px] border border-slate-200 bg-slate-100 shadow-sm",
        mode === "mobile" ? "w-full max-w-[390px]" : "w-full max-w-4xl"
      )}
    >
      <div
        className={cn(
          "bg-white",
          mode === "mobile" ? "min-h-[680px]" : "min-h-[520px]"
        )}
      >
        <div
          className={cn(
            "mx-auto w-full",
            mode === "mobile" ? "max-w-sm p-5" : "max-w-3xl p-8"
          )}
        >
          {renderPreviewBody({ type, title, content })}
        </div>
      </div>
    </section>
  );
}

function renderPreviewBody({
  type,
  title,
  content,
}: {
  readonly type: LandingPageType;
  readonly title: string;
  readonly content: LandingPageContent;
}) {
  if (type === "profile") {
    return (
      <PreviewStack>
        <MediaLogo
          src={content.avatar?.previewUrl}
          fallback={content.displayName}
          label={`${content.displayName || title} avatar`}
        />
        <PreviewHeader
          eyebrow="Profile"
          title={content.displayName || title}
          subtitle={content.headline}
        />
        <PreviewParagraph>{content.bio}</PreviewParagraph>
        <PreviewLinks links={content.links} />
      </PreviewStack>
    );
  }

  if (type === "business") {
    return (
      <PreviewStack>
        <MediaLogo
          src={content.logo?.previewUrl}
          fallback={content.businessName}
          label={`${content.businessName || title} logo`}
        />
        <PreviewHeader
          eyebrow="Business"
          title={content.businessName || title}
          subtitle={content.tagline}
        />
        <PreviewParagraph>{content.description}</PreviewParagraph>
        <div className="grid gap-2">
          {content.phone && (
            <ContactLine icon={<Phone className="h-4 w-4" aria-hidden="true" />}>
              {content.phone}
            </ContactLine>
          )}
          {content.address && (
            <ContactLine icon={<MapPin className="h-4 w-4" aria-hidden="true" />}>
              {content.address}
            </ContactLine>
          )}
        </div>
        <PreviewLinks
          links={[
            ...content.links,
            ...(content.website
              ? [{ id: "website", label: "Website", url: content.website }]
              : []),
          ]}
        />
      </PreviewStack>
    );
  }

  if (type === "links") {
    return (
      <PreviewStack>
        <PreviewHeader
          eyebrow="Links"
          title={content.heading || title}
          subtitle={content.description}
        />
        <PreviewLinks links={content.links} />
      </PreviewStack>
    );
  }

  if (type === "menu") {
    return (
      <PreviewStack>
        <PreviewHeader
          eyebrow="Menu"
          title={content.restaurantName || title}
          subtitle={content.description}
        />
        <div className="grid gap-4">
          {content.sections.map((section) => (
            <section
              key={section.id}
              className="rounded-lg border border-slate-200 bg-slate-50 p-4"
            >
              <h2 className="text-base font-semibold text-slate-950">
                {section.name}
              </h2>
              <ul className="mt-4 grid gap-3">
                {section.items.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-start justify-between gap-4 border-t border-slate-200 pt-3 first:border-t-0 first:pt-0"
                  >
                    <span>
                      <span className="block font-semibold text-slate-900">
                        {item.name}
                      </span>
                      {item.description && (
                        <span className="mt-1 block text-sm leading-6 text-slate-600">
                          {item.description}
                        </span>
                      )}
                    </span>
                    {item.price && (
                      <span className="shrink-0 font-semibold text-sky-700">
                        {item.price}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </PreviewStack>
    );
  }

  if (type === "coupon") {
    return (
      <PreviewStack>
        <PreviewHeader
          eyebrow="Coupon"
          title={content.couponHeadline || title}
        />
        <div className="inline-flex rounded-lg border border-dashed border-sky-500 bg-sky-50 px-4 py-3 text-lg font-bold text-sky-900">
          {content.couponCode}
        </div>
        <PreviewParagraph>{content.couponDetails}</PreviewParagraph>
        {content.expiresAt && (
          <ContactLine
            icon={<TicketPercent className="h-4 w-4" aria-hidden="true" />}
          >
            Expires {content.expiresAt}
          </ContactLine>
        )}
        <PreviewLinks
          links={
            content.redemptionUrl
              ? [
                  {
                    id: "redeem",
                    label: "Redeem offer",
                    url: content.redemptionUrl,
                  },
                ]
              : []
          }
        />
      </PreviewStack>
    );
  }

  if (type === "event") {
    return (
      <PreviewStack>
        <PreviewHeader eyebrow="Event" title={content.eventName || title} />
        <ContactLine icon={<CalendarDays className="h-4 w-4" aria-hidden="true" />}>
          Starts {content.startAt}
        </ContactLine>
        {content.location && (
          <ContactLine icon={<MapPin className="h-4 w-4" aria-hidden="true" />}>
            {content.location}
          </ContactLine>
        )}
        <PreviewParagraph>{content.description}</PreviewParagraph>
        <PreviewLinks
          links={
            content.registrationUrl
              ? [
                  {
                    id: "register",
                    label: "Register",
                    url: content.registrationUrl,
                  },
                ]
              : []
          }
        />
      </PreviewStack>
    );
  }

  if (type === "feedback") {
    return (
      <PreviewStack>
        <PreviewHeader
          eyebrow="Feedback"
          title={content.heading || title}
          subtitle={content.description}
        />
        <PreviewLinks
          links={
            content.formUrl
              ? [{ id: "feedback", label: "Open feedback form", url: content.formUrl }]
              : []
          }
        />
      </PreviewStack>
    );
  }

  if (type === "pdf") {
    return (
      <PreviewStack>
        <PreviewHeader
          eyebrow="PDF"
          title={content.pdfTitle || title}
          subtitle={content.description}
        />
        <DocumentPanel
          icon={<FileText className="h-5 w-5" aria-hidden="true" />}
          title={content.pdf?.fileName || "Upload a PDF"}
          label="PDF document"
        />
      </PreviewStack>
    );
  }

  if (type === "images") {
    return (
      <PreviewStack>
        <PreviewHeader
          eyebrow="Gallery"
          title={content.heading || title}
          subtitle={content.description}
        />
        <div className="grid gap-3">
          {content.images.map((image) => (
            <figure
              key={image.id}
              className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50"
            >
              {image.previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={image.previewUrl}
                  alt={image.alt || "Landing page image"}
                  className="aspect-video w-full object-cover"
                />
              ) : (
                <div className="flex aspect-video items-center justify-center bg-sky-50 text-sky-700">
                  <ImageIcon className="h-8 w-8" aria-hidden="true" />
                </div>
              )}
              <figcaption className="p-3 text-sm leading-6 text-slate-600">
                {image.caption || image.alt || "Image caption"}
              </figcaption>
            </figure>
          ))}
        </div>
      </PreviewStack>
    );
  }

  if (type === "video_link") {
    return (
      <PreviewStack>
        <PreviewHeader
          eyebrow="Video"
          title={content.videoTitle || title}
          subtitle={content.description}
        />
        <PreviewLinks
          links={
            content.videoUrl
              ? [{ id: "video", label: "Open video", url: content.videoUrl }]
              : []
          }
        />
      </PreviewStack>
    );
  }

  return (
    <PreviewStack>
      <PreviewHeader
        eyebrow="Audio"
        title={content.audioTitle || title}
        subtitle={content.description}
      />
      {content.audio?.previewUrl ? (
        <audio
          controls
          preload="metadata"
          src={content.audio.previewUrl}
          aria-label={`${content.audioTitle || title} audio preview`}
          className="w-full"
        />
      ) : (
        <DocumentPanel
          icon={<Music2 className="h-5 w-5" aria-hidden="true" />}
          title={content.audio?.fileName || "Add an audio source"}
          label="Audio file"
        />
      )}
      <PreviewLinks
        links={
          content.audioUrl
            ? [{ id: "audio", label: "Open audio", url: content.audioUrl }]
            : []
        }
      />
    </PreviewStack>
  );
}

function PreviewStack({ children }: { readonly children: React.ReactNode }) {
  return <div className="space-y-5">{children}</div>;
}

function PreviewHeader({
  eyebrow,
  title,
  subtitle,
}: {
  readonly eyebrow: string;
  readonly title: string;
  readonly subtitle?: string;
}) {
  return (
    <header>
      <p className="text-xs font-bold uppercase text-sky-700">{eyebrow}</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-normal text-slate-950">
        {title}
      </h1>
      {subtitle && (
        <p className="mt-3 text-base leading-7 text-slate-600">{subtitle}</p>
      )}
    </header>
  );
}

function PreviewParagraph({ children }: { readonly children?: string }) {
  if (!children) return null;

  return <p className="text-base leading-7 text-slate-600">{children}</p>;
}

function PreviewLinks({
  links,
}: {
  readonly links: readonly { readonly id: string; readonly label: string; readonly url: string }[];
}) {
  if (links.length === 0) return null;

  return (
    <nav className="grid gap-3" aria-label="Landing page links">
      {links.map((link) => (
        <a
          key={link.id}
          href={link.url}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-sky-700 px-4 py-3 text-sm font-semibold text-white shadow-sm shadow-sky-700/20 transition-colors hover:bg-sky-800"
        >
          <Link2 className="h-4 w-4" aria-hidden="true" />
          {link.label}
        </a>
      ))}
    </nav>
  );
}

function ContactLine({
  icon,
  children,
}: {
  readonly icon: React.ReactNode;
  readonly children: React.ReactNode;
}) {
  return (
    <p className="flex items-start gap-2 text-sm leading-6 text-slate-600">
      <span className="mt-1 text-sky-700">{icon}</span>
      <span>{children}</span>
    </p>
  );
}

function MediaLogo({
  src,
  fallback,
  label,
}: {
  readonly src?: string;
  readonly fallback: string;
  readonly label: string;
}) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={label}
        className="h-24 w-24 rounded-2xl border border-sky-100 object-cover"
      />
    );
  }

  return (
    <div
      aria-label={label}
      className="flex h-24 w-24 items-center justify-center rounded-2xl border border-sky-100 bg-sky-50 text-2xl font-semibold text-sky-800"
    >
      {(fallback || "D").slice(0, 1).toUpperCase()}
    </div>
  );
}

function DocumentPanel({
  icon,
  title,
  label,
}: {
  readonly icon: React.ReactNode;
  readonly title: string;
  readonly label: string;
}) {
  return (
    <div
      aria-label={label}
      className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4"
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-sky-100 text-sky-700">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold text-slate-950">
          {title}
        </span>
        <span className="block text-sm text-slate-600">{label}</span>
      </span>
    </div>
  );
}
