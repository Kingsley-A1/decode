export const LANDING_PAGE_TEMPLATE_STATUS = {
  DRAFT: "draft",
  PUBLISHED: "published",
  ARCHIVED: "archived",
} as const;

export const LANDING_PAGE_TEMPLATE_SOURCE = {
  FIRST_PARTY: "first_party",
  ADMIN: "admin",
} as const;

export const LANDING_PAGE_TEMPLATE_USAGE_CONTEXT = {
  LANDING_PAGE_CREATE: "landing_page_create",
} as const;

export type LandingPageTemplateStatus =
  (typeof LANDING_PAGE_TEMPLATE_STATUS)[keyof typeof LANDING_PAGE_TEMPLATE_STATUS];
export type LandingPageTemplateSource =
  (typeof LANDING_PAGE_TEMPLATE_SOURCE)[keyof typeof LANDING_PAGE_TEMPLATE_SOURCE];
