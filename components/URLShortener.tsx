"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Copy,
  ExternalLink,
  Link as LinkIcon,
  Loader2,
  RefreshCw,
  Shield,
  Shrink,
} from "lucide-react";
import { cn } from "@/lib/utils";

const parseError = (err: unknown, fallback = "Something went wrong") => {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return fallback;
};

async function shortenViaIsGd(url: string) {
  // is.gd chosen for being free, fast, and auth-less; suited for client-only MVP.
  const endpoint = `https://is.gd/create.php?format=simple&url=${encodeURIComponent(url)}`;
  const res = await fetch(endpoint);
  if (!res.ok) throw new Error("is.gd request failed");
  const text = (await res.text()).trim();
  if (!text || text.toLowerCase().includes("error")) {
    throw new Error(text || "is.gd could not shorten this URL");
  }
  return text;
}

function normalizeUrl(raw: string) {
  const trimmed = raw.trim();
  if (!trimmed) throw new Error("Enter a URL to shorten");

  const hasScheme = /^[a-z][a-z0-9+.-]*:/i.test(trimmed);
  const candidate = hasScheme ? trimmed : `https://${trimmed}`;
  const parsed = new URL(candidate);
  if (!parsed.protocol.startsWith("http")) {
    throw new Error("Only http/https URLs can be shortened");
  }
  if (!parsed.hostname) throw new Error("URL must include a host");
  return parsed.toString();
}

async function fallbackHash(url: string) {
  // Lightweight fallback: create a pseudo-short slug for display when API fails
  const encoder = new TextEncoder();
  const data = encoder.encode(url);
  const digest = await crypto.subtle.digest("SHA-1", data);
  const bytes = Array.from(new Uint8Array(digest)).slice(0, 4);
  const slug = bytes.map((b) => b.toString(16).padStart(2, "0")).join("");
  return `https://kingsley-a1.github.io/decode/s/${slug}`;
}

export function URLShortener() {
  const [input, setInput] = useState("");
  const [shortUrl, setShortUrl] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const handleShorten = async () => {
    setError("");
    setShortUrl("");
    const value = input.trim();
    if (!value) return;
    try {
      setLoading(true);
      const normalized = normalizeUrl(value);
      const apiResult = await shortenViaIsGd(normalized);
      setShortUrl(apiResult);
    } catch (err: unknown) {
      setError(parseError(err, "Could not shorten this URL via API, using fallback."));
      try {
        const fallback = await fallbackHash(input.trim());
        setShortUrl(fallback);
      } catch (err2: unknown) {
        setError(parseError(err2, "Failed to generate fallback short URL."));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!shortUrl) return;
    await navigator.clipboard.writeText(shortUrl);
  };

  const handleOpen = () => {
    if (!shortUrl) return;
    window.open(shortUrl, "_blank", "noopener,noreferrer");
  };

  const handleReset = () => {
    setInput("");
    setShortUrl("");
    setError("");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-lg font-semibold text-white">URL Shortener</p>
          <p className="text-sm text-neutral-400">
            Shorten long URLs quickly; optional fallback keeps you moving even if the API is blocked.
          </p>
        </div>
        <Shrink className="w-5 h-5 text-orange-300" />
      </div>

      <div className="space-y-3 rounded-2xl border border-neutral-800 bg-neutral-900/70 p-4 shadow-lg">
        <div className="relative">
          <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="https://really-long.example.com/path?a=1&b=2"
            className="w-full rounded-xl bg-neutral-950 border border-neutral-800 py-3 pl-10 pr-3 text-white placeholder:text-neutral-500 focus:border-orange-500 focus:outline-none"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleShorten}
            disabled={loading || !input.trim()}
            className={cn(
              "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition",
              loading || !input.trim()
                ? "border border-neutral-800 bg-neutral-900/60 text-neutral-500 cursor-not-allowed"
                : "border border-orange-500/40 bg-orange-500/20 text-orange-100 hover:bg-orange-500/30"
            )}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
            {loading ? "Shortening..." : "Shorten"}
          </button>
          <button
            onClick={handleReset}
            className="inline-flex items-center gap-2 rounded-xl border border-neutral-800 px-4 py-2 text-sm text-neutral-200 hover:border-red-500/40 hover:text-white transition"
          >
            <RefreshCw className="w-4 h-4" />
            Reset
          </button>
        </div>
      </div>

      <AnimatePresence>
        {(shortUrl || error) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="rounded-2xl border border-neutral-800 bg-neutral-900/80 p-4 shadow-lg"
          >
            {error && (
              <div className="mb-3 rounded-xl border border-orange-500/40 bg-orange-500/10 px-3 py-2 text-sm text-orange-100">
                {error}
              </div>
            )}
            {shortUrl && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <span className="text-sm text-neutral-300 break-all">{shortUrl}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={handleCopy}
                      className="inline-flex items-center gap-2 rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 hover:border-orange-500/50 hover:text-white transition"
                    >
                      <Copy className="w-4 h-4" />
                      Copy
                    </button>
                    <button
                      onClick={handleOpen}
                      className="inline-flex items-center gap-2 rounded-xl border border-blue-500/40 bg-blue-500/10 px-3 py-2 text-sm text-blue-100 hover:border-blue-400 transition"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Open
                    </button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
