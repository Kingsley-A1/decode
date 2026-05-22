import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Boxes,
  FileText,
  History,
  Image,
  LayoutDashboard,
  LayoutTemplate,
  Link2,
  QrCode,
  Settings,
  Star,
  Users,
} from "lucide-react";

export interface AdminNavigationItem {
  readonly href: string;
  readonly label: string;
  readonly description: string;
  readonly icon: LucideIcon;
}

export const adminNavigationItems: readonly AdminNavigationItem[] = [
  {
    href: "/admin/overview",
    label: "Overview",
    description: "Platform KPIs and recent risk signals.",
    icon: LayoutDashboard,
  },
  {
    href: "/admin/audit",
    label: "Audit",
    description: "Unified platform, workspace, and admin auth timeline.",
    icon: History,
  },
  {
    href: "/admin/users",
    label: "Users",
    description: "Customer accounts and ownership footprint.",
    icon: Users,
  },
  {
    href: "/admin/workspaces",
    label: "Workspaces",
    description: "Organizations, members, QR volume, and scan totals.",
    icon: Boxes,
  },
  {
    href: "/admin/qr-codes",
    label: "QR Codes",
    description: "Static and dynamic QR inventory.",
    icon: QrCode,
  },
  {
    href: "/admin/landing-pages",
    label: "Landing Pages",
    description: "Published and draft page inventory.",
    icon: FileText,
  },
  {
    href: "/admin/templates",
    label: "Page Templates",
    description: "Template catalog, status, usage, and required assets.",
    icon: LayoutTemplate,
  },
  {
    href: "/admin/assets",
    label: "Assets",
    description: "Uploads without exposing R2 object keys.",
    icon: Image,
  },
  {
    href: "/admin/scans",
    label: "Scans",
    description: "Privacy-preserving scan telemetry.",
    icon: Activity,
  },
  {
    href: "/admin/reviews",
    label: "Reviews",
    description: "Review moderation queue.",
    icon: Star,
  },
  {
    href: "/admin/system",
    label: "System",
    description: "Admin accounts, link checks, and runtime readiness.",
    icon: Settings,
  },
  {
    href: "/admin/link-checks",
    label: "Link Checks",
    description: "Cached URL safety verdicts.",
    icon: Link2,
  },
] as const;
