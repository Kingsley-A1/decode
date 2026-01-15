"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { PageHeader } from "@/components/PageHeader";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function AboutPage() {
  // THE FIX: Manually define base path for GitHub Pages
  // This ensures the hero logo loads from /decode/logo.png
  const basePath = process.env.NODE_ENV === "production" ? "/decode" : "";

  return (
    <div className="p-4 space-y-8">
      {/* Header with Logo and Theme Toggle */}
      <PageHeader title="About DECODE v2" subtitle="How we rebuilt DECODE for reliability, safety, and speed" />

      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <div className="w-24 h-24 md:w-32 md:h-32 mx-auto rounded-full bg-white flex items-center justify-center overflow-hidden shadow-xl">
          <Image
            src={`${basePath}/logo.png`}
            alt="DECODE Logo"
            width={128}
            height={128}
            className="w-full h-full object-contain"
            priority
          />
        </div>
        <h1 className="text-3xl font-bold gradient-text">DECODE v2</h1>
        <p className="text-neutral-400 text-sm max-w-xs md:max-w-md mx-auto">
          Privacy-first QR creation, scanning, and link safety—rebuilt for smoother installs, safer opens, and lightning-fast sharing.
        </p>
      </motion.div>

      {/* Who We Are */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass rounded-2xl p-5 md:p-6 space-y-3"
      >
        <h2 className="text-lg md:text-xl font-semibold text-white flex items-center gap-2">
          <span className="w-1.5 h-5 bg-orange-500 rounded-full" />
          Why we built v2
        </h2>
        <p className="text-neutral-400 text-sm md:text-base leading-relaxed">
          We set out to make QR workflows safer and faster without sacrificing usability. DECODE v2 focuses on:
          <span className="text-white font-medium"> clearer navigation</span>,
          <span className="text-white font-medium"> resilient offline behaviors</span>, and
          <span className="text-white font-medium"> transparent safety cues</span> so users can trust every open or share action.
        </p>
      </motion.div>

      {/* What's new in v2 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-3"
      >
        <h2 className="text-lg md:text-xl font-semibold text-white flex items-center gap-2">
          <span className="w-1.5 h-5 bg-amber-500 rounded-full" />
          What changed in DECODE v2
        </h2>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 gap-3"
        >
          {[
            {
              title: "Split home experience",
              description: "Generate, Scan, Check links, and Shorten URLs live in one surface with animated tabs for clarity.",
              color: "from-orange-500 to-amber-500",
            },
            {
              title: "Safer opens",
              description: "Local suspicious-link heuristics (punycode, risky TLDs, private IPs, brand lookalikes) with confirm-before-open.",
              color: "from-emerald-500 to-teal-500",
            },
            {
              title: "Instant QR + short links",
              description: "Fast QR crafting paired with an auth-less is.gd shortener and a hashed fallback when APIs fail.",
              color: "from-sky-500 to-blue-500",
            },
            {
              title: "PWA-first polish",
              description: "Updated manifest ID, metadata base, and offline-friendly behaviors to keep installs conflict-free.",
              color: "from-violet-500 to-fuchsia-500",
            },
          ].map((item) => (
            <motion.div
              key={item.title}
              variants={itemVariants}
              className="glass rounded-xl p-4 space-y-2 hover:border-orange-500/50 transition-colors"
            >
              <div className={`w-10 h-10 rounded-lg bg-linear-to-br ${item.color} flex items-center justify-center text-white text-sm font-semibold`}>
                v2
              </div>
              <h3 className="text-sm font-medium text-white">{item.title}</h3>
              <p className="text-xs text-neutral-500">{item.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      {/* Principles */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass rounded-2xl p-5 space-y-3"
      >
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <span className="w-1.5 h-5 bg-orange-400 rounded-full" />
          Principles guiding v2
        </h2>
        <p className="text-neutral-400 text-sm leading-relaxed">
          We prioritize clear intent, predictable safety cues, and low-friction sharing. Every feature in v2 is measured against three pillars:
        </p>
        <ul className="list-disc list-inside text-neutral-300 text-sm space-y-1">
          <li>Speed: immediate feedback, offline-friendly fallbacks, and minimal blocking states.</li>
          <li>Safety: local heuristics first, explicit confirmation before risky opens, and privacy-respecting defaults.</li>
          <li>Delight: subtle motion, seasonal touches, and thoughtful empty states so the app feels alive.</li>
        </ul>
      </motion.div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Link
          href="/contact"
          className="w-full py-4 bg-linear-to-r from-orange-500 to-amber-500 rounded-xl font-semibold flex items-center justify-center gap-2 hover:from-orange-400 hover:to-amber-400 transition-all text-white shadow-lg shadow-orange-500/25"
        >
          Hire Us
          <ArrowRight className="w-5 h-5" />
        </Link>
      </motion.div>
    </div>
  );
}