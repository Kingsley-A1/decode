"use client";

import { Logo } from "./Logo";

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
    <div className="space-y-3 py-2">
      {showLogo && <Logo size="sm" showText={true} />}
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold leading-tight text-slate-950 md:text-3xl">
          {title}
        </h1>
        {subtitle && (
          <p className="max-w-2xl text-sm leading-6 text-slate-600 md:text-base">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
