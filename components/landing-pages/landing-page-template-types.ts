import type {
  LandingPageContent,
  LandingPageType,
} from "@/components/landing-pages/landing-page-types";

export type LandingPageTemplateCategory =
  | "personal"
  | "business"
  | "restaurant"
  | "hotel"
  | "school"
  | "event"
  | "retail"
  | "healthcare"
  | "real_estate"
  | "institution"
  | "media"
  | "documents"
  | "feedback";

export type LandingPageTemplateAssetKind = "image" | "pdf" | "audio";
export type LandingPageTemplateStatus = "draft" | "published" | "archived";
export type LandingPageTemplateFlag = "popular" | "new";

export interface LandingPageTemplateAssetRequirement {
  readonly slot:
    | "avatar"
    | "logo"
    | "hero"
    | "gallery"
    | "pdf"
    | "audio"
    | "document";
  readonly label: string;
  readonly kind: LandingPageTemplateAssetKind;
  readonly required: boolean;
}

export interface LandingPageTemplateThumbnail {
  readonly label: string;
  readonly alt: string;
  readonly assetPath?: string;
  readonly tone:
    | "sky"
    | "emerald"
    | "amber"
    | "rose"
    | "indigo"
    | "slate";
}

export interface LandingPageTemplateMobilePreview {
  readonly alt: string;
  readonly assetPath?: string;
  readonly width: 390;
  readonly height: 844;
}

export interface LandingPageTemplatePreset {
  readonly key: string;
  readonly type: LandingPageType;
  readonly label: string;
  readonly description: string;
  readonly category: LandingPageTemplateCategory;
  readonly industry: string;
  readonly status: LandingPageTemplateStatus;
  readonly sortPriority: number;
  readonly flags: readonly LandingPageTemplateFlag[];
  readonly tags: readonly string[];
  readonly recommendedFor: string;
  readonly requiredFields: readonly string[];
  readonly optionalFields: readonly string[];
  readonly defaultTitle: string;
  readonly defaultContent: Partial<LandingPageContent>;
  readonly assetRequirements: readonly LandingPageTemplateAssetRequirement[];
  readonly thumbnail: LandingPageTemplateThumbnail;
  readonly mobilePreview: LandingPageTemplateMobilePreview;
  readonly accessibilityNotes: string;
}

export interface LandingPageTemplateCategoryOption {
  readonly value: "all" | LandingPageTemplateCategory;
  readonly label: string;
}
