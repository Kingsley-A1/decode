import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  BookOpen,
  CreditCard,
  FileCode2,
  FileText,
  HelpCircle,
  Info,
  Link2,
  LockKeyhole,
  MessageSquareQuote,
  QrCode,
  ScanLine,
  Sparkles,
  ScrollText,
  UserRound,
} from "lucide-react";

export interface NavigationItem {
  readonly href: string;
  readonly icon: LucideIcon;
  readonly label: string;
  readonly description: string;
}

export interface NavigationSection {
  readonly title: string;
  readonly items: readonly NavigationItem[];
}

export const primaryNavItems: readonly NavigationItem[] = [
  {
    href: "/dashboard",
    icon: BarChart3,
    label: "Dashboard",
    description: "Workspace overview and saved QR activity.",
  },
  {
    href: "/generate",
    icon: QrCode,
    label: "Generate",
    description: "Create static and dynamic QR codes.",
  },
  {
    href: "/scan",
    icon: ScanLine,
    label: "Scan",
    description: "Scan QR codes with camera or image upload.",
  },
  {
    href: "/landing-pages",
    icon: FileText,
    label: "Pages",
    description: "Build editable QR landing pages.",
  },
  {
    href: "/links",
    icon: Link2,
    label: "Links",
    description: "Verify link safety before you open or share it.",
  },
  {
    href: "/pricing",
    icon: CreditCard,
    label: "Pricing",
    description: "Compare Decode plans and manual payment options.",
  },
  {
    href: "/api",
    icon: FileCode2,
    label: "API",
    description: "Integrate Decode APIs into external apps.",
  },
] as const;

export const appNavSections: readonly NavigationSection[] = [
  {
    title: "Workspace",
    items: [
      primaryNavItems[0],
      {
        href: "/me",
        icon: UserRound,
        label: "Me",
        description: "Account data and page-linked KPIs.",
      },
      primaryNavItems[1],
      primaryNavItems[3],
      {
        href: "/demo",
        icon: Sparkles,
        label: "Demo",
        description: "Explore a complete sample workspace.",
      },
    ],
  },
  {
    title: "Safety & utilities",
    items: [
      primaryNavItems[2],
      primaryNavItems[4],
      {
        href: "/decode",
        icon: FileCode2,
        label: "Decode",
        description: "Encode, decode, and validate text transforms.",
      },
    ],
  },
  {
    title: "Company",
    items: [
      {
        href: "/pricing",
        icon: CreditCard,
        label: "Pricing",
        description: "Compare Decode plans and manual payment options.",
      },
      {
        href: "/docs",
        icon: BookOpen,
        label: "Docs",
        description: "Learn the Decode workflows.",
      },
      primaryNavItems[6],
      {
        href: "/review",
        icon: MessageSquareQuote,
        label: "Reviews",
        description: "Read and submit product reviews.",
      },
      {
        href: "/about",
        icon: Info,
        label: "About",
        description: "How Decode is built and operated.",
      },
      {
        href: "/support",
        icon: HelpCircle,
        label: "Support",
        description: "Contact channels and help paths.",
      },
      {
        href: "/privacy",
        icon: LockKeyhole,
        label: "Privacy",
        description: "How Decode handles product and workspace data.",
      },
      {
        href: "/terms",
        icon: ScrollText,
        label: "Terms",
        description: "Terms for using Decode QR workflows.",
      },
    ],
  },
] as const;

export const allNavItems = appNavSections.flatMap((section) => section.items);

export const menuNavItems: readonly NavigationItem[] = [
  primaryNavItems[0],
  primaryNavItems[1],
  primaryNavItems[2],
  primaryNavItems[3],
  primaryNavItems[4],
  primaryNavItems[5],
  primaryNavItems[6],
  {
    href: "/decode",
    icon: FileCode2,
    label: "Decode",
    description: "Encode, decode, and validate text transforms.",
  },
  {
    href: "/review",
    icon: MessageSquareQuote,
    label: "Reviews",
    description: "Read and submit product reviews.",
  },
  {
    href: "/me",
    icon: UserRound,
    label: "Me",
    description: "Account data and page-linked KPIs.",
  },
  {
    href: "/demo",
    icon: Sparkles,
    label: "Demo",
    description: "Explore a complete sample workspace.",
  },
  {
    href: "/docs",
    icon: BookOpen,
    label: "Docs",
    description: "Learn the Decode workflows.",
  },
  {
    href: "/about",
    icon: Info,
    label: "About",
    description: "How Decode is built and operated.",
  },
  {
    href: "/support",
    icon: HelpCircle,
    label: "Support",
    description: "Contact channels and help paths.",
  },
  {
    href: "/privacy",
    icon: LockKeyhole,
    label: "Privacy",
    description: "How Decode handles product and workspace data.",
  },
  {
    href: "/terms",
    icon: ScrollText,
    label: "Terms",
    description: "Terms for using Decode QR workflows.",
  },
] as const;

export function isActivePath(pathname: string, href: string): boolean {
  if (href === "/generate") return pathname === "/" || pathname === "/generate";
  return pathname === href || pathname.startsWith(`${href}/`);
}
