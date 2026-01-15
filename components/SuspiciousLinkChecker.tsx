"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  ExternalLink,
  Info,
  Link as LinkIcon,
  ShieldCheck,
  ShieldX,
  Wand2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const riskyTlds = ["zip", "mov", "country", "gq", "tk", "ml", "cf", "ga", "top"];
const suspiciousCharPattern = /[@<>"'\\]|%0d|%0a|\s{2,}/i;
const suspiciousKeywords = ["login", "verify", "secure", "update", "confirm", "payment", "invoice", "gift"];
const brandLookalikes = [
  { brand: "paypal", patterns: ["paypa1", "paipal", "pypl", "paypal-secure", "secure-paypal"] },
  { brand: "apple", patterns: ["app1e", "appleid-verify", "support-appleid", "apple-secure"] },
  { brand: "microsoft", patterns: ["micros0ft", "office365-secure", "login-live", "m1crosoft"] },
  { brand: "google", patterns: ["g00gle", "goog1e", "accounts-google", "secure-gmail"] },
  { brand: "amazon", patterns: ["amaz0n", "arnazon", "amazon-verify", "amazon-login"] },
];

function isIp(host: string) {
  return /^(\d{1,3}\.){3}\d{1,3}$/.test(host) || /^\[[0-9a-fA-F:]+\]$/.test(host);
}

function hasPunycode(host: string) {
  return host.includes("xn--");
}

function getTld(host: string) {
  const parts = host.split(".");
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : "";
}

function isPrivateRange(host: string) {
  if (!/^\d/.test(host)) return false;
  const octets = host.split(".").map(Number);
  if (octets.length !== 4 || octets.some((o) => Number.isNaN(o))) return false;
  if (octets[0] === 10) return true;
  if (octets[0] === 192 && octets[1] === 168) return true;
  if (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) return true;
  if (octets[0] === 127) return true;
  return false;
}

function looksLikeBrandSpoof(host: string) {
  const lower = host.toLowerCase();
  return brandLookalikes.some((entry) =>
    entry.patterns.some((pattern) => lower.includes(pattern)) || lower.includes(`${entry.brand}-secure`)
  );
}

function hasSuspiciousKeywords(pathAndQuery: string) {
  const lower = pathAndQuery.toLowerCase();
  return suspiciousKeywords.some((word) => lower.includes(word));
}

function analyzeUrl(input: string) {
  const reasons: string[] = [];
  let parsed: URL | null = null;

  try {
    parsed = new URL(input);
  } catch {
    reasons.push("URL is not valid");
    return { verdict: "suspicious" as const, reasons, host: "", normalized: "" };
  }

  const { protocol, host, pathname, search } = parsed;
  const normalized = parsed.toString();

  if (!protocol.startsWith("http")) {
    reasons.push("Non-HTTP(S) scheme (data/js/mailto/etc.)");
  }
  if (isIp(host)) reasons.push("URL uses a raw IP address");
  if (isPrivateRange(host)) reasons.push("Private-network IP address is unusual for public links");
  if (hasPunycode(host)) reasons.push("Punycode domain detected (possible homograph)");
  if (pathname.length + search.length > 200) reasons.push("Unusually long path or query");
  if ((pathname.match(/\//g) || []).length > 6) reasons.push("Excessive path depth");
  if (suspiciousCharPattern.test(pathname + search)) reasons.push("Suspicious characters in path/query");
  const tld = getTld(host);
  if (riskyTlds.includes(tld)) reasons.push(`High-risk TLD: .${tld}`);
  if (host.split(".").length > 4) reasons.push("Too many subdomains");
  if (hasSuspiciousKeywords(pathname + search)) reasons.push("Contains high-risk keywords (login, verify, payment)");
  if (looksLikeBrandSpoof(host)) reasons.push("Looks like a spoofed brand domain");
  if (parsed.port && parsed.port !== "80" && parsed.port !== "443") reasons.push(`Non-standard port: ${parsed.port}`);

  const baseConfidence = 40;
  const confidence = Math.min(95, baseConfidence + reasons.length * 12 + (looksLikeBrandSpoof(host) ? 8 : 0));
  const verdict = reasons.length === 0 ? ("safe" as const) : ("suspicious" as const);

  return { verdict, reasons, host, normalized, confidence };
}

export function SuspiciousLinkChecker() {
  const [input, setInput] = useState("");
  const [checked, setChecked] = useState(false);
  const result = useMemo(() => analyzeUrl(input.trim()), [input]);

  const handleCheck = () => {
    setChecked(true);
  };

  const handleCopy = async () => {
    if (!result.normalized) return;
    await navigator.clipboard.writeText(result.normalized);
  };

  const handleOpen = () => {
    if (!result.normalized) return;
    if (result.verdict === "suspicious") {
      const ok = window.confirm(
        "This link looks suspicious based on local checks. Open anyway?"
      );
      if (!ok) return;
    }
    window.open(result.normalized, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-lg font-semibold text-white">Suspicious Link Detector</p>
          <p className="text-sm text-neutral-400">
            Paste a link to get a quick safety verdict and the heuristics behind it.
          </p>
        </div>
        <Wand2 className="w-5 h-5 text-orange-300" />
      </div>

      <div className="space-y-3 rounded-2xl border border-neutral-800 bg-neutral-900/70 p-4 shadow-lg">
        <div className="relative">
          <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="https://example.com/login"
            className="w-full rounded-xl bg-neutral-950 border border-neutral-800 py-3 pl-10 pr-3 text-white placeholder:text-neutral-500 focus:border-orange-500 focus:outline-none"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleCheck}
            className="inline-flex items-center gap-2 rounded-xl bg-orange-500/20 px-4 py-2 text-sm font-semibold text-orange-100 border border-orange-500/40 hover:bg-orange-500/30 transition"
          >
            <ShieldCheck className="w-4 h-4" />
            Check link
          </button>
          <button
            onClick={() => setInput("")}
            className="inline-flex items-center gap-2 rounded-xl border border-neutral-800 px-4 py-2 text-sm text-neutral-200 hover:border-red-500/40 hover:text-white transition"
          >
            <X className="w-4 h-4" />
            Clear
          </button>
          <button
            onClick={handleCopy}
            disabled={!result.normalized}
            className={cn(
              "inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm transition",
              result.normalized
                ? "border-neutral-700 bg-neutral-900 text-neutral-100 hover:border-orange-400"
                : "border-neutral-800 bg-neutral-900/60 text-neutral-500 cursor-not-allowed"
            )}
          >
            <Copy className="w-4 h-4" />
            Copy URL
          </button>
          <button
            onClick={handleOpen}
            disabled={!result.normalized}
            className={cn(
              "inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm transition",
              result.normalized
                ? "border-blue-500/40 bg-blue-500/10 text-blue-100 hover:border-blue-400"
                : "border-neutral-800 bg-neutral-900/60 text-neutral-500 cursor-not-allowed"
            )}
          >
            <ExternalLink className="w-4 h-4" />
            Open (confirm)
          </button>
        </div>
      </div>

      <AnimatePresence>
        {checked && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="rounded-2xl border border-neutral-800 bg-neutral-900/80 p-4 shadow-lg"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold"
                  style={{
                    color: result.verdict === "safe" ? "#4ade80" : "#f97316",
                    backgroundColor:
                      result.verdict === "safe" ? "rgba(74,222,128,0.12)" : "rgba(249,115,22,0.15)",
                    border: `1px solid ${result.verdict === "safe" ? "rgba(74,222,128,0.35)" : "rgba(249,115,22,0.35)"}`,
                  }}
                >
                  {result.verdict === "safe" ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <ShieldX className="w-4 h-4" />
                  )}
                  {result.verdict === "safe" ? "Looks safe (local checks)" : "Looks suspicious"}
                </div>
                <p className="text-sm text-neutral-300">
                  Confidence: {result.confidence ?? (result.reasons.length ? 70 : 40)}%
                </p>
                <p className="text-xs text-neutral-500 break-all">{result.normalized || input}</p>
              </div>
              <Info className="w-4 h-4 text-neutral-500" />
            </div>

            <div className="mt-4 space-y-2">
              {result.reasons.length === 0 ? (
                <p className="text-sm text-neutral-400">
                  No obvious red flags found in local heuristics. Use caution and consider running an
                  online reputation check if unsure.
                </p>
              ) : (
                <ul className="space-y-1 text-sm text-neutral-200">
                  {result.reasons.map((r) => (
                    <li key={r} className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-orange-400 mt-0.5" />
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
