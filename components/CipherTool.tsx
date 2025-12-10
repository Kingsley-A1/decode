"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { encrypt, decrypt, cipherOptions, CipherType } from "@/lib/crypto";
import {
  Lock,
  Unlock,
  Copy,
  Check,
  ArrowRightLeft,
  Trash2,
  Sparkles,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PageHeader } from "./PageHeader";
import EncodeDecodeDemoCard from "./EncodeDecodeDemoCard";

export function CipherTool() {
  const [inputText, setInputText] = useState("");
  const [selectedCipher, setSelectedCipher] = useState<CipherType>("caesar");
  const [shift, setShift] = useState(3);
  const [isEncrypt, setIsEncrypt] = useState(true);
  const [copied, setCopied] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);

  const outputText = useMemo(() => {
    if (!inputText) return "";
    return isEncrypt
      ? encrypt(inputText, selectedCipher, shift)
      : decrypt(inputText, selectedCipher, shift);
  }, [inputText, selectedCipher, shift, isEncrypt]);

  const copyOutput = async () => {
    if (!outputText) return;
    await navigator.clipboard.writeText(outputText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const swapTexts = () => {
    setInputText(outputText);
    setIsEncrypt(!isEncrypt);
  };

  const clearAll = () => {
    setInputText("");
    // outputText is computed via useMemo - clearing the input clears the output
  };

  const selectedOption = cipherOptions.find((opt) => opt.id === selectedCipher);

  return (
    <>
      <div className="p-4 space-y-6">
        {/* Header with Logo and Theme Toggle */}
        <PageHeader
          title="Cipher Tools"
          subtitle="Encrypt & decrypt your messages"
        />

        {/* Mode Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-center justify-center gap-3"
        >
          <button
            onClick={() => setIsEncrypt(true)}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all font-medium",
              isEncrypt
                ? "bg-orange-500/20 text-orange-300 border border-orange-500 shadow-lg shadow-orange-500/10"
                : "bg-neutral-900 text-neutral-400 border border-neutral-800 hover:border-neutral-700"
            )}
          >
            <Lock className="w-4 h-4" />
            Encrypt
          </button>
          <button
            onClick={() => setIsEncrypt(false)}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all font-medium",
              !isEncrypt
                ? "bg-amber-500/20 text-amber-300 border border-amber-500 shadow-lg shadow-amber-500/10"
                : "bg-neutral-900 text-neutral-400 border border-neutral-800 hover:border-neutral-700"
            )}
          >
            <Unlock className="w-4 h-4" />
            Decrypt
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="flex items-center justify-center mt-2"
        >
          <button
            onClick={() => setDemoOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-900 text-neutral-300 border border-neutral-800 hover:border-neutral-700 hover:bg-neutral-900/95 transition-all"
          >
            <Eye className="w-4 h-4" />
            See Demo
          </button>
        </motion.div>
        {/* Cipher Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-2"
        >
          <label className="text-sm font-medium text-neutral-300 flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Cipher Algorithm
          </label>
          <div className="grid grid-cols-2 gap-2">
            {cipherOptions.map((cipher) => (
              <button
                key={cipher.id}
                onClick={() => setSelectedCipher(cipher.id)}
                className={cn(
                  "px-3 py-3 text-left rounded-xl border transition-all",
                  selectedCipher === cipher.id
                    ? "bg-orange-500/15 border-orange-500"
                    : "bg-neutral-900 border-neutral-800 hover:border-neutral-700"
                )}
              >
                <div
                  className={cn(
                    "text-sm font-medium",
                    selectedCipher === cipher.id
                      ? "text-orange-300"
                      : "text-neutral-300"
                  )}
                >
                  {cipher.name}
                </div>
                <div className="text-xs text-neutral-500 mt-0.5">
                  {cipher.description}
                </div>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Shift Input for Caesar */}
        <AnimatePresence>
          {selectedOption?.hasShift && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2"
            >
              <label className="text-sm font-medium text-neutral-300">
                Shift Amount: {shift}
              </label>
              <input
                type="range"
                min="1"
                max="25"
                value={shift}
                onChange={(e) => setShift(Number(e.target.value))}
                className="w-full h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
              />
              <div className="flex justify-between text-xs text-neutral-500">
                <span>1</span>
                <span>25</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input Text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-2"
        >
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-neutral-300">
              {isEncrypt ? "Plain Text" : "Encrypted Text"}
            </label>
            <button
              onClick={clearAll}
              className="text-xs text-neutral-500 hover:text-red-400 flex items-center gap-1 transition-colors"
            >
              <Trash2 className="w-3 h-3" />
              Clear
            </button>
          </div>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              isEncrypt
                ? "Enter text to encrypt..."
                : "Enter text to decrypt..."
            }
            className="w-full h-28 bg-neutral-900 border border-neutral-800 rounded-xl p-3 text-white placeholder:text-neutral-500 focus:outline-none focus:border-orange-500 transition-colors resize-none"
          />
        </motion.div>

        {/* Swap Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="flex justify-center"
        >
          <button
            onClick={swapTexts}
            disabled={!outputText}
            className="p-3 bg-neutral-900 border border-neutral-800 rounded-full hover:border-orange-500 hover:bg-orange-500/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowRightLeft className="w-5 h-5 text-orange-400" />
          </button>
        </motion.div>

        {/* Output Text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-2"
        >
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-neutral-300">
              {isEncrypt ? "Encrypted Result" : "Decrypted Result"}
            </label>
            <button
              onClick={copyOutput}
              disabled={!outputText}
              className="text-xs text-neutral-500 hover:text-green-400 flex items-center gap-1 transition-colors disabled:opacity-50"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  Copy
                </>
              )}
            </button>
          </div>
          <div
            className={cn(
              "w-full min-h-28 bg-neutral-900 border rounded-xl p-3 font-mono text-sm break-all",
              outputText
                ? isEncrypt
                  ? "border-orange-500/50 text-orange-300"
                  : "border-amber-500/50 text-amber-300"
                : "border-neutral-800 text-neutral-500"
            )}
          >
            {outputText || "Output will appear here..."}
          </div>
        </motion.div>
      </div>
      <EncodeDecodeDemoCard
        open={demoOpen}
        onClose={() => setDemoOpen(false)}
        cipher={selectedCipher}
        shift={shift}
      />
    </>
  );
}
