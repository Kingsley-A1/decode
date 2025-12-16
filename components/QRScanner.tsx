"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeCameraScanConfig } from "html5-qrcode";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  Camera,
  Check,
  Copy,
  Image as ImageIcon,
  Link as LinkIcon,
  Play,
  Share2,
  StopCircle,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const isUrl = (value: string) => {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

const parseError = (err: unknown, fallback = "Something went wrong") => {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return fallback;
};

const vibrate = (duration = 200) => {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate(duration);
    } catch {}
  }
};

const playBeep = (enabled: boolean) => {
  if (!enabled || typeof window === "undefined") return;
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = 880;
    gain.gain.value = 0.05;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  } catch {}
};

export function QRScanner() {
  const [isScanning, setIsScanning] = useState(false);
  const [scannedResult, setScannedResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [playSound, setPlaySound] = useState(true);
  const containerId = useRef(`qr-reader-${Math.random().toString(36).slice(2)}`);
  const fileContainerId = useRef(
    `qr-reader-file-${Math.random().toString(36).slice(2)}`
  );
  const qrRef = useRef<Html5Qrcode | null>(null);

  const scanConfig: Html5QrcodeCameraScanConfig = useMemo(
    () => ({
      fps: 10,
      qrbox: { width: 260, height: 260 },
      aspectRatio: 1,
      disableFlip: false,
    }),
    []
  );

  useEffect(() => {
    return () => {
      if (qrRef.current) {
        qrRef.current.stop().catch(() => undefined);
        try {
          qrRef.current.clear();
        } catch {}
      }
    };
  }, []);

  const handleScanSuccess = (decodedText: string) => {
    setScannedResult(decodedText);
    vibrate();
    playBeep(playSound);
    stopScanning();
  };

  const startScanning = async () => {
    setError(null);
    if (isScanning) return;
    if (typeof window === "undefined") return;

    try {
      const html5Qr =
        qrRef.current ?? new Html5Qrcode(containerId.current, { verbose: false });
      qrRef.current = html5Qr;

      await html5Qr.start(
        { facingMode: "environment" },
        scanConfig,
        (text) => {
          handleScanSuccess(text);
        },
        () => undefined
      );
      setIsScanning(true);
    } catch (err: unknown) {
      setError(
        parseError(err, "Unable to start scanner. Check camera permission.")
      );
      setIsScanning(false);
    }
  };

  const stopScanning = async () => {
    if (!qrRef.current) {
      setIsScanning(false);
      return;
    }
    try {
      await qrRef.current.stop();
      await qrRef.current.clear();
    } catch {}
    setIsScanning(false);
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setScannedResult(null);
    try {
      if (isScanning) {
        await stopScanning();
      }
      const instance =
        qrRef.current ?? new Html5Qrcode(fileContainerId.current, { verbose: false });
      qrRef.current = instance;
      const result = await instance.scanFile(file, true);
      handleScanSuccess(result);
    } catch (err: unknown) {
      const message = parseError(err, "Unable to read this file.");
      // Friendly fallback for the most common html5-qrcode failure message
      if (/no multiformat readers/i.test(message)) {
        setError(
          "No QR code detected in the image — try a clearer image, a larger QR area, or better lighting."
        );
      } else {
        setError(message);
      }
    } finally {
      e.target.value = "";
    }
  };

  const copyResult = async () => {
    if (!scannedResult) return;
    await navigator.clipboard.writeText(scannedResult);
  };

  const openLink = () => {
    if (scannedResult && isUrl(scannedResult)) {
      window.open(scannedResult, "_blank", "noopener,noreferrer");
    }
  };

  const shareResult = async () => {
    if (!scannedResult) return;
    if (navigator.share) {
      try {
        await navigator.share({ text: scannedResult });
      } catch {}
    } else {
      await copyResult();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-lg font-semibold text-white">Scan a QR Code</p>
          <p className="text-sm text-neutral-400">
            Use your camera or upload an image to decode the QR content.
          </p>
        </div>
        <button
          onClick={() => setPlaySound((v) => !v)}
          className="inline-flex items-center gap-2 rounded-full border border-neutral-800 px-3 py-1 text-sm text-neutral-200 hover:border-orange-500 hover:text-white transition"
        >
          {playSound ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          {playSound ? "Sound on" : "Sound off"}
        </button>
      </div>

      <div
        className={cn(
          "relative overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900/60 backdrop-blur",
          isScanning ? "ring-2 ring-orange-500/50" : ""
        )}
      >
        <div className="absolute inset-0 pointer-events-none bg-linear-to-b from-orange-500/5 via-transparent to-orange-500/5" />
        <div className="relative p-4 flex flex-col gap-4">
          <div className="relative flex items-center justify-center">
            <div
              className="relative h-[300px] w-full max-w-md rounded-xl border border-neutral-800 bg-neutral-950/80 shadow-lg overflow-hidden"
            >
              <div id={containerId.current} className="w-full h-full" />
              <div className="pointer-events-none absolute inset-0 rounded-xl border border-orange-500/30" />
              <div className="pointer-events-none absolute inset-x-6 top-1/2 h-px bg-orange-400/50 animate-pulse" />
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={isScanning ? stopScanning : startScanning}
              className={cn(
                "inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-all",
                isScanning
                  ? "bg-red-500/15 text-red-200 border border-red-500/40 hover:bg-red-500/25"
                  : "bg-orange-500/20 text-orange-200 border border-orange-500/40 hover:bg-orange-500/30"
              )}
            >
              {isScanning ? (
                <StopCircle className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              {isScanning ? "Stop scanning" : "Start scanning"}
            </button>

            <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-neutral-800 bg-neutral-900/80 px-4 py-3 text-sm font-semibold text-neutral-100 hover:border-orange-500/40 hover:text-white transition-all">
              <ImageIcon className="w-4 h-4" />
              Upload image
              <input
                type="file"
                accept="image/*"
                onChange={handleFile}
                className="hidden"
              />
            </label>

            <div className="inline-flex items-center gap-2 rounded-xl border border-neutral-800 bg-neutral-900/80 px-4 py-3 text-sm text-neutral-300">
              <Camera className="w-4 h-4" />
              Camera: {isScanning ? "On" : "Off"}
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              <AlertTriangle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}
        </div>
      </div>

      {/* Hidden container used when scanning files */}
      <div id={fileContainerId.current} className="hidden" />

      <AnimatePresence>
        {scannedResult && (
          <motion.div
            className="fixed inset-0 z-40 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => setScannedResult(null)}
              aria-hidden
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className="relative z-10 w-full max-w-lg rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-2xl"
              role="dialog"
              aria-modal="true"
              aria-label="QR scan result"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-neutral-400">Scan result</p>
                  <p className="mt-2 text-lg font-semibold text-white wrap-break-word leading-relaxed">
                    {scannedResult}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-500/15 px-2.5 py-1 text-xs font-semibold text-green-300">
                    <Check className="w-3 h-3" />
                    Found
                  </span>
                  <button
                    onClick={() => setScannedResult(null)}
                    className="rounded-full p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
                    aria-label="Close"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-2">
                <button
                  onClick={copyResult}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 hover:border-orange-500/50 hover:text-white transition"
                >
                  <Copy className="w-4 h-4" />
                  Copy
                </button>
                <button
                  onClick={openLink}
                  disabled={!isUrl(scannedResult)}
                  className={cn(
                    "inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm transition",
                    isUrl(scannedResult)
                      ? "border-blue-500/40 bg-blue-500/10 text-blue-100 hover:border-blue-400"
                      : "border-neutral-800 bg-neutral-900/60 text-neutral-500 cursor-not-allowed"
                  )}
                >
                  <LinkIcon className="w-4 h-4" />
                  Open link
                </button>
                <button
                  onClick={shareResult}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 hover:border-orange-500/50 hover:text-white transition"
                >
                  <Share2 className="w-4 h-4" />
                  Share
                </button>
                <button
                  onClick={() => setScannedResult(null)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-neutral-200 hover:border-red-500/40 hover:text-white transition"
                >
                  <StopCircle className="w-4 h-4" />
                  Clear
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
