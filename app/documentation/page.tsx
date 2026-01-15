"use client";

import { motion } from "framer-motion";
import {
  QrCode,
  Lock,
  BookOpen,
  Phone,
  Mail,
  Copy,
  CheckCircle2,
} from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";

const features = [
  {
    icon: QrCode,
    title: "QR Generator",
    description:
      "Create stylish QR codes with customizable colors, shapes, and optional logos, then download or share them.",
  },
  {
    icon: Lock,
    title: "Cipher Tools",
    description:
      "Encrypt and decrypt messages with a collection of classic ciphers, including Caesar, Vigenère, and more.",
  },
  {
    icon: BookOpen,
    title: "PWA & Utilities",
    description:
      "Installable app experience, theme toggles, and supportive utilities like QR download and share features.",
  },
];

// Motion variants removed because this page uses simple inline motion for basic transitions

export default function DocumentationPage() {
  const [copied, setCopied] = useState(false);
  return (
    <div className="p-4 space-y-6">
      <PageHeader
        title="Documentation"
        subtitle="How to use DECODE — quick, clear, and friendly"
      />

      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <div id="support" className="glass rounded-2xl p-4 md:p-6 space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-14 h-14 rounded-full bg-white shadow-lg flex items-center justify-center shrink-0">
              <BookOpen className="w-6 h-6 text-orange-500" />
            </div>

            <div>
              <h2 className="text-lg md:text-xl font-semibold text-white">
                Using DECODE
              </h2>
              <p className="text-neutral-400 text-sm mt-1 max-w-prose">
                DECODE is a simple, focused toolbox for generating stylish QR
                codes and performing classical ciphers. It was built by Kingsley
                Maduabuchi out of love and passion for clear, accessible tools
                that make cryptography and QR generation approachable.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div className="glass rounded-xl p-4 space-y-2" key={f.title}>
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-lg bg-linear-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white">
                        {f.title}
                      </h3>
                      <p className="text-xs text-neutral-400">
                        {f.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="glass rounded-2xl p-4 md:p-6 space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-14 h-14 rounded-full bg-white shadow-lg flex items-center justify-center shrink-0">
              <Phone className="w-6 h-6 text-orange-500" />
            </div>

            <div className="flex-1">
              <h3 className="text-lg md:text-xl font-semibold text-white">
                Appreciate Our Work
              </h3>
              <p className="text-neutral-400 text-sm mt-1 max-w-prose">
                If you love DECODE and want to support our efforts, you can send
                a small donation — every bit helps and is appreciated.
              </p>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="col-span-1 md:col-span-3 glass rounded-xl p-3 flex flex-col md:flex-row items-center gap-3 border border-transparent">
                  <div className="flex-1">
                    <div className="text-xs text-neutral-400">Provider</div>
                    <div className="text-sm font-semibold text-white">Opay</div>
                    <div className="mt-2 text-xs text-neutral-400">
                      Account Name
                    </div>
                    <div className="text-sm font-semibold text-white">
                      Kingsley Maduabuchi
                    </div>
                  </div>
                  <div className="flex-1 md:flex-none w-full md:w-auto">
                    <div className="text-xs text-neutral-400">Account</div>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="font-mono text-sm text-white select-all">
                        8088071657
                      </span>
                      <button
                        title="Copy account number"
                        aria-label="Copy account number"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText("8088071657");
                            setCopied(true);
                            setTimeout(() => setCopied(false), 2000);
                          } catch {
                            // Fallback for older browsers
                            const el = document.createElement("textarea");
                            el.value = "8088071657";
                            document.body.appendChild(el);
                            el.select();
                            document.execCommand("copy");
                            document.body.removeChild(el);
                            setCopied(true);
                            setTimeout(() => setCopied(false), 2000);
                          }
                        }}
                        className="ml-1 p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 transition-colors flex items-center gap-2 text-white"
                      >
                        {copied ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-green-400" />
                            <span className="text-xs">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            <span className="text-xs">Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="glass rounded-2xl p-4 md:p-6 space-y-3">
          <h3 className="text-lg font-semibold text-white">Quick Use Cases</h3>
          <div className="text-neutral-400 text-sm space-y-2">
            <ul className="list-disc pl-5">
              <li>
                Use the QR Generator for marketing materials, event tickets, and
                digital menus.
              </li>
              <li>
                Encrypt short messages with the Cipher tools for learning or
                simple obfuscation.
              </li>
              <li>
                Share QR codes quickly by downloading or copying links to social
                profiles.
              </li>
            </ul>
          </div>
        </div>

        <div className="glass rounded-2xl p-4 md:p-6 space-y-3">
          <h3 className="text-lg font-semibold text-white">
            How to Use — Step-by-Step
          </h3>

          <div className="space-y-3 text-neutral-400 text-sm">
            <div className="flex items-start gap-3">
              <div className="mt-1 w-7 h-7 rounded-full bg-orange-500 text-white flex items-center justify-center shrink-0">
                1
              </div>
              <div>
                <p className="font-semibold text-white">Create a QR</p>
                <p className="text-xs">
                  Open QR Generator, enter the URL or text, pick a style,
                  optionally upload a logo, then generate and download.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-1 w-7 h-7 rounded-full bg-orange-500 text-white flex items-center justify-center shrink-0">
                2
              </div>
              <div>
                <p className="font-semibold text-white">
                  Encrypt/Decrypt with Ciphers
                </p>
                <p className="text-xs">
                  Choose a cipher, enter text, switch between encrypt and
                  decrypt, set a key (if required), and copy the result.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-1 w-7 h-7 rounded-full bg-orange-500 text-white flex items-center justify-center shrink-0">
                3
              </div>
              <div>
                <p className="font-semibold text-white">Save & Share</p>
                <p className="text-xs">
                  Use the download button on QR results or copy the output of
                  cipher tools for quick sharing.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-1 w-7 h-7 rounded-full bg-orange-500 text-white flex items-center justify-center shrink-0">
                4
              </div>
              <div>
                <p className="font-semibold text-white">PWA & Theme</p>
                <p className="text-xs">
                  Install DECODE for offline usage; toggle light/dark theme with
                  the theme toggle on the header.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="glass rounded-2xl p-4 md:p-6 space-y-3">
          <h3 className="text-lg font-semibold text-white">Examples</h3>
          <div className="text-neutral-400 text-sm space-y-3">
            <div>
              <strong className="text-white">QR Example</strong>
              <p className="text-xs mt-1">
                Enter: https://example.com/event - choose colors - dot style -
                add an organization logo - Generate → Download
              </p>
            </div>
            <div>
              <strong className="text-white">Cipher Example</strong>
              <p className="text-xs mt-1">
                Caesar: Message: Hello → Key: 3 → Encrypt → Lipps
              </p>
            </div>
          </div>
        </div>

        <div className="glass rounded-2xl p-4 md:p-6 space-y-3">
          <h3 className="text-lg font-semibold text-white">FAQ & Tips</h3>
          <div className="text-neutral-400 text-sm space-y-2">
            <div>
              <strong className="text-white">Image logo quality</strong>
              <p className="text-xs">
                Use square or high-contrast logos for clear QR embedding. PNG or
                SVG are recommended.
              </p>
            </div>
            <div>
              <strong className="text-white">Security</strong>
              <p className="text-xs">
                The cipher tools are educational and not intended for production
                cryptographic security — do not use for sensitive secrets.
              </p>
            </div>
            <div>
              <strong className="text-white">Support</strong>
              <p className="text-xs">
                Use the Contact page or the links below to reach out; we’ll aim
                to respond within 24 hours.
              </p>
            </div>
          </div>
        </div>

        <div className="glass rounded-2xl p-4 md:p-6 space-y-3">
          <h3 className="text-lg font-semibold text-white">Contact</h3>
          <p className="text-neutral-400 text-sm">
            Got feedback, ideas, or a bug report? Reach us via one of the links
            below.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
            <a
              href="tel:+2349036826272"
              className="glass rounded-xl p-3 flex items-center gap-3 border border-transparent hover:border-blue-600 transition-all"
            >
              <Phone className="w-5 h-5 text-white" />
              <div className="text-xs text-white">Call</div>
            </a>
            <a
              href="mailto:decoder.ng@gmail.com"
              className="glass rounded-xl p-3 flex items-center gap-3 border border-transparent hover:border-orange-500 transition-all"
            >
              <Mail className="w-5 h-5 text-white" />
              <div className="text-xs text-white">Email</div>
            </a>
            <a
              href="https://twitter.com/decode"
              target="_blank"
              rel="noreferrer"
              className="glass rounded-xl p-3 flex items-center gap-3 border border-transparent hover:border-neutral-400 transition-all"
            >
              <svg
                className="w-5 h-5 text-white"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden
              >
                <path d="M23 3a10.9 10.9 0 01-3.14 1.53A4.48 4.48 0 0016 2a4.5 4.5 0 00-4.47 5.53 12.8 12.8 0 01-9.3-4.7s-4 8 4 11c-2 1-4 2-6 2a12.3 12.3 0 006.3 1.84 9.9 9.9 0 01-6.2 1.7c7 4.5 15 0 15-8l1-1A7 7 0 0023 3z" />
              </svg>
              <div className="text-xs text-white">Twitter</div>
            </a>
            <a
              href="https://linkedin.com/kingtechfoundation/decode"
              target="_blank"
              rel="noreferrer"
              className="glass rounded-xl p-3 flex items-center gap-3 border border-transparent hover:border-blue-700 transition-all"
            >
              <svg
                className="w-5 h-5 text-white"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden
              >
                <path d="M4.98 3.5a2.5 2.5 0 11.02 0zM3 8h4v12H3zM8.5 8h3.8v1.7h.05c.53-.96 1.8-1.9 3.7-1.9 3.95 0 4.7 2.6 4.7 6v7.2H19v-6.4c0-1.5 0-3.4-2.1-3.4-2.1 0-2.4 1.6-2.4 3.3v6.5H11V8z" />
              </svg>
              <div className="text-xs text-white">LinkedIn</div>
            </a>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
