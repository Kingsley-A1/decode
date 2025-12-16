"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { QRGenerator } from "@/components/QRGenerator";
import { QRScanner } from "@/components/QRScanner";
import { PageHeader } from "@/components/PageHeader";

type TabKey = "generate" | "scan";

const tabs: { id: TabKey; label: string; description: string; badge?: string }[] = [
  {
    id: "generate",
    label: "Generate",
    description: "Craft beautiful QR codes with custom colors, dots, and logos.",
    badge: "Pro",
  },
  {
    id: "scan",
    label: "Scan",
    description: "Use your camera or images to decode instantly with smart actions.",
    badge: "New",
  },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabKey>("generate");

  return (
    <div className="p-4 space-y-6">
      <PageHeader
        title="Generate or Scan"
        subtitle="Switch between creating high-fidelity QR codes and scanning them with smart actions."
      />

      {/* Tab switcher */}
      <div className="relative overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900/70 p-2 shadow-lg">
        <div className="grid grid-cols-2 gap-2 text-sm font-semibold text-neutral-200">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="relative flex flex-col gap-1 rounded-xl px-3 py-3 text-left transition"
              >
                {isActive && (
                  <motion.span
                    layoutId="tab-pill"
                    className="absolute inset-0 rounded-xl bg-orange-500/15 border border-orange-500/30"
                    transition={{ type: "spring", stiffness: 260, damping: 24 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-2 text-base font-bold">
                  {tab.label}
                  {tab.badge && (
                    <span className="rounded-full bg-orange-500/20 px-2 py-0.5 text-xs font-semibold text-orange-200">
                      {tab.badge}
                    </span>
                  )}
                </span>
                <span className="relative z-10 text-xs text-neutral-400 leading-snug">
                  {tab.description}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active pane */}
      <AnimatePresence mode="wait">
        {activeTab === "generate" ? (
          <motion.div
            key="generate"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.18 }}
            className="bg-neutral-950/60 rounded-2xl border border-neutral-800 shadow-xl"
          >
            <div className="p-2 md:p-4">
              <QRGenerator showHeader={false} />
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="scan"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.18 }}
            className="bg-neutral-950/60 rounded-2xl border border-neutral-800 shadow-xl"
          >
            <div className="p-4 md:p-6">
              <QRScanner />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
