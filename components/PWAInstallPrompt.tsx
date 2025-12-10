"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X } from "lucide-react";
import Image from "next/image";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      // If we detect the app is already installed, set flag (lint suppressed intentionally)
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsInstalled(true);
      return;
    }

    // Check if dismissed recently
    const dismissed = localStorage.getItem("pwa-prompt-dismissed");
    if (dismissed) {
      const dismissedTime = parseInt(dismissed, 10);
      const hoursSinceDismissed =
        (Date.now() - dismissedTime) / (1000 * 60 * 60);
      if (hoursSinceDismissed < 24) {
        return;
      }
    }

    // Check for iOS
    const isIOSDevice =
      /iPad|iPhone|iPod/.test(navigator.userAgent) &&
      !(window as Window & { MSStream?: unknown }).MSStream;
    setIsIOS(isIOSDevice);

    // Show iOS prompt after delay
    if (isIOSDevice) {
      const timer = setTimeout(() => setShowPrompt(true), 3000);
      return () => clearTimeout(timer);
    }

    // Listen for beforeinstallprompt event (Android/Desktop)
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setTimeout(() => setShowPrompt(true), 3000);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    }
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    localStorage.setItem("pwa-prompt-dismissed", Date.now().toString());
    setShowPrompt(false);
  };

  if (isInstalled || !showPrompt) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        className="fixed bottom-24 left-4 right-4 max-w-md mx-auto z-50"
      >
        <div className="bg-neutral-900 dark:bg-neutral-900 light:bg-white border border-neutral-700 rounded-2xl p-4 shadow-2xl">
          <button
            onClick={handleDismiss}
            className="absolute top-3 right-3 p-1 text-neutral-500 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-full overflow-hidden shrink-0 bg-white flex items-center justify-center">
              <Image
                src="/logo.png"
                alt="DECODE"
                width={56}
                height={56}
                className="w-full h-full object-contain"
              />
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-white text-lg">
                Install DECODE
              </h3>
              <p className="text-neutral-400 text-sm mt-1">
                {isIOS
                  ? "Tap the share button, then 'Add to Home Screen'"
                  : "Install our app for a better experience!"}
              </p>
            </div>
          </div>

          {!isIOS && (
            <button
              onClick={handleInstall}
              className="w-full mt-4 py-3 bg-linear-to-r from-violet-600 to-purple-600 rounded-xl font-semibold flex items-center justify-center gap-2 hover:from-violet-500 hover:to-purple-500 transition-all"
            >
              <Download className="w-5 h-5" />
              Install App
            </button>
          )}

          {isIOS && (
            <div className="mt-4 p-3 bg-neutral-800 rounded-xl">
              <div className="flex items-center gap-2 text-sm text-neutral-300">
                <span>1. Tap</span>
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M12 2L12 15M12 2L8 6M12 2L16 6M4 12V20C4 20.5523 4.44772 21 5 21H19C19.5523 21 20 20.5523 20 20V12"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                </svg>
                <span>then &quot;Add to Home Screen&quot;</span>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
