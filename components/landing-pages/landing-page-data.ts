import type {
  LandingPageContent,
  LandingPageTemplate,
} from "@/components/landing-pages/landing-page-types";

export const landingPageTemplates: readonly LandingPageTemplate[] = [
  {
    type: "profile",
    label: "Profile",
    description: "Personal bio, avatar, and social links.",
    mediaKind: "image",
  },
  {
    type: "business",
    label: "Business",
    description: "Company info, contact actions, and website links.",
    mediaKind: "image",
  },
  {
    type: "links",
    label: "Multiple links",
    description: "A compact link-in-bio page for campaigns.",
  },
  {
    type: "menu",
    label: "Menu",
    description: "Restaurant sections, items, and prices.",
  },
  {
    type: "coupon",
    label: "Coupon",
    description: "Offer code, expiry, and redemption link.",
  },
  {
    type: "event",
    label: "Event",
    description: "Event details, time, location, and registration.",
  },
  {
    type: "feedback",
    label: "Feedback",
    description: "Customer feedback page that opens a form.",
  },
  {
    type: "pdf",
    label: "PDF",
    description: "Attach a brochure, catalog, or document.",
    mediaKind: "pdf",
  },
  {
    type: "images",
    label: "Images",
    description: "Gallery page for product or venue photos.",
    mediaKind: "image",
  },
  {
    type: "video_link",
    label: "Video link",
    description: "Drive visitors to a hosted video.",
  },
  {
    type: "audio_link",
    label: "Audio link",
    description: "Share a hosted or uploaded audio track.",
    mediaKind: "audio",
  },
];

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

