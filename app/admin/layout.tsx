import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Decode Admin",
  description: "Internal Decode control plane for platform audit and operations.",
};

export const dynamic = "force-dynamic";

interface AdminLayoutProps {
  readonly children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return children;
}
