export type LandingPageType =
  | "profile"
  | "business"
  | "links"
  | "menu"
  | "coupon"
  | "event"
  | "feedback"
  | "pdf"
  | "images"
  | "video_link"
  | "audio_link";

export type LandingPageStatus = "draft" | "published" | "archived";
export type PreviewMode = "mobile" | "desktop";

export interface LandingPageLink {
  readonly id: string;
  readonly label: string;
  readonly url: string;
}

export interface LandingPageMenuItem {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly price: string;
}

export interface LandingPageMenuSection {
  readonly id: string;
  readonly name: string;
  readonly items: readonly LandingPageMenuItem[];
}

export interface LandingPageImage {
  readonly id: string;
  readonly assetId: string;
  readonly previewUrl: string;
  readonly alt: string;
  readonly caption: string;
}

export interface LandingPageMediaAsset {
  readonly assetId: string;
  readonly previewUrl: string;
  readonly fileName: string;
  readonly contentType: string;
}

export interface LandingPageContent {
  readonly displayName: string;
  readonly headline: string;
  readonly bio: string;
  readonly avatar?: LandingPageMediaAsset;
  readonly businessName: string;
  readonly tagline: string;
  readonly description: string;
  readonly logo?: LandingPageMediaAsset;
  readonly phone: string;
  readonly email: string;
  readonly website: string;
  readonly address: string;
  readonly heading: string;
  readonly links: readonly LandingPageLink[];
  readonly restaurantName: string;
  readonly sections: readonly LandingPageMenuSection[];
  readonly couponHeadline: string;
  readonly couponCode: string;
  readonly couponDetails: string;
  readonly expiresAt: string;
  readonly redemptionUrl: string;
  readonly eventName: string;
  readonly startAt: string;
  readonly endAt: string;
  readonly location: string;
  readonly registrationUrl: string;
  readonly formUrl: string;
  readonly pdfTitle: string;
  readonly pdf?: LandingPageMediaAsset;
  readonly images: readonly LandingPageImage[];
  readonly videoTitle: string;
  readonly videoUrl: string;
  readonly audioTitle: string;
  readonly audioUrl: string;
  readonly audio?: LandingPageMediaAsset;
}

export interface LandingPageTemplate {
  readonly type: LandingPageType;
  readonly label: string;
  readonly description: string;
  readonly mediaKind?: "image" | "pdf" | "audio";
}

