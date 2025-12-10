"use client";

import { useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { encrypt, CipherType } from "@/lib/crypto";

interface DemoCardProps {
  open: boolean;
  onClose: () => void;
  cipher: CipherType;
  shift: number;
}

export default function EncodeDecodeDemoCard({
  open,
  onClose,
  cipher,
  shift,
}: DemoCardProps) {
  const demoText =
    "DECODE helps you create stylish QR codes and learn classic ciphers with ease."; // 12+ words

  const encoded = useMemo(() => {
    try {
      return encrypt(demoText, cipher, shift);
    } catch {
      return "(error encoding)";
    }
  }, [demoText, cipher, shift]);

  const needsShift = cipher === "caesar" || cipher === "rot13";

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!open) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 20, opacity: 0 }}
        className="relative z-10 w-full max-w-3xl glass rounded-2xl p-4 md:p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-white">
              Encode / Decode Demo
            </h3>
            <p className="text-sm text-neutral-400 mt-1">
              A quick demo using the selected cipher to show how encoding works.
            </p>
          </div>

          <button
            aria-label="Close demo"
            onClick={onClose}
            className="p-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-neutral-400">Original Text</div>
            <div className="mt-2 glass rounded-lg p-3 text-sm text-white">
              {demoText}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <div className="text-xs text-neutral-400">Encoded Result</div>
              <div className="text-xs text-neutral-400">
                {cipher}
                {needsShift ? ` • Shift: ${shift}` : ""}
              </div>
            </div>
            <div className="mt-2 glass rounded-lg p-3 font-mono text-sm wrap-break-word text-white">
              {encoded}
            </div>
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={onClose}
            className="py-2 px-4 rounded-xl bg-linear-to-r from-orange-500 to-amber-500 text-white font-semibold hover:from-orange-400 hover:to-amber-400"
          >
            Close Demo
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
