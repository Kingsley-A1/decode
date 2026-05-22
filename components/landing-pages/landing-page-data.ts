import type { LandingPageContent } from "@/components/landing-pages/landing-page-types";
import type {
  LandingPageTemplateAssetRequirement,
  LandingPageTemplateCategory,
  LandingPageTemplateCategoryOption,
  LandingPageTemplateFlag,
  LandingPageTemplateMobilePreview,
  LandingPageTemplatePreset,
  LandingPageTemplateStatus,
  LandingPageTemplateThumbnail,
} from "@/components/landing-pages/landing-page-template-types";
import type { LandingPageType } from "@/components/landing-pages/landing-page-types";

type LandingPageTemplatePresetSeed = Omit<
  LandingPageTemplatePreset,
  | "accessibilityNotes"
  | "flags"
  | "mobilePreview"
  | "optionalFields"
  | "requiredFields"
  | "sortPriority"
  | "source"
  | "status"
  | "thumbnail"
> & {
  readonly accessibilityNotes?: string;
  readonly flags?: readonly LandingPageTemplateFlag[];
  readonly mobilePreview?: Partial<LandingPageTemplateMobilePreview>;
  readonly optionalFields?: readonly string[];
  readonly requiredFields?: readonly string[];
  readonly sortPriority?: number;
  readonly status?: LandingPageTemplateStatus;
  readonly thumbnail: Omit<LandingPageTemplateThumbnail, "alt"> & {
    readonly alt?: string;
  };
};

const avatarAsset: LandingPageTemplateAssetRequirement = {
  slot: "avatar",
  label: "Avatar",
  kind: "image",
  required: false,
};

const logoAsset: LandingPageTemplateAssetRequirement = {
  slot: "logo",
  label: "Logo",
  kind: "image",
  required: false,
};

const heroAsset: LandingPageTemplateAssetRequirement = {
  slot: "hero",
  label: "Hero image",
  kind: "image",
  required: false,
};

const galleryAsset: LandingPageTemplateAssetRequirement = {
  slot: "gallery",
  label: "Gallery images",
  kind: "image",
  required: true,
};

const pdfAsset: LandingPageTemplateAssetRequirement = {
  slot: "pdf",
  label: "PDF",
  kind: "pdf",
  required: false,
};

const audioAsset: LandingPageTemplateAssetRequirement = {
  slot: "audio",
  label: "Audio",
  kind: "audio",
  required: false,
};

const firstPartyImageAssets = {
  businessLogo: {
    assetPath:
      "/assets/landing-page-templates/business/business-logo-placeholder.png",
    alt: "Generic business logo placeholder.",
    width: 512,
    height: 512,
  },
  businessOfficeTeam: {
    assetPath:
      "/assets/landing-page-templates/business/business-office-team-hero.webp",
    alt: "Professional office team in a meeting space.",
    width: 1600,
    height: 900,
  },
  businessProductDisplay: {
    assetPath:
      "/assets/landing-page-templates/business/business-product-service-display.webp",
    alt: "Product and service display on a clean counter.",
    width: 1600,
    height: 900,
  },
  businessServiceBooking: {
    assetPath:
      "/assets/landing-page-templates/business/business-service-booking-hero.webp",
    alt: "Appointment booking desk with calendar and service notes.",
    width: 1600,
    height: 900,
  },
  healthcareAppointmentDesk: {
    assetPath:
      "/assets/landing-page-templates/healthcare/healthcare-appointment-desk.webp",
    alt: "Clinic appointment desk prepared for patient check-in.",
    width: 1600,
    height: 900,
  },
  healthcareClinicLogo: {
    assetPath:
      "/assets/landing-page-templates/healthcare/healthcare-clinic-logo-placeholder.png",
    alt: "Generic clinic logo placeholder.",
    width: 512,
    height: 512,
  },
  healthcareClinicReception: {
    assetPath:
      "/assets/landing-page-templates/healthcare/healthcare-clinic-reception.webp",
    alt: "Clean clinic reception area.",
    width: 1600,
    height: 900,
  },
  healthcareDoctorPortrait: {
    assetPath:
      "/assets/landing-page-templates/healthcare/healthcare-doctor-portrait-placeholder.png",
    alt: "Generic doctor portrait placeholder.",
    width: 512,
    height: 512,
  },
  healthcarePatientInfo: {
    assetPath:
      "/assets/landing-page-templates/healthcare/healthcare-patient-info-cover.webp",
    alt: "Patient information folder on a clinic counter.",
    width: 1600,
    height: 900,
  },
  hotelConciergeGuide: {
    assetPath:
      "/assets/landing-page-templates/hotel/hotel-concierge-local-guide.webp",
    alt: "Hotel concierge local guide materials.",
    width: 1600,
    height: 900,
  },
  hotelDiningRestaurant: {
    assetPath:
      "/assets/landing-page-templates/hotel/hotel-dining-restaurant.webp",
    alt: "Hotel dining restaurant table setting.",
    width: 1600,
    height: 900,
  },
  hotelEventHall: {
    assetPath: "/assets/landing-page-templates/hotel/hotel-event-hall.webp",
    alt: "Hotel event hall prepared for guests.",
    width: 1600,
    height: 900,
  },
  hotelExterior: {
    assetPath: "/assets/landing-page-templates/hotel/hotel-exterior.webp",
    alt: "Hotel exterior entrance.",
    width: 1600,
    height: 900,
  },
  hotelGuestRoom: {
    assetPath: "/assets/landing-page-templates/hotel/hotel-guest-room.webp",
    alt: "Hotel guest room interior.",
    width: 1600,
    height: 900,
  },
  hotelLobby: {
    assetPath: "/assets/landing-page-templates/hotel/hotel-lobby.webp",
    alt: "Hotel lobby and reception area.",
    width: 1600,
    height: 900,
  },
  institutionChurchAuditorium: {
    assetPath:
      "/assets/landing-page-templates/institution/institution-church-auditorium.webp",
    alt: "Church auditorium prepared for service.",
    width: 1600,
    height: 900,
  },
  institutionCommunityEvent: {
    assetPath:
      "/assets/landing-page-templates/institution/institution-community-event.webp",
    alt: "Community event with people gathered indoors.",
    width: 1600,
    height: 900,
  },
  institutionLogo: {
    assetPath:
      "/assets/landing-page-templates/institution/institution-logo-placeholder.png",
    alt: "Generic institution logo placeholder.",
    width: 512,
    height: 512,
  },
  institutionNgoFieldWork: {
    assetPath:
      "/assets/landing-page-templates/institution/institution-ngo-field-work.webp",
    alt: "Nonprofit field work and community support.",
    width: 1600,
    height: 900,
  },
  institutionPublicOffice: {
    assetPath:
      "/assets/landing-page-templates/institution/institution-public-office-reception.webp",
    alt: "Public office reception counter.",
    width: 1600,
    height: 900,
  },
  institutionTrainingRoom: {
    assetPath:
      "/assets/landing-page-templates/institution/institution-training-room.webp",
    alt: "Institution training room with seats and presentation setup.",
    width: 1600,
    height: 900,
  },
  mediaAudioCover: {
    assetPath:
      "/assets/landing-page-templates/media/media-audio-cover-placeholder.webp",
    alt: "Abstract audio cover placeholder.",
    width: 1600,
    height: 900,
  },
  mediaPodcastCover: {
    assetPath:
      "/assets/landing-page-templates/media/media-podcast-cover-placeholder.webp",
    alt: "Abstract podcast cover placeholder.",
    width: 1600,
    height: 900,
  },
  mediaVideoCover: {
    assetPath:
      "/assets/landing-page-templates/media/media-video-cover-placeholder.webp",
    alt: "Abstract video cover placeholder.",
    width: 1600,
    height: 900,
  },
  personalCreatorWorkspace: {
    assetPath:
      "/assets/landing-page-templates/personal/personal-creator-workspace.webp",
    alt: "Creator workspace with laptop and notes.",
    width: 1600,
    height: 900,
  },
  personalCvCover: {
    assetPath:
      "/assets/landing-page-templates/personal/personal-digital-cv-cover.webp",
    alt: "Digital CV cover placeholder.",
    width: 1600,
    height: 900,
  },
  personalPortfolioProject: {
    assetPath:
      "/assets/landing-page-templates/personal/personal-portfolio-project-thumbnail.webp",
    alt: "Portfolio project thumbnail.",
    width: 1600,
    height: 900,
  },
  personalPortrait: {
    assetPath:
      "/assets/landing-page-templates/personal/personal-portrait-placeholder.png",
    alt: "Generic personal portrait placeholder.",
    width: 512,
    height: 512,
  },
  realEstateLivingRoom: {
    assetPath:
      "/assets/landing-page-templates/real-estate/real-estate-living-room.webp",
    alt: "Real estate living room interior.",
    width: 1600,
    height: 900,
  },
  realEstatePropertyExterior: {
    assetPath:
      "/assets/landing-page-templates/real-estate/real-estate-property-exterior.webp",
    alt: "Real estate property exterior.",
    width: 1600,
    height: 900,
  },
  restaurantCoffeeBreakfast: {
    assetPath:
      "/assets/landing-page-templates/restaurant/restaurant-coffee-breakfast.webp",
    alt: "Coffee and breakfast dishes on a restaurant table.",
    width: 1600,
    height: 900,
  },
  restaurantCouponFood: {
    assetPath:
      "/assets/landing-page-templates/restaurant/restaurant-coupon-food-background.webp",
    alt: "Restaurant food background for a coupon offer.",
    width: 1600,
    height: 900,
  },
  restaurantDeliveryPackage: {
    assetPath:
      "/assets/landing-page-templates/restaurant/restaurant-delivery-package.webp",
    alt: "Restaurant delivery package ready for pickup.",
    width: 1600,
    height: 900,
  },
  restaurantInterior: {
    assetPath:
      "/assets/landing-page-templates/restaurant/restaurant-interior.webp",
    alt: "Restaurant interior dining area.",
    width: 1600,
    height: 900,
  },
  restaurantMenuBoard: {
    assetPath:
      "/assets/landing-page-templates/restaurant/restaurant-menu-board.webp",
    alt: "Restaurant menu board.",
    width: 1600,
    height: 900,
  },
  restaurantPlatedMeal: {
    assetPath:
      "/assets/landing-page-templates/restaurant/restaurant-plated-meal.webp",
    alt: "Plated restaurant meal.",
    width: 1600,
    height: 900,
  },
  retailCatalogSpread: {
    assetPath:
      "/assets/landing-page-templates/retail/retail-catalog-spread.webp",
    alt: "Generic retail catalog spread.",
    width: 1600,
    height: 900,
  },
  retailProductPackaging: {
    assetPath:
      "/assets/landing-page-templates/retail/retail-product-packaging.webp",
    alt: "Generic product packaging display.",
    width: 1600,
    height: 900,
  },
  retailWarrantyCard: {
    assetPath:
      "/assets/landing-page-templates/retail/retail-warranty-card.webp",
    alt: "Generic warranty card placeholder.",
    width: 800,
    height: 500,
  },
  schoolCampus: {
    assetPath:
      "/assets/landing-page-templates/school/school-campus-exterior.webp",
    alt: "School campus exterior.",
    width: 1600,
    height: 900,
  },
  schoolClassroom: {
    assetPath: "/assets/landing-page-templates/school/school-classroom.webp",
    alt: "School classroom prepared for students.",
    width: 1600,
    height: 900,
  },
  schoolLibrary: {
    assetPath:
      "/assets/landing-page-templates/school/school-library-resource-center.webp",
    alt: "School library and resource center.",
    width: 1600,
    height: 900,
  },
  schoolLogo: {
    assetPath:
      "/assets/landing-page-templates/school/school-logo-placeholder.png",
    alt: "Generic school logo placeholder.",
    width: 512,
    height: 512,
  },
  schoolOpenDay: {
    assetPath:
      "/assets/landing-page-templates/school/school-open-day-event.webp",
    alt: "School open day event with visitors.",
    width: 1600,
    height: 900,
  },
  schoolProspectusCover: {
    assetPath:
      "/assets/landing-page-templates/school/school-prospectus-cover.webp",
    alt: "School prospectus cover.",
    width: 1600,
    height: 900,
  },
  schoolStudentsStudying: {
    assetPath:
      "/assets/landing-page-templates/school/school-students-studying.webp",
    alt: "Students studying together.",
    width: 1600,
    height: 900,
  },
} as const;

type FirstPartyImageAsset =
  (typeof firstPartyImageAssets)[keyof typeof firstPartyImageAssets];
type TemplateAssetSlot = LandingPageTemplateAssetRequirement["slot"];

function withAssetPath(
  asset: LandingPageTemplateAssetRequirement,
  image: FirstPartyImageAsset
): LandingPageTemplateAssetRequirement {
  return {
    ...asset,
    assetPath: image.assetPath,
    alt: image.alt,
    width: image.width,
    height: image.height,
  };
}

interface TemplateAssetAssignment {
  readonly thumbnail?: FirstPartyImageAsset;
  readonly assets?: Partial<Record<TemplateAssetSlot, FirstPartyImageAsset>>;
  readonly gallery?: readonly FirstPartyImageAsset[];
}

const templateAssetAssignments: Partial<
  Record<string, TemplateAssetAssignment>
> = {
  "personal-profile": {
    thumbnail: firstPartyImageAssets.personalPortrait,
    assets: { avatar: firstPartyImageAssets.personalPortrait },
  },
  "digital-business-card": {
    thumbnail: firstPartyImageAssets.personalPortrait,
    assets: { avatar: firstPartyImageAssets.personalPortrait },
  },
  "business-contact": {
    thumbnail: firstPartyImageAssets.businessOfficeTeam,
    assets: { logo: firstPartyImageAssets.businessLogo },
  },
  "service-booking": {
    thumbnail: firstPartyImageAssets.businessServiceBooking,
    assets: {
      logo: firstPartyImageAssets.businessLogo,
      hero: firstPartyImageAssets.businessServiceBooking,
    },
  },
  "product-info": {
    thumbnail: firstPartyImageAssets.businessProductDisplay,
    assets: { hero: firstPartyImageAssets.businessProductDisplay },
  },
  "creator-link-hub": {
    thumbnail: firstPartyImageAssets.personalCreatorWorkspace,
    assets: { avatar: firstPartyImageAssets.personalPortrait },
  },
  portfolio: {
    thumbnail: firstPartyImageAssets.personalPortfolioProject,
    assets: {
      avatar: firstPartyImageAssets.personalPortrait,
      hero: firstPartyImageAssets.personalPortfolioProject,
    },
  },
  "digital-cv": {
    thumbnail: firstPartyImageAssets.personalCvCover,
    assets: { avatar: firstPartyImageAssets.personalPortrait },
  },
  "restaurant-menu": {
    thumbnail: firstPartyImageAssets.restaurantMenuBoard,
    assets: { hero: firstPartyImageAssets.restaurantMenuBoard },
  },
  "daily-specials": {
    thumbnail: firstPartyImageAssets.restaurantPlatedMeal,
    assets: { hero: firstPartyImageAssets.restaurantPlatedMeal },
  },
  "restaurant-reservation": {
    thumbnail: firstPartyImageAssets.restaurantInterior,
    assets: { hero: firstPartyImageAssets.restaurantInterior },
  },
  "delivery-links": {
    thumbnail: firstPartyImageAssets.restaurantDeliveryPackage,
  },
  "restaurant-coupon": {
    thumbnail: firstPartyImageAssets.restaurantCouponFood,
    assets: { hero: firstPartyImageAssets.restaurantCouponFood },
  },
  "promo-coupon": {
    thumbnail: firstPartyImageAssets.retailCatalogSpread,
    assets: { hero: firstPartyImageAssets.retailCatalogSpread },
  },
  "event-registration": {
    thumbnail: firstPartyImageAssets.institutionCommunityEvent,
    assets: { hero: firstPartyImageAssets.institutionCommunityEvent },
  },
  "pdf-document": {
    thumbnail: firstPartyImageAssets.retailCatalogSpread,
    assets: { hero: firstPartyImageAssets.retailCatalogSpread },
  },
  "image-gallery": {
    thumbnail: firstPartyImageAssets.hotelGuestRoom,
    assets: { gallery: firstPartyImageAssets.hotelGuestRoom },
    gallery: [
      firstPartyImageAssets.hotelGuestRoom,
      firstPartyImageAssets.restaurantInterior,
      firstPartyImageAssets.personalPortfolioProject,
    ],
  },
  "school-admissions": {
    thumbnail: firstPartyImageAssets.schoolCampus,
    assets: {
      logo: firstPartyImageAssets.schoolLogo,
      hero: firstPartyImageAssets.schoolCampus,
    },
  },
  "school-notice-board": {
    thumbnail: firstPartyImageAssets.schoolLibrary,
    assets: { logo: firstPartyImageAssets.schoolLogo },
  },
  "school-open-day": {
    thumbnail: firstPartyImageAssets.schoolOpenDay,
    assets: { hero: firstPartyImageAssets.schoolOpenDay },
  },
  "school-prospectus": {
    thumbnail: firstPartyImageAssets.schoolProspectusCover,
    assets: { logo: firstPartyImageAssets.schoolLogo },
  },
  "alumni-registration": {
    thumbnail: firstPartyImageAssets.schoolStudentsStudying,
    assets: { logo: firstPartyImageAssets.schoolLogo },
  },
  "hotel-welcome": {
    thumbnail: firstPartyImageAssets.hotelLobby,
    assets: { hero: firstPartyImageAssets.hotelLobby },
  },
  "hotel-room-directory": {
    thumbnail: firstPartyImageAssets.hotelGuestRoom,
  },
  "hotel-concierge": {
    thumbnail: firstPartyImageAssets.hotelConciergeGuide,
    assets: { hero: firstPartyImageAssets.hotelConciergeGuide },
  },
  "hotel-booking": {
    thumbnail: firstPartyImageAssets.hotelExterior,
    assets: { hero: firstPartyImageAssets.hotelExterior },
  },
  "hotel-guest-feedback": {
    thumbnail: firstPartyImageAssets.hotelLobby,
  },
  "clinic-appointment": {
    thumbnail: firstPartyImageAssets.healthcareAppointmentDesk,
    assets: { logo: firstPartyImageAssets.healthcareClinicLogo },
  },
  "clinic-profile": {
    thumbnail: firstPartyImageAssets.healthcareClinicReception,
    assets: {
      logo: firstPartyImageAssets.healthcareClinicLogo,
      hero: firstPartyImageAssets.healthcareClinicReception,
    },
  },
  "church-information": {
    thumbnail: firstPartyImageAssets.institutionChurchAuditorium,
    assets: {
      logo: firstPartyImageAssets.institutionLogo,
      hero: firstPartyImageAssets.institutionChurchAuditorium,
    },
  },
  "office-service-directory": {
    thumbnail: firstPartyImageAssets.institutionPublicOffice,
    assets: { logo: firstPartyImageAssets.institutionLogo },
  },
  "property-listing": {
    thumbnail: firstPartyImageAssets.realEstatePropertyExterior,
    assets: { gallery: firstPartyImageAssets.realEstatePropertyExterior },
    gallery: [
      firstPartyImageAssets.realEstatePropertyExterior,
      firstPartyImageAssets.realEstateLivingRoom,
    ],
  },
  "product-warranty": {
    thumbnail: firstPartyImageAssets.retailWarrantyCard,
    assets: { hero: firstPartyImageAssets.retailWarrantyCard },
  },
};

const templateThumbnailAssetPaths: Record<LandingPageTemplateCategory, string> = {
  personal: "/assets/landing-page-templates/thumbnails/personal.svg",
  business: "/assets/landing-page-templates/thumbnails/business.svg",
  restaurant: "/assets/landing-page-templates/thumbnails/restaurant.svg",
  hotel: "/assets/landing-page-templates/thumbnails/hotel.svg",
  school: "/assets/landing-page-templates/thumbnails/school.svg",
  event: "/assets/landing-page-templates/thumbnails/event.svg",
  retail: "/assets/landing-page-templates/thumbnails/retail.svg",
  healthcare: "/assets/landing-page-templates/thumbnails/healthcare.svg",
  real_estate: "/assets/landing-page-templates/thumbnails/real-estate.svg",
  institution: "/assets/landing-page-templates/thumbnails/institution.svg",
  media: "/assets/landing-page-templates/thumbnails/media.svg",
  documents: "/assets/landing-page-templates/thumbnails/documents.svg",
  feedback: "/assets/landing-page-templates/thumbnails/feedback.svg",
};

export const templateCategoryOptions: readonly LandingPageTemplateCategoryOption[] =
  [
    { value: "all", label: "All" },
    { value: "personal", label: "Personal" },
    { value: "business", label: "Business" },
    { value: "restaurant", label: "Restaurant" },
    { value: "hotel", label: "Hotel" },
    { value: "school", label: "School" },
    { value: "event", label: "Event" },
    { value: "retail", label: "Retail" },
    { value: "healthcare", label: "Healthcare" },
    { value: "real_estate", label: "Real estate" },
    { value: "institution", label: "Institution" },
    { value: "media", label: "Media" },
    { value: "documents", label: "Documents" },
    { value: "feedback", label: "Feedback" },
  ];

const templatePresetSeeds: readonly LandingPageTemplatePresetSeed[] =
  [
    {
      key: "personal-profile",
      type: "profile",
      label: "Personal profile",
      description: "Bio, avatar, contact links, and social destinations.",
      category: "personal",
      industry: "Individual",
      tags: ["profile", "personal", "bio", "creator", "contact"],
      recommendedFor: "Business cards, badges, resumes, and creator QR links.",
      defaultTitle: "Personal profile",
      defaultContent: {
        displayName: "Maya Johnson",
        headline: "Product strategist and operator",
        bio: "I help teams turn QR touchpoints into measurable customer journeys.",
        links: [
          { id: "link-website", label: "Portfolio", url: "https://example.com" },
          { id: "link-booking", label: "Book a call", url: "https://example.com/book" },
        ],
      },
      assetRequirements: [avatarAsset],
      thumbnail: { label: "Profile", tone: "sky" },
    },
    {
      key: "digital-business-card",
      type: "business",
      label: "Digital business card",
      description: "Contact details, profile summary, and direct communication actions.",
      category: "business",
      industry: "Professional services",
      tags: ["business card", "contact", "vcard", "professional", "networking"],
      recommendedFor: "Business cards, conference badges, sales meetings, and email signatures.",
      defaultTitle: "Digital business card",
      defaultContent: {
        businessName: "Maya Johnson",
        tagline: "Founder and product operator",
        description: "Save my contact details, open my website, or book a follow-up call.",
        phone: "+15551234567",
        email: "maya@example.com",
        website: "https://example.com",
        address: "Austin, TX",
        links: [
          { id: "link-save-contact", label: "Save contact", url: "https://example.com/contact" },
          { id: "link-book-intro", label: "Book an intro", url: "https://example.com/book" },
        ],
      },
      assetRequirements: [avatarAsset],
      thumbnail: { label: "Card", tone: "sky" },
    },
    {
      key: "business-contact",
      type: "business",
      label: "Business contact",
      description: "Company overview, contact actions, address, and website.",
      category: "business",
      industry: "Business services",
      tags: ["business", "company", "contact", "website", "address"],
      recommendedFor: "Office signage, flyers, packaging, and business cards.",
      defaultTitle: "Business contact",
      defaultContent: {
        businessName: "Northstar Studio",
        tagline: "Practical strategy and digital execution",
        description: "Scan to contact the team, open our website, or book a service.",
        phone: "+15551234567",
        email: "hello@example.com",
        website: "https://example.com",
        address: "120 Market Street, Austin, TX",
        links: [
          { id: "link-services", label: "View services", url: "https://example.com/services" },
          { id: "link-booking", label: "Book a consultation", url: "https://example.com/book" },
        ],
      },
      assetRequirements: [logoAsset],
      thumbnail: { label: "Business", tone: "slate" },
    },
    {
      key: "service-booking",
      type: "links",
      label: "Service booking",
      description: "Booking, consultation, call, and service inquiry links.",
      category: "business",
      industry: "Appointment services",
      tags: ["booking", "appointment", "service", "consultation", "calendar"],
      recommendedFor: "Salons, consultants, clinics, repair services, and studios.",
      defaultTitle: "Service booking",
      defaultContent: {
        heading: "Book a service",
        description: "Choose a time, request a quote, or contact the service team.",
        links: [
          { id: "link-book-service", label: "Book appointment", url: "https://example.com/book" },
          { id: "link-services", label: "View services", url: "https://example.com/services" },
          { id: "link-call", label: "Call the team", url: "https://example.com/contact" },
        ],
      },
      assetRequirements: [logoAsset, heroAsset],
      thumbnail: { label: "Booking", tone: "emerald" },
    },
    {
      key: "product-info",
      type: "business",
      label: "Product info",
      description: "Product summary, support links, warranty, and manual actions.",
      category: "business",
      industry: "Product and packaging",
      tags: ["product", "packaging", "manual", "warranty", "support"],
      recommendedFor: "Packaging QR codes, product inserts, warranty cards, and manuals.",
      defaultTitle: "Product info",
      defaultContent: {
        businessName: "Northstar Bottle",
        tagline: "Product information and care",
        description: "Open the product guide, warranty details, support, and reorder links.",
        phone: "+15551234567",
        email: "support@example.com",
        website: "https://example.com/product",
        address: "Support center",
        links: [
          { id: "link-manual", label: "Read product guide", url: "https://example.com/manual" },
          { id: "link-warranty", label: "Register warranty", url: "https://example.com/warranty" },
          { id: "link-support", label: "Contact support", url: "https://example.com/support" },
        ],
      },
      assetRequirements: [
        withAssetPath(heroAsset, firstPartyImageAssets.retailProductPackaging),
      ],
      thumbnail: {
        label: "Product",
        tone: "slate",
        assetPath: firstPartyImageAssets.retailProductPackaging.assetPath,
      },
    },
    {
      key: "creator-link-hub",
      type: "links",
      label: "Creator link hub",
      description: "A compact link-in-bio page for campaigns and creators.",
      category: "personal",
      industry: "Creator",
      tags: ["links", "creator", "social", "instagram", "portfolio"],
      recommendedFor: "Social bios, event badges, and creator campaigns.",
      defaultTitle: "Creator link hub",
      defaultContent: {
        heading: "Choose your next step",
        description: "Open my latest work, content, and booking links.",
        links: [
          { id: "link-work", label: "Latest work", url: "https://example.com/work" },
          { id: "link-video", label: "Watch video", url: "https://example.com/video" },
          { id: "link-community", label: "Join community", url: "https://example.com/community" },
        ],
      },
      assetRequirements: [avatarAsset],
      thumbnail: { label: "Links", tone: "indigo" },
    },
    {
      key: "portfolio",
      type: "links",
      label: "Portfolio",
      description: "Project links, case studies, contact action, and creator profile.",
      category: "personal",
      industry: "Creative portfolio",
      tags: ["portfolio", "projects", "case studies", "designer", "developer"],
      recommendedFor: "Portfolio QR codes, proposals, resumes, and creator profiles.",
      defaultTitle: "Portfolio",
      defaultContent: {
        heading: "Selected work",
        description: "Explore recent projects, case studies, and contact options.",
        links: [
          { id: "link-case-studies", label: "View case studies", url: "https://example.com/work" },
          { id: "link-resume", label: "Download resume", url: "https://example.com/resume" },
          { id: "link-contact", label: "Contact me", url: "https://example.com/contact" },
        ],
      },
      assetRequirements: [avatarAsset, heroAsset],
      thumbnail: { label: "Work", tone: "indigo" },
    },
    {
      key: "digital-cv",
      type: "pdf",
      label: "Digital CV",
      description: "Resume or profile document with supporting contact details.",
      category: "personal",
      industry: "Career",
      tags: ["cv", "resume", "career", "document", "profile"],
      recommendedFor: "Job applications, speaker bios, consultant profiles, and portfolios.",
      defaultTitle: "Digital CV",
      defaultContent: {
        pdfTitle: "Digital CV",
        description: "Open the latest resume, profile, and professional background.",
      },
      assetRequirements: [pdfAsset, avatarAsset],
      thumbnail: { label: "CV", tone: "rose" },
    },
    {
      key: "restaurant-menu",
      type: "menu",
      label: "Restaurant menu",
      description: "Menu sections, item descriptions, and prices.",
      category: "restaurant",
      industry: "Food and beverage",
      tags: ["restaurant", "menu", "food", "cafe", "bar", "prices"],
      recommendedFor: "Table tents, counter signs, windows, and takeaway packs.",
      defaultTitle: "Restaurant menu",
      defaultContent: {
        restaurantName: "Northstar Cafe",
        description: "Fresh breakfast, coffee, and local lunch specials.",
        sections: [
          {
            id: "section-breakfast",
            name: "Breakfast",
            items: [
              {
                id: "item-toast",
                name: "Avocado toast",
                description: "Sourdough, chili oil, herbs, and lime.",
                price: "$12",
              },
              {
                id: "item-latte",
                name: "House latte",
                description: "Double espresso with steamed milk.",
                price: "$5",
              },
            ],
          },
        ],
      },
      assetRequirements: [logoAsset, heroAsset],
      thumbnail: { label: "Menu", tone: "amber" },
    },
    {
      key: "daily-specials",
      type: "menu",
      label: "Daily specials",
      description: "Rotating specials, featured dishes, and limited-time menu items.",
      category: "restaurant",
      industry: "Food and beverage",
      tags: ["daily specials", "restaurant", "menu", "food", "offers"],
      recommendedFor: "Counter cards, table tents, chef specials, and lunch promotions.",
      defaultTitle: "Daily specials",
      defaultContent: {
        restaurantName: "Northstar Cafe Specials",
        description: "Fresh picks available today while supplies last.",
        sections: [
          {
            id: "section-specials",
            name: "Today only",
            items: [
              {
                id: "item-special-soup",
                name: "Seasonal soup",
                description: "House-made soup with fresh bread.",
                price: "$9",
              },
              {
                id: "item-special-plate",
                name: "Chef plate",
                description: "Daily protein, grains, greens, and sauce.",
                price: "$16",
              },
            ],
          },
        ],
      },
      assetRequirements: [logoAsset, heroAsset],
      thumbnail: { label: "Specials", tone: "amber" },
    },
    {
      key: "restaurant-reservation",
      type: "links",
      label: "Restaurant reservation",
      description: "Booking, delivery, phone, maps, and social links.",
      category: "restaurant",
      industry: "Food and beverage",
      tags: ["restaurant", "reservation", "booking", "delivery", "whatsapp"],
      recommendedFor: "Restaurant tables, posters, business cards, and receipts.",
      defaultTitle: "Restaurant reservation",
      defaultContent: {
        heading: "Reserve or order",
        description: "Book a table, call the team, or open our delivery links.",
        links: [
          { id: "link-reserve", label: "Reserve a table", url: "https://example.com/reserve" },
          { id: "link-delivery", label: "Order delivery", url: "https://example.com/order" },
          { id: "link-map", label: "Open map", url: "https://example.com/map" },
        ],
      },
      assetRequirements: [logoAsset, heroAsset],
      thumbnail: { label: "Reserve", tone: "rose" },
    },
    {
      key: "delivery-links",
      type: "links",
      label: "Delivery links",
      description: "Direct ordering, delivery, phone, map, and social order links.",
      category: "restaurant",
      industry: "Food and beverage",
      tags: ["delivery", "takeaway", "ordering", "restaurant", "food"],
      recommendedFor: "Takeaway bags, receipts, delivery inserts, and counter signage.",
      defaultTitle: "Delivery links",
      defaultContent: {
        heading: "Order from us",
        description: "Choose delivery, pickup, or direct contact options.",
        links: [
          { id: "link-direct-order", label: "Order direct", url: "https://example.com/order" },
          { id: "link-pickup", label: "Schedule pickup", url: "https://example.com/pickup" },
          { id: "link-map", label: "Open location", url: "https://example.com/map" },
        ],
      },
      assetRequirements: [logoAsset],
      thumbnail: { label: "Delivery", tone: "emerald" },
    },
    {
      key: "restaurant-coupon",
      type: "coupon",
      label: "Restaurant coupon",
      description: "Food offer, promo code, expiry, and redemption action.",
      category: "restaurant",
      industry: "Food and beverage",
      tags: ["restaurant", "coupon", "promo", "discount", "loyalty"],
      recommendedFor: "Flyers, table cards, loyalty campaigns, and takeaway inserts.",
      defaultTitle: "Restaurant coupon",
      defaultContent: {
        couponHeadline: "Free drink with lunch",
        couponCode: "LUNCHQR",
        couponDetails: "Show this page when ordering from the lunch menu.",
        expiresAt: "2026-06-30T23:59",
        redemptionUrl: "https://example.com/redeem",
      },
      assetRequirements: [heroAsset],
      thumbnail: { label: "Offer", tone: "rose" },
    },
    {
      key: "promo-coupon",
      type: "coupon",
      label: "Promo coupon",
      description: "Offer code, expiry, details, and redemption action.",
      category: "retail",
      industry: "Retail and campaigns",
      tags: ["coupon", "promo", "discount", "offer", "retail", "restaurant"],
      recommendedFor: "Flyers, counter cards, packaging, and launch campaigns.",
      defaultTitle: "Promo coupon",
      defaultContent: {
        couponHeadline: "20% off your first order",
        couponCode: "DECODE20",
        couponDetails: "Show this page at checkout or use the code online.",
        expiresAt: "2026-06-30T23:59",
        redemptionUrl: "https://example.com/redeem",
      },
      assetRequirements: [heroAsset],
      thumbnail: { label: "Coupon", tone: "emerald" },
    },
    {
      key: "event-registration",
      type: "event",
      label: "Event registration",
      description: "Event details, time, venue, and registration link.",
      category: "event",
      industry: "Events",
      tags: ["event", "registration", "ticket", "conference", "workshop"],
      recommendedFor: "Event banners, tickets, posters, and invitations.",
      defaultTitle: "Event registration",
      defaultContent: {
        eventName: "Launch Night",
        startAt: "2026-06-05T18:00",
        endAt: "2026-06-05T21:00",
        location: "Innovation Hall, Austin",
        description: "Join us for product demos, networking, and live onboarding.",
        registrationUrl: "https://example.com/register",
      },
      assetRequirements: [heroAsset],
      thumbnail: { label: "Event", tone: "indigo" },
    },
    {
      key: "feedback-form",
      type: "feedback",
      label: "Customer feedback",
      description: "Customer feedback page that opens an external form.",
      category: "feedback",
      industry: "Customer experience",
      tags: ["feedback", "review", "survey", "support", "customer"],
      recommendedFor: "Receipts, tables, rooms, counters, and support cards.",
      defaultTitle: "Customer feedback",
      defaultContent: {
        heading: "Tell us how we did",
        description: "Share feedback so the team can improve the next visit.",
        formUrl: "https://example.com/feedback",
      },
      assetRequirements: [logoAsset],
      thumbnail: { label: "Feedback", tone: "sky" },
    },
    {
      key: "pdf-document",
      type: "pdf",
      label: "PDF document",
      description: "Attach a brochure, catalog, prospectus, or report.",
      category: "documents",
      industry: "Documents",
      tags: ["pdf", "document", "brochure", "catalog", "prospectus"],
      recommendedFor: "Brochures, school prospectuses, manuals, and product catalogs.",
      defaultTitle: "PDF document",
      defaultContent: {
        pdfTitle: "Product catalog",
        description: "Open the latest document from this QR code.",
      },
      assetRequirements: [
        pdfAsset,
        withAssetPath(heroAsset, firstPartyImageAssets.retailCatalogSpread),
      ],
      thumbnail: {
        label: "PDF",
        tone: "rose",
        assetPath: firstPartyImageAssets.retailCatalogSpread.assetPath,
      },
    },
    {
      key: "image-gallery",
      type: "images",
      label: "Image gallery",
      description: "Gallery page for products, venues, rooms, or projects.",
      category: "media",
      industry: "Media",
      tags: ["images", "gallery", "photos", "venue", "portfolio", "hotel"],
      recommendedFor: "Property listings, hotel rooms, portfolios, and product displays.",
      defaultTitle: "Image gallery",
      defaultContent: {
        heading: "Gallery",
        description: "Browse selected images and highlights.",
        images: [
          {
            id: "image-preview",
            assetId: "preview-image",
            previewUrl: "",
            alt: "Gallery image",
            caption: "Featured image.",
          },
        ],
      },
      assetRequirements: [galleryAsset],
      thumbnail: { label: "Gallery", tone: "emerald" },
    },
    {
      key: "video-link",
      type: "video_link",
      label: "Video link",
      description: "Drive visitors to a hosted video or product demo.",
      category: "media",
      industry: "Media",
      tags: ["video", "youtube", "demo", "media", "training"],
      recommendedFor: "Product demos, training videos, and event recaps.",
      defaultTitle: "Video link",
      defaultContent: {
        videoTitle: "Watch the launch video",
        videoUrl: "https://example.com/video",
        description: "Open the hosted video from this QR code.",
      },
      assetRequirements: [
        withAssetPath(heroAsset, firstPartyImageAssets.mediaVideoCover),
      ],
      thumbnail: {
        label: "Video",
        tone: "indigo",
        assetPath: firstPartyImageAssets.mediaVideoCover.assetPath,
      },
    },
    {
      key: "audio-link",
      type: "audio_link",
      label: "Audio link",
      description: "Share a hosted or uploaded audio track.",
      category: "media",
      industry: "Media",
      tags: ["audio", "podcast", "music", "guide", "sermon"],
      recommendedFor: "Audio guides, sermons, podcasts, and music releases.",
      defaultTitle: "Audio link",
      defaultContent: {
        audioTitle: "Listen to the audio guide",
        audioUrl: "https://example.com/audio",
        description: "Play or open the audio from this QR code.",
      },
      assetRequirements: [
        audioAsset,
        withAssetPath(heroAsset, firstPartyImageAssets.mediaAudioCover),
      ],
      thumbnail: {
        label: "Audio",
        tone: "slate",
        assetPath: firstPartyImageAssets.mediaPodcastCover.assetPath,
      },
    },
    {
      key: "school-admissions",
      type: "business",
      label: "School admissions",
      description: "Admissions overview, prospectus link, contact, and application action.",
      category: "school",
      industry: "Education",
      tags: ["school", "admissions", "education", "application", "prospectus"],
      recommendedFor: "Open days, school flyers, banners, and admissions campaigns.",
      defaultTitle: "School admissions",
      defaultContent: {
        businessName: "Oakfield Academy",
        tagline: "Admissions are open",
        description: "Explore programs, request information, and start an application.",
        phone: "+15551234567",
        email: "admissions@example.edu",
        website: "https://example.edu/admissions",
        address: "15 Learning Avenue",
        links: [
          { id: "link-apply", label: "Apply now", url: "https://example.edu/apply" },
          { id: "link-prospectus", label: "Download prospectus", url: "https://example.edu/prospectus" },
        ],
      },
      assetRequirements: [logoAsset, heroAsset],
      thumbnail: { label: "School", tone: "sky" },
    },
    {
      key: "school-notice-board",
      type: "links",
      label: "School notice board",
      description: "Parent portal, calendar, payments, and resource links.",
      category: "school",
      industry: "Education",
      tags: ["school", "notice", "parents", "calendar", "students"],
      recommendedFor: "Classrooms, reception, newsletters, and parent communication.",
      defaultTitle: "School notice board",
      defaultContent: {
        heading: "School resources",
        description: "Open the latest parent, student, and school resource links.",
        links: [
          { id: "link-calendar", label: "Academic calendar", url: "https://example.edu/calendar" },
          { id: "link-portal", label: "Parent portal", url: "https://example.edu/portal" },
          { id: "link-fees", label: "Pay fees", url: "https://example.edu/payments" },
        ],
      },
      assetRequirements: [logoAsset],
      thumbnail: { label: "Notice", tone: "emerald" },
    },
    {
      key: "school-open-day",
      type: "event",
      label: "Open day event",
      description: "School visit details, schedule, location, and registration action.",
      category: "school",
      industry: "Education",
      tags: ["school", "open day", "event", "admissions", "registration"],
      recommendedFor: "Open-day banners, parent invitations, admissions flyers, and school gates.",
      defaultTitle: "Open day event",
      defaultContent: {
        eventName: "Open Day",
        startAt: "2026-06-15T10:00",
        endAt: "2026-06-15T13:00",
        location: "Oakfield Academy Campus",
        description: "Visit classrooms, meet the team, and learn about admissions.",
        registrationUrl: "https://example.edu/open-day",
      },
      assetRequirements: [heroAsset],
      thumbnail: { label: "Open day", tone: "indigo" },
    },
    {
      key: "school-prospectus",
      type: "pdf",
      label: "School prospectus",
      description: "Admissions prospectus, program overview, and downloadable school document.",
      category: "school",
      industry: "Education",
      tags: ["school", "prospectus", "pdf", "admissions", "brochure"],
      recommendedFor: "Admissions campaigns, school fairs, parent packs, and open days.",
      defaultTitle: "School prospectus",
      defaultContent: {
        pdfTitle: "School prospectus",
        description: "Open the admissions prospectus and learn about programs, fees, and next steps.",
      },
      assetRequirements: [pdfAsset, logoAsset],
      thumbnail: { label: "Prospectus", tone: "rose" },
    },
    {
      key: "alumni-registration",
      type: "links",
      label: "Alumni registration",
      description: "Alumni form, community updates, giving, and event links.",
      category: "school",
      industry: "Education",
      tags: ["school", "alumni", "registration", "community", "events"],
      recommendedFor: "Alumni campaigns, reunion posters, newsletters, and school events.",
      defaultTitle: "Alumni registration",
      defaultContent: {
        heading: "Join the alumni network",
        description: "Register your details, join updates, and see upcoming alumni events.",
        links: [
          { id: "link-register", label: "Register as alumni", url: "https://example.edu/alumni/register" },
          { id: "link-events", label: "View alumni events", url: "https://example.edu/alumni/events" },
          { id: "link-community", label: "Join community", url: "https://example.edu/alumni/community" },
        ],
      },
      assetRequirements: [logoAsset],
      thumbnail: { label: "Alumni", tone: "sky" },
    },
    {
      key: "hotel-welcome",
      type: "business",
      label: "Hotel welcome",
      description: "Guest welcome, contact details, amenities, and key links.",
      category: "hotel",
      industry: "Hospitality",
      tags: ["hotel", "guest", "welcome", "booking", "concierge"],
      recommendedFor: "Lobby signs, room cards, guest folders, and reception desks.",
      defaultTitle: "Hotel welcome",
      defaultContent: {
        businessName: "Harbor View Hotel",
        tagline: "Welcome to your stay",
        description: "Open guest services, room support, dining, and local recommendations.",
        phone: "+15551234567",
        email: "frontdesk@examplehotel.com",
        website: "https://examplehotel.com",
        address: "42 Harbor Road",
        links: [
          { id: "link-room-service", label: "Room service", url: "https://examplehotel.com/room-service" },
          { id: "link-concierge", label: "Concierge guide", url: "https://examplehotel.com/concierge" },
        ],
      },
      assetRequirements: [logoAsset, heroAsset],
      thumbnail: { label: "Hotel", tone: "slate" },
    },
    {
      key: "hotel-room-directory",
      type: "links",
      label: "Room directory",
      description: "Room service, Wi-Fi, reception, spa, dining, and checkout links.",
      category: "hotel",
      industry: "Hospitality",
      tags: ["hotel", "room", "directory", "wifi", "spa", "restaurant"],
      recommendedFor: "Room QR cards, TV screens, and in-room printed guides.",
      defaultTitle: "Room directory",
      defaultContent: {
        heading: "Guest services",
        description: "Everything you need during your stay.",
        links: [
          { id: "link-wifi", label: "Wi-Fi details", url: "https://examplehotel.com/wifi" },
          { id: "link-dining", label: "Dining and room service", url: "https://examplehotel.com/dining" },
          { id: "link-checkout", label: "Express checkout", url: "https://examplehotel.com/checkout" },
        ],
      },
      assetRequirements: [logoAsset],
      thumbnail: { label: "Room", tone: "indigo" },
    },
    {
      key: "hotel-concierge",
      type: "links",
      label: "Hotel concierge",
      description: "Local guide, transport, dining, attractions, and guest-service links.",
      category: "hotel",
      industry: "Hospitality",
      tags: ["hotel", "concierge", "local guide", "transport", "guest services"],
      recommendedFor: "Room cards, lobby QR signs, guest folders, and welcome messages.",
      defaultTitle: "Hotel concierge",
      defaultContent: {
        heading: "Concierge guide",
        description: "Explore local recommendations and hotel support links.",
        links: [
          { id: "link-attractions", label: "Nearby attractions", url: "https://examplehotel.com/guide" },
          { id: "link-transport", label: "Transport options", url: "https://examplehotel.com/transport" },
          { id: "link-front-desk", label: "Contact front desk", url: "https://examplehotel.com/front-desk" },
        ],
      },
      assetRequirements: [logoAsset, heroAsset],
      thumbnail: { label: "Concierge", tone: "sky" },
    },
    {
      key: "hotel-booking",
      type: "business",
      label: "Hotel booking",
      description: "Direct booking, room details, contact, and reservation actions.",
      category: "hotel",
      industry: "Hospitality",
      tags: ["hotel", "booking", "reservation", "rooms", "hospitality"],
      recommendedFor: "Hotel flyers, room cards, event brochures, and front-desk signage.",
      defaultTitle: "Hotel booking",
      defaultContent: {
        businessName: "Harbor View Hotel",
        tagline: "Book direct for the best available stay",
        description: "Check availability, contact reservations, and view current room offers.",
        phone: "+15551234567",
        email: "reservations@examplehotel.com",
        website: "https://examplehotel.com/book",
        address: "42 Harbor Road",
        links: [
          { id: "link-book-room", label: "Book a room", url: "https://examplehotel.com/book" },
          { id: "link-room-offers", label: "View room offers", url: "https://examplehotel.com/offers" },
        ],
      },
      assetRequirements: [logoAsset, heroAsset],
      thumbnail: { label: "Booking", tone: "slate" },
    },
    {
      key: "hotel-guest-feedback",
      type: "feedback",
      label: "Guest feedback",
      description: "Guest review, checkout feedback, and service recovery form.",
      category: "hotel",
      industry: "Hospitality",
      tags: ["hotel", "guest feedback", "review", "checkout", "survey"],
      recommendedFor: "Checkout cards, room QR signs, receipts, and guest messages.",
      defaultTitle: "Guest feedback",
      defaultContent: {
        heading: "How was your stay?",
        description: "Share feedback with the guest experience team.",
        formUrl: "https://examplehotel.com/feedback",
      },
      assetRequirements: [logoAsset],
      thumbnail: { label: "Guest", tone: "emerald" },
    },
    {
      key: "clinic-appointment",
      type: "links",
      label: "Appointment booking",
      description: "Booking, call, map, patient information, and support links.",
      category: "healthcare",
      industry: "Healthcare",
      tags: ["clinic", "hospital", "appointment", "doctor", "healthcare"],
      recommendedFor: "Clinic reception, appointment cards, and patient posters.",
      defaultTitle: "Clinic appointment",
      defaultContent: {
        heading: "Book or contact the clinic",
        description: "Choose an appointment, call the team, or open patient information.",
        links: [
          { id: "link-book", label: "Book appointment", url: "https://exampleclinic.com/book" },
          { id: "link-call", label: "Call reception", url: "https://exampleclinic.com/contact" },
          { id: "link-info", label: "Patient information", url: "https://exampleclinic.com/info" },
        ],
      },
      assetRequirements: [logoAsset],
      thumbnail: { label: "Clinic", tone: "emerald" },
    },
    {
      key: "clinic-profile",
      type: "business",
      label: "Clinic profile",
      description: "Clinic overview, opening hours, contact, location, and patient links.",
      category: "healthcare",
      industry: "Healthcare",
      tags: ["clinic", "healthcare", "hours", "location", "patient"],
      recommendedFor: "Reception signs, appointment cards, referral flyers, and clinic posters.",
      defaultTitle: "Clinic profile",
      defaultContent: {
        businessName: "Oakfield Clinic",
        tagline: "Patient care and appointment support",
        description: "Find clinic hours, location, patient information, and appointment links.",
        phone: "+15551234567",
        email: "care@exampleclinic.com",
        website: "https://exampleclinic.com",
        address: "18 Care Avenue",
        links: [
          { id: "link-hours", label: "Clinic hours", url: "https://exampleclinic.com/hours" },
          { id: "link-patient-info", label: "Patient information", url: "https://exampleclinic.com/info" },
        ],
      },
      assetRequirements: [logoAsset, heroAsset],
      thumbnail: { label: "Clinic", tone: "sky" },
    },
    {
      key: "church-information",
      type: "business",
      label: "Church information",
      description: "Service times, address, contact, giving, and media links.",
      category: "institution",
      industry: "Religious institution",
      tags: ["church", "service", "giving", "sermon", "institution"],
      recommendedFor: "Welcome cards, church bulletins, banners, and events.",
      defaultTitle: "Church information",
      defaultContent: {
        businessName: "Grace Community Church",
        tagline: "Service times and next steps",
        description: "Find service times, contact the church, give, or listen to recent messages.",
        phone: "+15551234567",
        email: "hello@examplechurch.org",
        website: "https://examplechurch.org",
        address: "22 Chapel Street",
        links: [
          { id: "link-times", label: "Service times", url: "https://examplechurch.org/services" },
          { id: "link-giving", label: "Giving", url: "https://examplechurch.org/give" },
        ],
      },
      assetRequirements: [logoAsset, heroAsset],
      thumbnail: { label: "Church", tone: "amber" },
    },
    {
      key: "office-service-directory",
      type: "links",
      label: "Office service directory",
      description: "Public office services, forms, help desks, and department links.",
      category: "institution",
      industry: "Government and public service",
      tags: ["office", "public service", "government", "directory", "forms"],
      recommendedFor: "Public counters, office entrances, forms, notices, and service desks.",
      defaultTitle: "Office service directory",
      defaultContent: {
        heading: "Service directory",
        description: "Choose the office service, form, or help desk you need.",
        links: [
          { id: "link-services", label: "View services", url: "https://example.gov/services" },
          { id: "link-forms", label: "Download forms", url: "https://example.gov/forms" },
          { id: "link-support", label: "Contact help desk", url: "https://example.gov/help" },
        ],
      },
      assetRequirements: [logoAsset],
      thumbnail: { label: "Office", tone: "slate" },
    },
    {
      key: "property-listing",
      type: "images",
      label: "Property listing",
      description: "Property photos, agent contact, and viewing action.",
      category: "real_estate",
      industry: "Real estate",
      tags: ["real estate", "property", "listing", "gallery", "inspection"],
      recommendedFor: "For-sale signs, flyers, open-house posters, and agent cards.",
      defaultTitle: "Property listing",
      defaultContent: {
        heading: "Property highlights",
        description: "View the gallery and contact the agent for a private inspection.",
        images: [
          {
            id: "property-preview",
            assetId: "preview-property",
            previewUrl: "",
            alt: "Property exterior",
            caption: "Front view and featured spaces.",
          },
        ],
      },
      assetRequirements: [galleryAsset],
      thumbnail: { label: "Property", tone: "slate" },
    },
    {
      key: "product-warranty",
      type: "pdf",
      label: "Product warranty",
      description: "Warranty document, support instructions, and product information.",
      category: "retail",
      industry: "Retail and product",
      tags: ["product", "warranty", "manual", "pdf", "retail", "packaging"],
      recommendedFor: "Product packaging, warranty cards, and in-box printed inserts.",
      defaultTitle: "Product warranty",
      defaultContent: {
        pdfTitle: "Warranty and care guide",
        description: "Open the latest warranty, care, and support document.",
      },
      assetRequirements: [
        pdfAsset,
        withAssetPath(heroAsset, firstPartyImageAssets.retailWarrantyCard),
      ],
      thumbnail: {
        label: "Warranty",
        tone: "rose",
        assetPath: firstPartyImageAssets.retailWarrantyCard.assetPath,
      },
    },
  ];

export const defaultLandingPageTemplatePresets: readonly LandingPageTemplatePreset[] =
  templatePresetSeeds
    .map((template, index) => createTemplatePreset(template, index))
    .sort((first, second) => first.sortPriority - second.sortPriority);

function createTemplatePreset(
  template: LandingPageTemplatePresetSeed,
  index: number
): LandingPageTemplatePreset {
  const assignment = templateAssetAssignments[template.key];

  return {
    ...template,
    defaultContent: applyTemplateAssetContent(template, assignment),
    assetRequirements: template.assetRequirements.map((asset) =>
      applyTemplateAssetRequirement(asset, assignment)
    ),
    status: template.status ?? "published",
    source: "first_party",
    sortPriority: template.sortPriority ?? index + 1,
    flags: template.flags ?? getDefaultTemplateFlags(template.key),
    requiredFields: template.requiredFields ?? getDefaultRequiredFields(template.type),
    optionalFields: template.optionalFields ?? getDefaultOptionalFields(template.type),
    accessibilityNotes:
      template.accessibilityNotes ??
      "Keep headings, links, media labels, and uploaded asset alt text specific to the published page.",
    thumbnail: {
      ...template.thumbnail,
      alt: template.thumbnail.alt ?? `${template.label} template thumbnail`,
      assetPath:
        template.thumbnail.assetPath ??
        assignment?.thumbnail?.assetPath ??
        templateThumbnailAssetPaths[template.category],
    },
    mobilePreview: {
      width: 390,
      height: 844,
      alt: template.mobilePreview?.alt ?? `${template.label} mobile preview`,
      assetPath:
        template.mobilePreview?.assetPath ??
        `/assets/landing-page-templates/mobile-previews/${template.key}.png`,
    },
  };
}

function applyTemplateAssetRequirement(
  asset: LandingPageTemplateAssetRequirement,
  assignment?: TemplateAssetAssignment
): LandingPageTemplateAssetRequirement {
  if (asset.assetPath) return asset;

  const assignedAsset = assignment?.assets?.[asset.slot];

  return assignedAsset ? withAssetPath(asset, assignedAsset) : asset;
}

function applyTemplateAssetContent(
  template: LandingPageTemplatePresetSeed,
  assignment?: TemplateAssetAssignment
): Partial<LandingPageContent> {
  if (!assignment?.gallery || template.type !== "images") {
    return template.defaultContent;
  }

  return {
    ...template.defaultContent,
    images: assignment.gallery.map((asset, index) => ({
      id: `${template.key}-image-${index + 1}`,
      assetId: `${template.key}-first-party-image-${index + 1}`,
      previewUrl: asset.assetPath,
      alt: asset.alt,
      caption:
        index === 0
          ? template.description
          : `${template.label} supporting image ${index + 1}`,
    })),
  };
}

function getDefaultTemplateFlags(
  templateKey: string
): readonly LandingPageTemplateFlag[] {
  const popularTemplates = new Set([
    "digital-business-card",
    "business-contact",
    "service-booking",
    "product-info",
    "restaurant-menu",
    "delivery-links",
    "restaurant-coupon",
    "promo-coupon",
    "event-registration",
    "pdf-document",
    "school-admissions",
    "school-prospectus",
    "hotel-welcome",
    "hotel-concierge",
    "hotel-booking",
    "clinic-appointment",
    "clinic-profile",
    "office-service-directory",
  ]);
  const newTemplates = new Set([
    "digital-business-card",
    "service-booking",
    "product-info",
    "portfolio",
    "digital-cv",
    "daily-specials",
    "delivery-links",
    "restaurant-coupon",
    "school-admissions",
    "school-notice-board",
    "school-open-day",
    "school-prospectus",
    "alumni-registration",
    "hotel-welcome",
    "hotel-room-directory",
    "hotel-concierge",
    "hotel-booking",
    "hotel-guest-feedback",
    "clinic-appointment",
    "clinic-profile",
    "church-information",
    "office-service-directory",
    "property-listing",
    "product-warranty",
  ]);
  const flags: LandingPageTemplateFlag[] = [];

  if (popularTemplates.has(templateKey)) flags.push("popular");
  if (newTemplates.has(templateKey)) flags.push("new");

  return flags;
}

function getDefaultRequiredFields(type: LandingPageType): readonly string[] {
  const requiredFields: Record<LandingPageType, readonly string[]> = {
    profile: ["displayName"],
    business: ["businessName"],
    links: ["heading", "links"],
    menu: ["restaurantName", "sections"],
    coupon: ["couponHeadline", "couponCode"],
    event: ["eventName", "startAt"],
    feedback: ["heading", "formUrl"],
    pdf: ["pdfTitle", "pdf"],
    images: ["heading", "images"],
    video_link: ["videoTitle", "videoUrl"],
    audio_link: ["audioTitle", "audioUrl or audio"],
  };

  return requiredFields[type];
}

function getDefaultOptionalFields(type: LandingPageType): readonly string[] {
  const optionalFields: Record<LandingPageType, readonly string[]> = {
    profile: ["headline", "bio", "avatar", "links"],
    business: ["tagline", "description", "logo", "phone", "email", "website", "address", "links"],
    links: ["description"],
    menu: ["description", "logo", "hero"],
    coupon: ["couponDetails", "expiresAt", "redemptionUrl", "hero"],
    event: ["endAt", "location", "description", "registrationUrl", "hero"],
    feedback: ["description", "logo"],
    pdf: ["description"],
    images: ["description", "captions", "alt text"],
    video_link: ["description", "hero"],
    audio_link: ["description", "audio upload", "cover image"],
  };

  return optionalFields[type];
}

export const initialLandingPageContent: LandingPageContent = {
  displayName: "Maya Johnson",
  headline: "Product strategist and operator",
  bio: "I help teams turn QR touchpoints into measurable customer journeys.",
  businessName: "Northstar Cafe",
  tagline: "Fresh breakfast, coffee, and local lunch specials",
  description:
    "Scan to browse current offers, contact the team, or open the latest campaign destination.",
  phone: "+15551234567",
  email: "hello@example.com",
  website: "https://example.com",
  address: "120 Market Street, Austin, TX",
  heading: "Choose your next step",
  links: [
    { id: "link-website", label: "Visit website", url: "https://example.com" },
    { id: "link-booking", label: "Book a call", url: "https://example.com/book" },
  ],
  restaurantName: "Northstar Cafe",
  sections: [
    {
      id: "section-breakfast",
      name: "Breakfast",
      items: [
        {
          id: "item-toast",
          name: "Avocado toast",
          description: "Sourdough, chili oil, herbs, and lime.",
          price: "$12",
        },
        {
          id: "item-latte",
          name: "House latte",
          description: "Double espresso with steamed milk.",
          price: "$5",
        },
      ],
    },
  ],
  couponHeadline: "20% off your first order",
  couponCode: "DECODE20",
  couponDetails: "Show this page at checkout or use the code online.",
  expiresAt: "2026-06-30T23:59",
  redemptionUrl: "https://example.com/redeem",
  eventName: "Launch Night",
  startAt: "2026-06-05T18:00",
  endAt: "2026-06-05T21:00",
  location: "Innovation Hall, Austin",
  registrationUrl: "https://example.com/register",
  formUrl: "https://example.com/feedback",
  pdfTitle: "Product catalog",
  images: [
    {
      id: "image-preview",
      assetId: "preview-image",
      previewUrl: "",
      alt: "Product display",
      caption: "Featured products and current offers.",
    },
  ],
  videoTitle: "Watch the launch video",
  videoUrl: "https://example.com/video",
  audioTitle: "Listen to the audio guide",
  audioUrl: "https://example.com/audio",
};
