export const LANDING_PAGE_TYPE = {
  PROFILE: "profile",
  BUSINESS: "business",
  LINKS: "links",
  MENU: "menu",
  COUPON: "coupon",
  EVENT: "event",
  FEEDBACK: "feedback",
  PDF: "pdf",
  IMAGES: "images",
  VIDEO_LINK: "video_link",
  AUDIO_LINK: "audio_link",
} as const;

export const LANDING_PAGE_STATUS = {
  DRAFT: "draft",
  PUBLISHED: "published",
  ARCHIVED: "archived",
} as const;

export type LandingPageType =
  (typeof LANDING_PAGE_TYPE)[keyof typeof LANDING_PAGE_TYPE];
export type LandingPageStatus =
  (typeof LANDING_PAGE_STATUS)[keyof typeof LANDING_PAGE_STATUS];
