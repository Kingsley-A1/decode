"use client";

import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  showLogo?: boolean;
}

export function PageHeader({
  title,
  subtitle,
  showLogo = true,
}: PageHeaderProps) {
  return (
    <div className="pt-4 pb-4 space-y-3">
      {/* Top row: Logo and Theme Toggle */}
      <div className="flex items-center justify-between">
        {showLogo && <Logo size="sm" showText={true} />}
        {!showLogo && <div />}
        <ThemeToggle />
      </div>
      {/* Title row */}
      <div className="text-center">
        <h1 className="text-2xl md:text-3xl font-bold gradient-text">
          {title}
        </h1>
        {subtitle && (
          <p className="text-neutral-400 text-sm md:text-base mt-1">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
