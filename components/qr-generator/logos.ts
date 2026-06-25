import {
  Contact as ContactIcon,
  Link as LinkIcon,
  Mail,
  MessageCircle,
  Phone,
  UploadCloud,
  Wifi,
  X,
} from "lucide-react";
import {
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
  FaWhatsapp,
  FaYoutube,
} from "react-icons/fa";
import type { LogoChoiceOption, LogoChoiceValue, QRType } from "./types";

type UtilityLogoKey = "email" | "link" | "phone" | "sms" | "vcard" | "wifi";

const socialLogoAssetPaths = {
  facebook: "/assets/socials/facebook.jpeg",
  instagram: "/assets/socials/instagram.jpeg",
  linkedin: "/assets/socials/linkedin.jpeg",
  youtube: "/assets/socials/youtube.jpeg",
  whatsapp: "/assets/socials/whatsapp.jpeg",
} as const;

function createUtilityLogoSvg({
  color,
  path,
}: {
  readonly color: string;
  readonly path: string;
}): string {
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" style="color:${color}">`,
    `<rect x="8" y="8" width="112" height="112" rx="28" fill="#FFFFFF"/>`,
    `<rect x="8" y="8" width="112" height="112" rx="28" fill="${color}" fill-opacity="0.1"/>`,
    path,
    `</svg>`,
  ].join("");
}

const utilityLogoSvgByKey: Record<UtilityLogoKey, string> = {
  email: createUtilityLogoSvg({
    color: "#F59E0B",
    path: `<path d="M31 42h66v44H31V42Zm6 8 27 20 27-20M37 80l19-16m35 16L72 64" fill="none" stroke="currentColor" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>`,
  }),
  link: createUtilityLogoSvg({
    color: "#7C3AED",
    path: `<path d="M52 76 42 86c-9 9-23-5-14-14l17-17c6-6 15-6 21-1m10-2 10-10c9-9 23 5 14 14L83 73c-6 6-15 6-21 1m-9-10h22" fill="none" stroke="currentColor" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>`,
  }),
  phone: createUtilityLogoSvg({
    color: "#0F766E",
    path: `<path d="M43 29 32 40c-4 4 3 24 21 42s38 25 42 21l11-11-17-18-10 8c-8-4-15-11-20-20l8-10L43 29Z" fill="none" stroke="currentColor" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>`,
  }),
  sms: createUtilityLogoSvg({
    color: "#2563EB",
    path: `<path d="M29 38h70a9 9 0 0 1 9 9v32a9 9 0 0 1-9 9H57l-23 15V88h-5a9 9 0 0 1-9-9V47a9 9 0 0 1 9-9Z" fill="none" stroke="currentColor" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/><path d="M43 63h42M43 76h26" fill="none" stroke="currentColor" stroke-width="8" stroke-linecap="round"/>`,
  }),
  vcard: createUtilityLogoSvg({
    color: "#007AFF",
    path: `<rect x="28" y="37" width="72" height="54" rx="10" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="51" cy="61" r="9" fill="currentColor"/><path d="M38 80c4-9 22-9 26 0m15-19h12m-12 16h12" fill="none" stroke="currentColor" stroke-width="7" stroke-linecap="round"/>`,
  }),
  wifi: createUtilityLogoSvg({
    color: "#0284C7",
    path: `<path d="M31 55c19-17 47-17 66 0M45 70c11-10 27-10 38 0M58 84c4-4 8-4 12 0" fill="none" stroke="currentColor" stroke-width="8" stroke-linecap="round"/><circle cx="64" cy="98" r="5" fill="currentColor"/>`,
  }),
};

export const noLogoChoice: LogoChoiceOption = {
  value: "none",
  label: "None",
  description: "Use the QR without a center logo.",
  icon: X,
  color: "#64748B",
  initials: "X",
  ariaLabel: "Use no logo",
};

export const uploadedLogoChoice: LogoChoiceOption = {
  value: "upload",
  label: "Uploaded",
  description: "Use the image selected from your device.",
  icon: UploadCloud,
  color: "#0F172A",
  initials: "IMG",
  ariaLabel: "Use uploaded logo",
};

export const logoPresetOptions: readonly LogoChoiceOption[] = [
  {
    value: "link",
    label: "Link",
    description: "Generic web link icon for website QR codes.",
    icon: LinkIcon,
    color: "#7C3AED",
    initials: "URL",
    logoSvg: utilityLogoSvgByKey.link,
    qrTypes: ["url"],
  },
  {
    value: "instagram",
    label: "IG",
    description: "Social profile icon for Instagram destinations.",
    icon: FaInstagram,
    color: "#E1306C",
    iconColor: "#C13584",
    initials: "IG",
    logoAssetPath: socialLogoAssetPaths.instagram,
    qrTypes: ["url"],
    ariaLabel: "Use Instagram logo",
  },
  {
    value: "facebook",
    label: "FB",
    description: "Social profile icon for Facebook destinations.",
    icon: FaFacebookF,
    color: "#1877F2",
    iconColor: "#1877F2",
    initials: "FB",
    logoAssetPath: socialLogoAssetPaths.facebook,
    qrTypes: ["url"],
    ariaLabel: "Use Facebook logo",
  },
  {
    value: "youtube",
    label: "YT",
    description: "Video channel icon for YouTube destinations.",
    icon: FaYoutube,
    color: "#FF0000",
    iconColor: "#FF0000",
    initials: "YT",
    logoAssetPath: socialLogoAssetPaths.youtube,
    qrTypes: ["url"],
    ariaLabel: "Use YouTube logo",
  },
  {
    value: "linkedin",
    label: "IN",
    description: "Professional profile icon for LinkedIn destinations.",
    icon: FaLinkedinIn,
    color: "#0A66C2",
    iconColor: "#0A66C2",
    initials: "IN",
    logoAssetPath: socialLogoAssetPaths.linkedin,
    qrTypes: ["url"],
    ariaLabel: "Use LinkedIn logo",
  },
  {
    value: "email",
    label: "Email",
    description: "Mail icon for email QR codes.",
    icon: Mail,
    color: "#F59E0B",
    initials: "@",
    logoSvg: utilityLogoSvgByKey.email,
    qrTypes: ["email"],
  },
  {
    value: "phone",
    label: "Phone",
    description: "Phone icon for call QR codes.",
    icon: Phone,
    color: "#0F766E",
    initials: "TEL",
    logoSvg: utilityLogoSvgByKey.phone,
    qrTypes: ["phone"],
  },
  {
    value: "sms",
    label: "SMS",
    description: "Message icon for SMS QR codes.",
    icon: MessageCircle,
    color: "#2563EB",
    initials: "SMS",
    logoSvg: utilityLogoSvgByKey.sms,
    qrTypes: ["sms"],
  },
  {
    value: "whatsapp",
    label: "WA",
    description: "Chat icon for WhatsApp QR codes.",
    icon: FaWhatsapp,
    color: "#25D366",
    iconColor: "#16A34A",
    initials: "WA",
    logoAssetPath: socialLogoAssetPaths.whatsapp,
    qrTypes: ["whatsapp"],
    ariaLabel: "Use WhatsApp logo",
  },
  {
    value: "wifi",
    label: "Wi-Fi",
    description: "Wi-Fi icon for network access QR codes.",
    icon: Wifi,
    color: "#0284C7",
    initials: "WiFi",
    logoSvg: utilityLogoSvgByKey.wifi,
    qrTypes: ["wifi"],
  },
  {
    value: "vcard",
    label: "vCard",
    description: "Contact card icon for vCard QR codes.",
    icon: ContactIcon,
    color: "#007AFF",
    initials: "VC",
    logoSvg: utilityLogoSvgByKey.vcard,
    qrTypes: ["vcard"],
  },
];

export function getLogoChoiceOptions(
  type: QRType,
  currentChoice: LogoChoiceValue
): readonly LogoChoiceOption[] {
  const options = logoPresetOptions.filter(
    (option) => !option.qrTypes || option.qrTypes.includes(type)
  );
  const currentPreset = logoPresetOptions.find(
    (option) => option.value === currentChoice
  );
  const shouldIncludeCurrentPreset =
    currentPreset && !options.some((option) => option.value === currentChoice);

  return [
    noLogoChoice,
    ...(currentChoice === "upload" ? [uploadedLogoChoice] : []),
    ...options,
    ...(shouldIncludeCurrentPreset ? [currentPreset] : []),
  ];
}

export async function createLogoPresetDataUrl(
  option: LogoChoiceOption
): Promise<string> {
  if (option.logoAssetPath) {
    try {
      return await getAssetDataUrl(option.logoAssetPath);
    } catch {
      return createInitialsLogoDataUrl(option);
    }
  }

  if (option.logoSvg) {
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(option.logoSvg)}`;
  }

  return createInitialsLogoDataUrl(option);
}

function createInitialsLogoDataUrl(option: LogoChoiceOption): string {
  const safeText = option.initials.replace(/[<>&]/g, "");
  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">`,
    `<rect x="8" y="8" width="112" height="112" fill="#FFFFFF"/>`,
    `<rect x="8" y="8" width="112" height="112" fill="${option.color}" fill-opacity="0.1"/>`,
    `<text x="64" y="75" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="${safeText.length > 2 ? 26 : 34}" font-weight="700" fill="${option.color}">${safeText}</text>`,
    `</svg>`,
  ].join("");

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

async function getAssetDataUrl(path: string): Promise<string> {
  const response = await fetch(path);

  if (!response.ok) {
    throw new Error(`Logo asset failed to load: ${path}`);
  }

  const blob = await response.blob();

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error(`Logo asset failed to read: ${path}`));
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error(`Logo asset produced no data URL: ${path}`));
    };
    reader.readAsDataURL(blob);
  });
}
