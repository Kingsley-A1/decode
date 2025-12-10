"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  QrCode,
  Lock,
  Users,
  MessageSquare,
  Phone,
  BookOpen,
  Heart,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", icon: QrCode, label: "QR Code" },
  { href: "/cipher", icon: Lock, label: "Cipher" },
  { href: "/about", icon: Users, label: "About" },
  { href: "/documentation", icon: BookOpen, label: "Docs" },
  { href: "/documentation#support", icon: Heart, label: "Support" },
  { href: "/contact", icon: Phone, label: "Contact" },
  { href: "/review", icon: MessageSquare, label: "Review" },
];

export function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-5xl glass border-t border-neutral-800 z-50">
      <div className="flex items-center justify-around py-2 px-2 md:py-3 md:px-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const isSupport = item.href.includes("#support");
          const isSupportActive = isSupport && pathname === "/documentation";
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex flex-col md:flex-row items-center gap-1 md:gap-2 px-3 md:px-5 py-2 md:py-2.5 rounded-xl transition-all duration-300",
                isActive || isSupportActive
                  ? "text-orange-400"
                  : "text-neutral-400 hover:text-neutral-200",
                isSupport ? "ring-1 ring-orange-400/10" : ""
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-orange-500/10 rounded-xl"
                  initial={false}
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <Icon className="w-5 h-5 md:w-5 md:h-5 relative z-10" />
              <span className="text-[10px] md:text-sm font-medium relative z-10">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
