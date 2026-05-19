/* eslint-disable @next/next/no-img-element */
"use client";

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
      <div
        className="flex shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-slate-200"
        style={{ width: imageSize, height: imageSize }}
      >
        <img
          src="/logo.svg"
          alt={showText ? "" : "DECODE"}
          width={imageSize}
          height={imageSize}
          className="w-full h-full object-contain"
        />
      </div>
      {showText && (
        <span
          className={cn("font-semibold tracking-normal text-slate-950", textSize)}
        >
          DECODE
        </span>
      )}
    </div>
  );

  if (linkToHome) {
    return (
      <Link
        href="/"
        className="inline-flex min-h-11 items-center rounded-lg transition-opacity hover:opacity-90"
        aria-label="DECODE home"
      >
        {content}
      </Link>
    );
  }

  return content;
}
