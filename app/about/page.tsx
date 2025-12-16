"use client";

import { motion } from "framer-motion";
import {
  Code2,
  Palette,
  Zap,
  Globe,
  Shield,
  Smartphone,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { PageHeader } from "@/components/PageHeader";

const skills = [
  {
    icon: Code2,
    title: "Full-Stack Development",
    description: "NestJS, Next.js, React, Node.js, TypeScript",
    color: "from-violet-500 to-purple-500",
  },
  {
    icon: Palette,
    title: "UI/UX Design",
    description: "Modern, responsive, and accessible interfaces",
    color: "from-pink-500 to-rose-500",
  },
  {
    icon: Zap,
    title: "Performance",
    description: "Optimized, fast-loading applications",
    color: "from-yellow-500 to-orange-500",
  },
  {
    icon: Globe,
    title: "Web Applications",
    description: "PWAs, SPAs, and enterprise solutions",
    color: "from-cyan-500 to-blue-500",
  },
  {
    icon: Shield,
    title: "Security",
    description: "Secure coding practices and encryption",
    color: "from-green-500 to-emerald-500",
  },
  {
    icon: Smartphone,
    title: "Mobile-First",
    description: "Responsive design for all devices",
    color: "from-indigo-500 to-violet-500",
  },
];

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
      <PageHeader title="About Us" subtitle="Meet the DECODE team" />

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
        <h1 className="text-3xl font-bold gradient-text">DECODE</h1>
        <p className="text-neutral-400 text-sm max-w-xs md:max-w-md mx-auto">
          Professional Web Development Studio crafting industry-standard digital
          solutions
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
          Who We Are
        </h2>
        <p className="text-neutral-400 text-sm md:text-base leading-relaxed">
          We are a team of passionate{" "}
          <span className="text-white font-medium">
            Professional Web Developers
          </span>{" "}
          dedicated to building innovative digital solutions. Our expertise
          spans across modern web technologies, enabling us to deliver scalable,
          secure, and user-centric applications for individuals and corporations
          alike. Our work is driven by a commitment to quality, creativity, and
          client satisfaction. We deliver on the promise of excellence in every
          project we undertake.
        </p>
      </motion.div>

      {/* Our Craft */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-3"
      >
        <h2 className="text-lg md:text-xl font-semibold text-white flex items-center gap-2">
          <span className="w-1.5 h-5 bg-amber-500 rounded-full" />
          Our Craft
        </h2>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 gap-3"
        >
          {skills.map((skill) => {
            const Icon = skill.icon;
            return (
              <motion.div
                key={skill.title}
                variants={itemVariants}
                className="glass rounded-xl p-4 space-y-2 hover:border-orange-500/50 transition-colors"
              >
                <div
                  className={`w-10 h-10 rounded-lg bg-linear-to-br ${skill.color} flex items-center justify-center`}
                >
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-sm font-medium text-white">
                  {skill.title}
                </h3>
                <p className="text-xs text-neutral-500">{skill.description}</p>
              </motion.div>
            );
          })}
        </motion.div>
      </motion.div>

      {/* Mission Statement */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass rounded-2xl p-5 space-y-3"
      >
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <span className="w-1.5 h-5 bg-orange-400 rounded-full" />
          Our Mission
        </h2>
        <p className="text-neutral-400 text-sm leading-relaxed">
          To democratize technology by creating{" "}
          <span className="text-white font-medium">
            powerful, accessible tools
          </span>{" "}
          that empower users. DECODE represents one of our commitments to
          building solutions that are not just functional, but delightful to
          use.
        </p>
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