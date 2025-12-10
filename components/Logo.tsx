"use client";

import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  className?: string;
  linkToHome?: boolean;
}

const sizeMap = {
  sm: { image: 32, text: "text-lg" },
  md: { image: 40, text: "text-xl" },
  lg: { image: 56, text: "text-2xl" },
  xl: { image: 80, text: "text-3xl" },
};

export function Logo({
  size = "md",
  showText = true,
  className,
  linkToHome = true,
}: LogoProps) {
  const { image: imageSize, text: textSize } = sizeMap[size];

  const content = (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Logo first, then DECODE text */}
      <div
        className="rounded-full overflow-hidden shrink-0 bg-white shadow-sm"
        style={{ width: imageSize, height: imageSize }}
      >
        <Image
          src="/logo.png"
          alt="DECODE Logo"
          width={imageSize}
          height={imageSize}
          className="w-full h-full object-contain"
          priority
        />
      </div>
      {showText && (
        <span
          className={cn("font-bold gradient-text tracking-tight", textSize)}
        >
          DECODE
        </span>
      )}
    </div>
  );

  if (linkToHome) {
    return (
      <Link href="/" className="hover:opacity-90 transition-opacity">
        {content}
      </Link>
    );
  }

  return content;
}
