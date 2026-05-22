"use client";

import dynamic from "next/dynamic";
import { Loading } from "@/components/Loading";

const LandingPageBuilder = dynamic(
  () =>
    import("@/components/landing-pages/LandingPageBuilder").then(
      (module) => module.LandingPageBuilder
    ),
  {
    ssr: false,
    loading: () => (
      <Loading
        label="Loading landing page builder"
        className="min-h-[360px]"
      />
    ),
  }
);

export function LandingPageBuilderIsland() {
  return <LandingPageBuilder />;
}
