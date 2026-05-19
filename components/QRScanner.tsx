"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import type { Html5Qrcode, Html5QrcodeCameraScanConfig } from "html5-qrcode";
import {
  AlertTriangle,
  Camera,
  Check,
  Copy,
  ExternalLink,
  Image as ImageIcon,
  Link as LinkIcon,
  Play,
  ScanLine,
  Share2,
  ShieldCheck,
  StopCircle,
  Trash2,
  UploadCloud,
  Volume2,
  VolumeX,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Alert, Badge, Button, Dialog, FileUpload } from "@/components/ui";

type ScannerState = "idle" | "requesting" | "scanning" | "blocked" | "error";

interface ScanResult {
  readonly value: string;
  readonly source: "Camera" | "Image upload";
  readonly scannedAt: string;
}

const imageContentTypes = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "image/bmp",
]);

const maxUploadBytes = 10 * 1024 * 1024;

export function QRScanner() {
  const [scannerState, setScannerState] = useState<ScannerState>("idle");
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [playSound, setPlaySound] = useState(true);
  const [permissionLabel, setPermissionLabel] = useState("Not requested");
  const [copied, setCopied] = useState(false);
  const [isOpenDialogVisible, setIsOpenDialogVisible] = useState(false);
  const containerId = useRef(`qr-reader-${Math.random().toString(36).slice(2)}`);
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
  const resultUrl = scanResult?.value && isHttpUrl(scanResult.value)
    ? normalizeUrl(scanResult.value)
    : null;

  useEffect(() => {
    let isMounted = true;

    async function readCameraPermission() {
      try {
        const permissions = navigator.permissions;
        if (!permissions?.query) return;

        const status = await permissions.query({
          name: "camera" as PermissionName,
        });
        if (!isMounted) return;

        setPermissionLabel(getPermissionLabel(status.state));
        status.onchange = () => setPermissionLabel(getPermissionLabel(status.state));
      } catch {
        setPermissionLabel("Browser controlled");
      }
    }

    void readCameraPermission();

    return () => {
      isMounted = false;
      if (qrRef.current) {
        qrRef.current.stop().catch(() => undefined);
        try {
          qrRef.current.clear();
        } catch {}
      }
    };
  }, []);

  async function handleStartScanning() {
    setError(null);
    setCopied(false);
    if (scannerState === "scanning" || scannerState === "requesting") return;
    if (typeof window === "undefined") return;

    setScannerState("requesting");
    setPermissionLabel("Requesting camera");

    try {
      const { Html5Qrcode: Html5QRCodeScanner } = await import("html5-qrcode");
      const html5Qr =
        qrRef.current ??
        new Html5QRCodeScanner(containerId.current, { verbose: false });
      qrRef.current = html5Qr;

      await html5Qr.start(
        { facingMode: "environment" },
        scanConfig,
        (text) => handleScanSuccess(text, "Camera"),
        () => undefined
      );
      setScannerState("scanning");
      setPermissionLabel("Camera active");
    } catch (scanError) {
      const message = parseError(
        scanError,
        "Unable to start scanner. Check camera permission."
      );
      setScannerState(isPermissionError(message) ? "blocked" : "error");
      setPermissionLabel(isPermissionError(message) ? "Permission blocked" : "Camera unavailable");
      setError(message);
    }
  }

  async function handleStopScanning() {
    if (!qrRef.current) {
      setScannerState("idle");
      return;
    }

    try {
      await qrRef.current.stop();
      await qrRef.current.clear();
    } catch {}

    setScannerState("idle");
    setPermissionLabel("Camera stopped");
  }

  function handleScanSuccess(decodedText: string, source: ScanResult["source"]) {
    setScanResult({
      value: decodedText,
      source,
      scannedAt: new Date().toISOString(),
    });
    setCopied(false);
    setError(null);
    vibrate();
    playBeep(playSound);
    void handleStopScanning();
  }

  async function handleFileUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setError(null);
    setCopied(false);

    const validationError = validateImageFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      if (scannerState === "scanning") {
        await handleStopScanning();
      }

      const formData = new FormData();
      formData.set("file", file);
      const response = await fetch("/api/scans/image", {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json()) as
        | { ok: true; data: { text: string } }
        | { ok: false; error: { message: string } };

      if (!payload.ok) throw new Error(payload.error.message);

      handleScanSuccess(payload.data.text, "Image upload");
    } catch (uploadError) {
      setError(parseError(uploadError, "Unable to read this QR image."));
    }
  }

  async function handleCopyResult() {
    if (!scanResult) return;

    await navigator.clipboard.writeText(scanResult.value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  async function handleShareResult() {
    if (!scanResult) return;

    if (navigator.share) {
      try {
        await navigator.share({ text: scanResult.value });
        return;
      } catch {}
    }

    await handleCopyResult();
  }

  function handleClearResult() {
    setScanResult(null);
    setCopied(false);
    setIsOpenDialogVisible(false);
  }

  function handleOpenResult() {
    if (!resultUrl) return;
    window.open(resultUrl, "_blank", "noopener,noreferrer");
    setIsOpenDialogVisible(false);
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_390px]">
      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">
              Camera scanner
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Start the camera only when needed. Decoded links are never opened
              automatically.
            </p>
          </div>
          <Button
            variant="secondary"
            onClick={() => setPlaySound((value) => !value)}
            leftIcon={
              playSound ? (
                <Volume2 className="h-4 w-4" aria-hidden="true" />
              ) : (
                <VolumeX className="h-4 w-4" aria-hidden="true" />
              )
            }
          >
            {playSound ? "Sound on" : "Sound off"}
          </Button>
        </div>

        <div
          className={cn(
            "rounded-xl border border-slate-200 bg-white p-4 shadow-sm",
            scannerState === "scanning" && "ring-2 ring-sky-300"
          )}
        >
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_240px]">
            <div className="relative flex items-center justify-center">
              <div className="relative h-[340px] w-full max-w-lg overflow-hidden rounded-xl border border-slate-200 bg-slate-950 shadow-sm">
                <div
                  id={containerId.current}
                  className="h-full w-full bg-slate-950 [&_button]:rounded-lg [&_button]:border [&_button]:border-slate-200 [&_button]:bg-white [&_button]:px-3 [&_button]:py-2 [&_button]:text-sm [&_button]:font-semibold [&_button]:text-slate-800 [&_img]:mx-auto [&_img]:max-h-full [&_img]:object-contain [&_video]:h-full [&_video]:w-full [&_video]:object-cover"
                />
                {scannerState !== "scanning" && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-950 text-center text-white">
                    <Camera
                      className="h-10 w-10 text-sky-300"
                      aria-hidden="true"
                    />
                    <p className="max-w-xs px-6 text-sm leading-6 text-slate-200">
                      Camera feed appears here after permission is granted.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <ScannerStatusCard
                state={scannerState}
                permissionLabel={permissionLabel}
              />
              <Button
                onClick={
                  scannerState === "scanning"
                    ? handleStopScanning
                    : handleStartScanning
                }
                variant={scannerState === "scanning" ? "danger" : "primary"}
                isLoading={scannerState === "requesting"}
                className="w-full"
                leftIcon={
                  scannerState === "scanning" ? (
                    <StopCircle className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Play className="h-4 w-4" aria-hidden="true" />
                  )
                }
              >
                {scannerState === "scanning" ? "Stop camera" : "Start camera"}
              </Button>
              <FileUpload
                label="Upload QR image"
                accept="image/png,image/jpeg,image/webp,image/gif,image/bmp"
                onChange={handleFileUpload}
                hint="PNG, JPG, WebP, GIF, or BMP up to 10 MB."
              />
            </div>
          </div>

          {error && (
            <Alert
              className="mt-4"
              variant="danger"
              icon={<AlertTriangle className="h-4 w-4" aria-hidden="true" />}
            >
              {error}
            </Alert>
          )}
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <FeatureNote
            icon={<Camera className="h-4 w-4" aria-hidden="true" />}
            title="Permission-aware"
            text="Camera state and denial states are visible."
          />
          <FeatureNote
            icon={<UploadCloud className="h-4 w-4" aria-hidden="true" />}
            title="Upload fallback"
            text="Decode a QR from an image when camera access is unavailable."
          />
          <FeatureNote
            icon={<ShieldCheck className="h-4 w-4" aria-hidden="true" />}
            title="Safe by default"
            text="URL results can be verified before opening."
          />
        </div>
      </section>

      <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">
                Result panel
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Copy, share, verify, clear, or cautiously open decoded content.
              </p>
            </div>
            <ScanLine className="h-5 w-5 text-sky-700" aria-hidden="true" />
          </div>

          {scanResult ? (
            <div className="mt-4 space-y-4">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant={resultUrl ? "info" : "neutral"}
                    icon={
                      resultUrl ? (
                        <LinkIcon className="h-3.5 w-3.5" aria-hidden="true" />
                      ) : (
                        <ImageIcon className="h-3.5 w-3.5" aria-hidden="true" />
                      )
                    }
                  >
                    {resultUrl ? "URL" : "Text"}
                  </Badge>
                  <Badge variant="success">{scanResult.source}</Badge>
                </div>
                <p className="mt-3 break-all text-sm leading-6 text-slate-700">
                  {scanResult.value}
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  Decoded {formatScanTime(scanResult.scannedAt)}
                </p>
              </div>

              <div className="grid gap-2">
                <Button
                  variant="secondary"
                  onClick={handleCopyResult}
                  leftIcon={
                    copied ? (
                      <Check className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <Copy className="h-4 w-4" aria-hidden="true" />
                    )
                  }
                >
                  {copied ? "Copied" : "Copy result"}
                </Button>
                <Button
                  variant="secondary"
                  onClick={handleShareResult}
                  leftIcon={<Share2 className="h-4 w-4" aria-hidden="true" />}
                >
                  Share result
                </Button>
                {resultUrl && (
                  <Link
                    href={`/verify?url=${encodeURIComponent(resultUrl)}`}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition-colors hover:border-sky-300 hover:bg-sky-50 hover:text-sky-900"
                  >
                    <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                    Verify link
                  </Link>
                )}
                <Button
                  variant="secondary"
                  onClick={() => setIsOpenDialogVisible(true)}
                  disabled={!resultUrl}
                  leftIcon={<ExternalLink className="h-4 w-4" aria-hidden="true" />}
                >
                  Open cautiously
                </Button>
                <Button
                  variant="danger"
                  onClick={handleClearResult}
                  leftIcon={<Trash2 className="h-4 w-4" aria-hidden="true" />}
                >
                  Clear result
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-4 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5 text-center">
              <ScanLine
                className="mx-auto h-8 w-8 text-sky-700"
                aria-hidden="true"
              />
              <p className="mt-3 text-sm font-semibold text-slate-950">
                No scan yet
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Start the camera or upload an image. Results stay here until
                you clear them.
              </p>
            </div>
          )}
        </section>
      </aside>

      <Dialog
        open={isOpenDialogVisible}
        title="Open scanned link?"
        description="Decode has not verified this URL in the scanner. Verify it first if you do not fully trust the source."
        onClose={() => setIsOpenDialogVisible(false)}
      >
        <div className="space-y-4">
          <p className="break-all rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-700">
            {resultUrl}
          </p>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              variant="secondary"
              onClick={() => setIsOpenDialogVisible(false)}
            >
              Cancel
            </Button>
            {resultUrl && (
              <Link
                href={`/verify?url=${encodeURIComponent(resultUrl)}`}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition-colors hover:border-sky-300 hover:bg-sky-50 hover:text-sky-900"
              >
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                Verify first
              </Link>
            )}
            <Button
              variant="danger"
              onClick={handleOpenResult}
              leftIcon={<ExternalLink className="h-4 w-4" aria-hidden="true" />}
            >
              Open anyway
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

function ScannerStatusCard({
  state,
  permissionLabel,
}: {
  readonly state: ScannerState;
  readonly permissionLabel: string;
}) {
  const variant = state === "blocked" || state === "error"
    ? "danger"
    : state === "scanning"
      ? "success"
      : state === "requesting"
        ? "warning"
        : "neutral";

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-slate-950">Camera status</p>
        <Badge variant={variant}>{getScannerStateLabel(state)}</Badge>
      </div>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        Permission: {permissionLabel}
      </p>
    </div>
  );
}

function FeatureNote({
  icon,
  title,
  text,
}: {
  readonly icon: React.ReactNode;
  readonly title: string;
  readonly text: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
        <span className="text-sky-700">{icon}</span>
        {title}
      </div>
      <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
    </div>
  );
}

function getScannerStateLabel(state: ScannerState): string {
  if (state === "requesting") return "Requesting";
  if (state === "scanning") return "Active";
  if (state === "blocked") return "Blocked";
  if (state === "error") return "Unavailable";

  return "Idle";
}

function validateImageFile(file: File): string | null {
  if (!imageContentTypes.has(file.type)) {
    return "Upload a PNG, JPG, WebP, GIF, or BMP image.";
  }

  if (file.size > maxUploadBytes) {
    return "Upload image must be 10 MB or smaller.";
  }

  return null;
}

function isHttpUrl(value: string): boolean {
  return Boolean(normalizeUrl(value));
}

function normalizeUrl(value: string): string | null {
  try {
    const trimmedValue = value.trim();
    const candidate = /^[a-z][a-z0-9+.-]*:/i.test(trimmedValue)
      ? trimmedValue
      : `https://${trimmedValue}`;
    const url = new URL(candidate);

    if (url.protocol !== "http:" && url.protocol !== "https:") return null;

    return url.toString();
  } catch {
    return null;
  }
}

function parseError(error: unknown, fallback: string): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;

  return fallback;
}

function isPermissionError(message: string): boolean {
  const normalized = message.toLowerCase();

  return (
    normalized.includes("permission") ||
    normalized.includes("notallowed") ||
    normalized.includes("denied")
  );
}

function getPermissionLabel(state: PermissionState): string {
  if (state === "granted") return "Granted";
  if (state === "denied") return "Blocked";

  return "Prompt required";
}

function formatScanTime(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(value));
}

function vibrate(duration = 200) {
  if (typeof navigator === "undefined" || !("vibrate" in navigator)) return;

  try {
    navigator.vibrate(duration);
  } catch {}
}

function playBeep(enabled: boolean) {
  if (!enabled || typeof window === "undefined") return;

  try {
    const AudioCtx =
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return;

    const context = new AudioCtx();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.frequency.value = 880;
    gain.gain.value = 0.05;
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.15);
  } catch {}
}

