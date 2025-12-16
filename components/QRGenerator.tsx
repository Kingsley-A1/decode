"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQRCode, QROptions } from "@/hooks/useQRCode";
import {
  Download,
  Image as ImageIcon,
  Palette,
  Sparkles,
  X,
  Check,
  Link as LinkIcon,
  Copy,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PageHeader } from "./PageHeader";

const dotStyles: { id: QROptions["dotsType"]; name: string }[] = [
  { id: "rounded", name: "Rounded" },
  { id: "dots", name: "Dots" },
  { id: "classy", name: "Classy" },
  { id: "classy-rounded", name: "Classy Rounded" },
  { id: "square", name: "Square" },
  { id: "extra-rounded", name: "Extra Rounded" },
];

const colorPresets = [
  { name: "White", value: "#ffffff" },
  { name: "Violet", value: "#8b5cf6" },
  { name: "Cyan", value: "#06b6d4" },
  { name: "Pink", value: "#ec4899" },
  { name: "Green", value: "#22c55e" },
  { name: "Orange", value: "#f97316" },
  { name: "Yellow", value: "#eab308" },
  { name: "Red", value: "#ef4444" },
];

type QRGeneratorProps = {
  showHeader?: boolean;
};

export function QRGenerator({ showHeader = true }: QRGeneratorProps) {
  const [url, setUrl] = useState("https://kingsley-a1.github.io/decode/");
  const [color, setColor] = useState("#ffffff");
  const [dotStyle, setDotStyle] = useState<QROptions["dotsType"]>("rounded");
  const [logoUrl, setLogoUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    ref: qrRef,
    download,
    isReady,
  } = useQRCode({
    data: url || "https://kingsley-a1.github.io/decode/",
    dotsColor: color,
    backgroundColor: "#0a0a0a",
    dotsType: dotStyle,
    logoUrl: logoUrl,
    width: 260,
    height: 260,
  });

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setLogoUrl("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const copyUrl = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-4 space-y-6">
      {showHeader && (
        <PageHeader
          title="QR Generator"
          subtitle="Create beautiful, customized QR codes of anything from links to text, phone numbers and all!"
        />
      )}

      {/* Desktop Layout: Two Columns */}
      <div className="md:grid md:grid-cols-2 md:gap-8 space-y-6 md:space-y-0">
        {/* Left Column: QR Preview */}
        <div className="space-y-6">
          {/* URL Input */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="relative"
          >
            <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enter URL or text..."
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl py-3.5 px-10 text-white placeholder:text-neutral-500 focus:outline-none focus:border-orange-500 transition-colors"
            />
            <button
              onClick={copyUrl}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white transition-colors"
            >
              {copied ? (
                <Check className="w-5 h-5 text-green-400" />
              ) : (
                <Copy className="w-5 h-5" />
              )}
            </button>
          </motion.div>

          {/* QR Code Preview */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="flex justify-center"
          >
            <div
              className={cn(
                "relative p-6 rounded-2xl glass pulse-glow shadow-xl",
                !isReady && "animate-pulse"
              )}
            >
              <div ref={qrRef} className="rounded-lg overflow-hidden" />
              {logoUrl && (
                <button
                  onClick={removeLogo}
                  className="absolute top-2 right-2 p-1 bg-red-500/80 rounded-full hover:bg-red-500 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </motion.div>

          {/* Download Button - Mobile position */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            onClick={() => download("png")}
            disabled={!isReady}
            className="md:hidden w-full py-4 bg-linear-to-r from-orange-500 to-amber-500 rounded-xl font-semibold flex items-center justify-center gap-2 hover:from-orange-400 hover:to-amber-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-lg shadow-orange-500/25"
          >
            <Download className="w-5 h-5" />
            Download QR Code
          </motion.button>
        </div>

        {/* Right Column: Customization Options */}
        <div className="space-y-6">
          {/* Customization Options */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-5"
          >
            {/* Color Selection */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-neutral-300 flex items-center gap-2">
                  <Palette className="w-4 h-4" />
                  QR Color
                </label>
                <button
                  onClick={() => setShowColorPicker(!showColorPicker)}
                  className="text-xs text-orange-400 hover:text-orange-300 font-medium"
                >
                  {showColorPicker ? "Close" : "Custom"}
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {colorPresets.map((preset) => (
                  <button
                    key={preset.value}
                    onClick={() => setColor(preset.value)}
                    className={cn(
                      "w-9 h-9 rounded-full border-2 transition-all shadow-lg",
                      color === preset.value
                        ? "border-white scale-110 ring-2 ring-white/30"
                        : "border-transparent hover:scale-105"
                    )}
                    style={{ backgroundColor: preset.value }}
                    title={preset.name}
                  />
                ))}
              </div>
              <AnimatePresence>
                {showColorPicker && (
                  <motion.input
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-full h-12 rounded-lg cursor-pointer"
                  />
                )}
              </AnimatePresence>
            </div>

            {/* Dot Style */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-neutral-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Dot Style
              </label>
              <div className="grid grid-cols-3 gap-2">
                {dotStyles.map((style) => (
                  <button
                    key={style.id}
                    onClick={() => setDotStyle(style.id)}
                    className={cn(
                      "px-3 py-2.5 text-xs rounded-xl border transition-all font-medium",
                      dotStyle === style.id
                        ? "bg-orange-500/20 border-orange-500 text-orange-300"
                        : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-700"
                    )}
                  >
                    {style.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Logo Upload */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-neutral-300 flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                Logo (Optional)
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="w-full text-sm text-neutral-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-medium file:bg-orange-500/20 file:text-orange-300 hover:file:bg-orange-500/30 cursor-pointer"
              />
            </div>
          </motion.div>

          {/* Download Button - Desktop position */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            onClick={() => download("png")}
            disabled={!isReady}
            className="hidden md:flex w-full py-4 bg-linear-to-r from-orange-500 to-amber-500 rounded-xl font-semibold items-center justify-center gap-2 hover:from-orange-400 hover:to-amber-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-lg shadow-orange-500/25"
          >
            <Download className="w-5 h-5" />
            Download QR Code
          </motion.button>
        </div>
      </div>
    </div>
  );
}
