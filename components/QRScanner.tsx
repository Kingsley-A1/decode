"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
} from "react";
import { track } from "@vercel/analytics";
import type { Html5Qrcode, Html5QrcodeCameraScanConfig } from "html5-qrcode";
import {
  AlertTriangle,
  Camera,
  Check,
  ClipboardList,
  Copy,
  ExternalLink,
  FileText,
  History,
  Link as LinkIcon,
  Mail,
  Phone,
  Play,
  QrCode,
  RefreshCw,
  ScanLine,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  Smartphone,
  StopCircle,
  UserRound,
  Volume2,
  VolumeX,
  Wifi,
  X,
} from "lucide-react";
import {
  appendToolHistory,
  clearToolHistory,
  readToolHistory,
} from "@/lib/history/local-store";
import { cn } from "@/lib/utils";
import { Alert, Badge, Button, Dialog, FileUpload } from "@/components/ui";

type ScannerState = "idle" | "requesting" | "scanning" | "blocked" | "error";
type VerificationStatus = "idle" | "checking" | "done" | "error";
type Verdict = "safe" | "caution" | "suspicious" | "malicious";
type ScanSource = "Camera" | "Image upload";
type ScanContentType = "url" | "email" | "phone" | "sms" | "wifi" | "vcard" | "text";

interface ScanResult {
  readonly id: string;
  readonly value: string;
  readonly source: ScanSource;
  readonly scannedAt: string;
  readonly type: ScanContentType;
  readonly label: string;
  readonly normalizedUrl: string | null;
  readonly host: string | null;
  readonly isDecodeDynamicUrl: boolean;
}

interface LinkVerificationResult {
  readonly verdict: Verdict;
  readonly confidence: number;
  readonly normalizedUrl: string | null;
  readonly host: string | null;
  readonly evidence: readonly { readonly severity: string; readonly message: string }[];
}

interface LinkVerifyResponse {
  readonly ok: boolean;
  readonly data?: LinkVerificationResult;
  readonly error?: { readonly message: string };
}

const imageContentTypes = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "image/bmp",
]);

const maxUploadBytes = 10 * 1024 * 1024;
const recentScanLimit = 5;

export function QRScanner() {
  const [scannerState, setScannerState] = useState<ScannerState>("idle");
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [recentScans, setRecentScans] = useState<readonly ScanResult[]>([]);
  const [verificationStatus, setVerificationStatus] =
    useState<VerificationStatus>("idle");
  const [verification, setVerification] = useState<LinkVerificationResult | null>(
    null
  );
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [playSound, setPlaySound] = useState(true);
  const [permissionLabel, setPermissionLabel] = useState("Not requested");
  const [copied, setCopied] = useState(false);
  const [isOpenDialogVisible, setIsOpenDialogVisible] = useState(false);
  const containerId = useRef(`qr-reader-${Math.random().toString(36).slice(2)}`);
  const qrRef = useRef<Html5Qrcode | null>(null);
  const scannerStateRef = useRef<ScannerState>("idle");
  const openedAtRef = useRef<number>(Date.now());
  const cameraRequestedAtRef = useRef<number | null>(null);
  const cameraReadyAtRef = useRef<number | null>(null);
  const autoStartAttemptedRef = useRef(false);

  const scanConfig: Html5QrcodeCameraScanConfig = useMemo(
    () => ({
      fps: 10,
      qrbox: { width: 260, height: 260 },
      aspectRatio: 1,
      disableFlip: false,
    }),
    []
  );

  const resultAction = useMemo(
    () => (scanResult ? getPrimaryScanAction(scanResult) : null),
    [scanResult]
  );
  const canOpenUrl =
    Boolean(scanResult?.normalizedUrl) &&
    (verificationStatus === "done" || verificationStatus === "error");
  const shouldWarnBeforeOpen =
    verificationStatus !== "done" || verification?.verdict !== "safe";

  useEffect(() => {
    scannerStateRef.current = scannerState;
  }, [scannerState]);

  // Rehydrate the recent-scans tray from device-local history so scans
  // survive a reload. Derived fields are recomputed from the stored value.
  useEffect(() => {
    const stored = readToolHistory("scan").slice(0, recentScanLimit);
    if (stored.length === 0) return;

    setRecentScans((current) =>
      current.length > 0
        ? current
        : stored.map((entry) => ({
            ...createScanResult(
              entry.meta?.value ?? entry.title,
              entry.meta?.source === "Image upload" ? "Image upload" : "Camera"
            ),
            id: entry.id,
            scannedAt: entry.at,
          }))
    );
  }, []);

  const stopScanner = useCallback(async () => {
    const scanner = qrRef.current;
    qrRef.current = null;

    if (!scanner) {
      setScannerState("idle");
      return;
    }

    await stopAndClearScanner(scanner);

    setScannerState("idle");
    setPermissionLabel("Camera stopped");
  }, []);

  const verifyUrl = useCallback(async (result: ScanResult) => {
    if (!result.normalizedUrl) {
      setVerificationStatus("idle");
      setVerification(null);
      setVerificationError(null);
      return;
    }

    const startedAt = Date.now();
    setVerificationStatus("checking");
    setVerification(null);
    setVerificationError(null);
    trackScanEvent("scan_verify_started", {
      type: result.type,
      host: result.host,
      source: result.source,
    });

    try {
      const response = await fetch("/api/links/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: result.normalizedUrl,
          skipProbe: false,
        }),
      });
      const payload = (await response.json()) as LinkVerifyResponse;

      if (!response.ok || !payload.ok || !payload.data) {
        throw new Error(payload.error?.message ?? "Could not verify this URL.");
      }

      setVerification(payload.data);
      setVerificationStatus("done");
      trackScanEvent(
        payload.data.verdict === "safe"
          ? "scan_verify_success"
          : "scan_verify_warning",
        {
          type: result.type,
          host: payload.data.host ?? result.host,
          verdict: payload.data.verdict,
          confidence: payload.data.confidence,
          durationMs: Date.now() - startedAt,
        }
      );
    } catch (verifyError) {
      setVerificationStatus("error");
      setVerificationError(
        parseError(verifyError, "Decode could not verify this URL right now.")
      );
      trackScanEvent("scan_verify_warning", {
        type: result.type,
        host: result.host,
        verdict: "unverified",
        durationMs: Date.now() - startedAt,
      });
    }
  }, []);

  const processDecodedText = useCallback(
    (decodedText: string, source: ScanSource) => {
      const result = createScanResult(decodedText, source);
      const timeToFirstScan = cameraReadyAtRef.current
        ? Date.now() - cameraReadyAtRef.current
        : null;

      setScanResult(result);
      setRecentScans((current) => [
        result,
        ...current.filter((item) => item.value !== result.value),
      ].slice(0, recentScanLimit));
      // Device-local history so recent scans survive a reload.
      appendToolHistory({
        id: result.id,
        tool: "scan",
        at: result.scannedAt,
        title: result.value,
        subtitle: result.label,
        dedupeKey: result.value,
        meta: { value: result.value, source },
      });
      setCopied(false);
      setError(null);
      vibrate();
      playBeep(playSound);
      void stopScanner();
      void verifyUrl(result);
      trackScanEvent("scan_success", {
        type: result.type,
        source,
        host: result.host,
        decodeDynamic: result.isDecodeDynamicUrl,
        timeToFirstScanMs: timeToFirstScan,
      });
    },
    [playSound, stopScanner, verifyUrl]
  );

  const startScanning = useCallback(async () => {
    setError(null);
    setCopied(false);
    if (
      scannerStateRef.current === "scanning" ||
      scannerStateRef.current === "requesting"
    ) {
      return;
    }
    if (typeof window === "undefined") return;

    setScannerState("requesting");
    setPermissionLabel("Requesting camera");
    cameraRequestedAtRef.current = Date.now();
    trackScanEvent("scan_permission_requested", {
      timeFromOpenMs: Date.now() - openedAtRef.current,
    });

    try {
      const { Html5Qrcode: Html5QRCodeScanner } = await import("html5-qrcode");
      const html5Qr =
        qrRef.current ??
        new Html5QRCodeScanner(containerId.current, { verbose: false });
      qrRef.current = html5Qr;

      await html5Qr.start(
        { facingMode: "environment" },
        scanConfig,
        (text) => processDecodedText(text, "Camera"),
        () => undefined
      );

      cameraReadyAtRef.current = Date.now();
      setScannerState("scanning");
      setPermissionLabel("Camera active");
      trackScanEvent("scan_permission_granted", {
        grantLatencyMs: cameraRequestedAtRef.current
          ? Date.now() - cameraRequestedAtRef.current
          : null,
      });
      trackScanEvent("scan_camera_started", {
        startLatencyMs: cameraRequestedAtRef.current
          ? Date.now() - cameraRequestedAtRef.current
          : null,
      });
    } catch (scanError) {
      const message = parseError(
        scanError,
        "Unable to start scanner. Check camera permission."
      );
      const blocked = isPermissionError(message);

      setScannerState(blocked ? "blocked" : "error");
      setPermissionLabel(blocked ? "Permission blocked" : "Camera unavailable");
      setError(message);
      trackScanEvent(blocked ? "scan_permission_denied" : "scan_camera_failed", {
        reason: blocked ? "permission" : "unavailable",
      });
    }
  }, [processDecodedText, scanConfig]);

  useEffect(() => {
    trackScanEvent("scan_opened", {
      deviceClass: getDeviceClass(),
    });

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
        if (status.state === "granted" && !autoStartAttemptedRef.current) {
          autoStartAttemptedRef.current = true;
          window.setTimeout(() => {
            if (isMounted) void startScanning();
          }, 350);
        }

        status.onchange = () => setPermissionLabel(getPermissionLabel(status.state));
      } catch {
        setPermissionLabel("Browser controlled");
      }
    }

    void readCameraPermission();

    return () => {
      isMounted = false;
      const scanner = qrRef.current;
      qrRef.current = null;
      void stopAndClearScanner(scanner);
    };
  }, [startScanning]);

  async function handleFileUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setError(null);
    setCopied(false);
    trackScanEvent("scan_upload_started", {
      fileType: file.type,
      sizeBucket: getSizeBucket(file.size),
    });

    const validationError = validateImageFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      if (scannerState === "scanning") {
        await stopScanner();
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

      processDecodedText(payload.data.text, "Image upload");
    } catch (uploadError) {
      setError(parseError(uploadError, "Unable to read this QR image."));
    }
  }

  async function handleCopyResult(value = scanResult?.value) {
    if (!value) return;

    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
    trackScanEvent("scan_action_copied", {
      type: scanResult?.type ?? "unknown",
      host: scanResult?.host ?? null,
    });
  }

  function handlePrimaryAction() {
    if (!scanResult || !resultAction) return;

    if (scanResult.type === "url") {
      if (!canOpenUrl || shouldWarnBeforeOpen) {
        setIsOpenDialogVisible(true);
        return;
      }

      openUrl(scanResult.normalizedUrl);
      return;
    }

    if (resultAction.href) {
      window.location.href = resultAction.href;
      trackScanEvent("scan_action_opened", {
        type: scanResult.type,
      });
      return;
    }

    void handleCopyResult(resultAction.copyValue ?? scanResult.value);
  }

  function handleOpenAnyway() {
    if (!scanResult?.normalizedUrl) return;

    openUrl(scanResult.normalizedUrl);
    setIsOpenDialogVisible(false);
  }

  function openUrl(url: string | null | undefined) {
    if (!url) return;

    window.open(url, "_blank", "noopener,noreferrer");
    trackScanEvent("scan_action_opened", {
      type: "url",
      host: scanResult?.host ?? null,
      verdict: verification?.verdict ?? "unverified",
    });
  }

  function handleClearResult() {
    setScanResult(null);
    setVerification(null);
    setVerificationStatus("idle");
    setVerificationError(null);
    setCopied(false);
    setIsOpenDialogVisible(false);
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_390px]">
      <section className="min-w-0 space-y-4">
        <div
          className={cn(
            "rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4",
            scannerState === "scanning" && "ring-2 ring-sky-300"
          )}
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-slate-950">
                One-tap scanner
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Camera first, upload fallback, URL safety check before open.
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
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

          <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
            <div className="relative flex min-h-[320px] items-center justify-center">
              <div className="relative aspect-square w-full max-w-[520px] overflow-hidden rounded-xl border border-slate-200 bg-slate-950 shadow-sm">
                <div
                  id={containerId.current}
                  className="h-full w-full bg-slate-950 [&_button]:rounded-lg [&_button]:border [&_button]:border-slate-200 [&_button]:bg-white [&_button]:px-3 [&_button]:py-2 [&_button]:text-sm [&_button]:font-semibold [&_button]:text-slate-800 [&_img]:mx-auto [&_img]:max-h-full [&_img]:object-contain [&_video]:h-full [&_video]:w-full [&_video]:object-cover"
                />
                {scannerState !== "scanning" && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-slate-950 text-center text-white">
                    <span className="grid h-16 w-16 place-items-center rounded-2xl bg-white/10 text-sky-200 ring-1 ring-white/20">
                      <Camera className="h-8 w-8" aria-hidden="true" />
                    </span>
                    <div className="max-w-xs px-6">
                      <p className="text-base font-semibold">
                        {scannerState === "blocked"
                          ? "Camera blocked"
                          : scannerState === "requesting"
                            ? "Opening camera"
                            : "Ready to scan"}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-slate-300">
                        {scannerState === "blocked"
                          ? "Use image upload below or enable camera permission."
                          : "Tap Scan QR to request camera access."}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <ScannerStatusCard
                state={scannerState}
                permissionLabel={permissionLabel}
                verificationStatus={verificationStatus}
              />
              <Button
                onClick={scannerState === "scanning" ? stopScanner : startScanning}
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
                {scannerState === "scanning" ? "Stop camera" : "Scan QR"}
              </Button>
              <div
                className={cn(
                  "rounded-lg border p-3",
                  scannerState === "blocked"
                    ? "border-amber-200 bg-amber-50"
                    : "border-slate-200 bg-slate-50"
                )}
              >
                <FileUpload
                  label="Upload QR image"
                  accept="image/png,image/jpeg,image/webp,image/gif,image/bmp"
                  onChange={handleFileUpload}
                  hint="Fallback for blocked cameras. PNG, JPG, WebP, GIF, or BMP up to 10 MB."
                />
              </div>
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

        <RecentScansTray
          scans={recentScans}
          activeScanId={scanResult?.id ?? null}
          onSelect={(item) => {
            setScanResult(item);
            setCopied(false);
            void verifyUrl(item);
          }}
          onClear={() => {
            clearToolHistory("scan");
            setRecentScans([]);
          }}
        />
      </section>

      <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">
                Scan decision
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Decode identifies the payload and keeps the next action explicit.
              </p>
            </div>
            <ScanLine className="h-5 w-5 text-sky-700" aria-hidden="true" />
          </div>

          {scanResult ? (
            <div className="mt-4 space-y-4">
              <ResultSummary result={scanResult} />
              <VerificationCard
                result={scanResult}
                status={verificationStatus}
                verification={verification}
                error={verificationError}
                onRetry={() => void verifyUrl(scanResult)}
              />
              <div className="grid gap-2">
                {resultAction && (
                  <Button
                    variant={scanResult.type === "url" ? "primary" : "secondary"}
                    onClick={handlePrimaryAction}
                    disabled={scanResult.type === "url" && verificationStatus === "checking"}
                    leftIcon={resultAction.icon}
                  >
                    {resultAction.label}
                  </Button>
                )}
                <Button
                  variant="secondary"
                  onClick={() => void handleCopyResult()}
                  leftIcon={
                    copied ? (
                      <Check className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <Copy className="h-4 w-4" aria-hidden="true" />
                    )
                  }
                >
                  {copied ? "Copied" : "Copy raw result"}
                </Button>
                {scanResult.normalizedUrl && (
                  <Link
                    href={`/links?url=${encodeURIComponent(scanResult.normalizedUrl)}`}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition-colors hover:border-sky-300 hover:bg-sky-50 hover:text-sky-900"
                  >
                    <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                    Open in link verifier
                  </Link>
                )}
                <Button
                  variant="danger"
                  onClick={handleClearResult}
                  leftIcon={<X className="h-4 w-4" aria-hidden="true" />}
                >
                  Clear result
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-4 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5 text-center">
              <QrCode className="mx-auto h-8 w-8 text-sky-700" aria-hidden="true" />
              <p className="mt-3 text-sm font-semibold text-slate-950">
                No scan yet
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Tap Scan QR or upload an image. The result stays in this session.
              </p>
            </div>
          )}
        </section>
      </aside>

      <Dialog
        open={isOpenDialogVisible}
        title="Open scanned link?"
        description="Decode checked this URL where possible. Review the destination before leaving the app."
        onClose={() => setIsOpenDialogVisible(false)}
      >
        <div className="space-y-4">
          <p className="break-all rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-700">
            {scanResult?.normalizedUrl}
          </p>
          {verification && (
            <Alert
              variant={verification.verdict === "safe" ? "success" : "warning"}
              title={`Verdict: ${verification.verdict}`}
            >
              Confidence {verification.confidence}%.{" "}
              {verification.evidence[0]?.message ?? "No additional evidence returned."}
            </Alert>
          )}
          {verificationError && (
            <Alert variant="warning" title="Unverified URL">
              {verificationError}
            </Alert>
          )}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              variant="secondary"
              onClick={() => setIsOpenDialogVisible(false)}
            >
              Cancel
            </Button>
            {scanResult?.normalizedUrl && (
              <Link
                href={`/links?url=${encodeURIComponent(scanResult.normalizedUrl)}`}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition-colors hover:border-sky-300 hover:bg-sky-50 hover:text-sky-900"
              >
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                Link verifier
              </Link>
            )}
            <Button
              variant={verification?.verdict === "safe" ? "primary" : "danger"}
              onClick={handleOpenAnyway}
              leftIcon={<ExternalLink className="h-4 w-4" aria-hidden="true" />}
            >
              {verification?.verdict === "safe" ? "Open link" : "Open anyway"}
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
  verificationStatus,
}: {
  readonly state: ScannerState;
  readonly permissionLabel: string;
  readonly verificationStatus: VerificationStatus;
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
      <p className="mt-1 text-xs leading-5 text-slate-500">
        Verification: {getVerificationStatusLabel(verificationStatus)}
      </p>
    </div>
  );
}

function ResultSummary({ result }: { readonly result: ScanResult }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <Badge
          variant={result.type === "url" ? "info" : "neutral"}
          icon={
            <ScanTypeIcon
              type={result.type}
              className="h-3.5 w-3.5"
              aria-hidden="true"
            />
          }
        >
          {result.label}
        </Badge>
        <Badge variant="success">{result.source}</Badge>
        {result.isDecodeDynamicUrl && <Badge variant="info">Decode dynamic</Badge>}
      </div>
      <p className="mt-3 max-h-40 overflow-y-auto break-all text-sm leading-6 text-slate-700">
        {result.value}
      </p>
      <p className="mt-2 text-xs text-slate-500">
        Decoded {formatScanTime(result.scannedAt)}
      </p>
    </div>
  );
}

function VerificationCard({
  result,
  status,
  verification,
  error,
  onRetry,
}: {
  readonly result: ScanResult;
  readonly status: VerificationStatus;
  readonly verification: LinkVerificationResult | null;
  readonly error: string | null;
  readonly onRetry: () => void;
}) {
  if (!result.normalizedUrl) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-3">
        <p className="text-sm font-semibold text-slate-950">No URL check needed</p>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          This payload is handled as {result.label.toLowerCase()} content.
        </p>
      </div>
    );
  }

  if (status === "checking") {
    return (
      <div className="rounded-lg border border-sky-200 bg-sky-50 p-3">
        <p className="flex items-center gap-2 text-sm font-semibold text-sky-950">
          <RefreshCw className="h-4 w-4 animate-spin" aria-hidden="true" />
          Checking URL safety
        </p>
        <p className="mt-1 break-all text-sm leading-6 text-sky-900">
          {result.normalizedUrl}
        </p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
        <p className="text-sm font-semibold text-amber-950">Safety check unavailable</p>
        <p className="mt-1 text-sm leading-6 text-amber-900">
          {error ?? "Decode could not verify this URL."}
        </p>
        <Button className="mt-3" size="sm" variant="secondary" onClick={onRetry}>
          Try again
        </Button>
      </div>
    );
  }

  if (!verification) return null;

  const tone = getVerdictTone(verification.verdict);
  const Icon = tone.icon;

  return (
    <div className={cn("rounded-lg border p-3", tone.className)}>
      <p className="flex items-center gap-2 text-sm font-semibold">
        <Icon className="h-4 w-4" aria-hidden="true" />
        {tone.label}
      </p>
      <p className="mt-1 break-all text-sm leading-6">
        {verification.normalizedUrl ?? result.normalizedUrl}
      </p>
      <p className="mt-2 text-xs font-semibold">
        Confidence {verification.confidence}%
      </p>
      {verification.evidence[0]?.message && (
        <p className="mt-2 text-sm leading-6">{verification.evidence[0].message}</p>
      )}
    </div>
  );
}

function RecentScansTray({
  scans,
  activeScanId,
  onSelect,
  onClear,
}: {
  readonly scans: readonly ScanResult[];
  readonly activeScanId: string | null;
  readonly onSelect: (scan: ScanResult) => void;
  readonly onClear: () => void;
}) {
  if (scans.length === 0) return null;

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-sky-700" aria-hidden="true" />
          <h2 className="text-sm font-semibold text-slate-950">Recent scans</h2>
        </div>
        <Button size="sm" variant="ghost" onClick={onClear}>
          Clear
        </Button>
      </div>
      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
        {scans.map((scan) => {
          return (
            <button
              key={scan.id}
              type="button"
              onClick={() => onSelect(scan)}
              aria-pressed={scan.id === activeScanId}
              className={cn(
                "min-w-52 rounded-lg border p-3 text-left transition-colors",
                scan.id === activeScanId
                  ? "border-sky-400 bg-sky-50"
                  : "border-slate-200 bg-white hover:border-sky-300 hover:bg-sky-50"
              )}
            >
              <span className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                <ScanTypeIcon
                  type={scan.type}
                  className="h-3.5 w-3.5 text-sky-700"
                  aria-hidden="true"
                />
                {scan.label}
              </span>
              <span className="mt-2 line-clamp-2 block break-all text-xs leading-5 text-slate-600">
                {scan.host ?? scan.value}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function getPrimaryScanAction(result: ScanResult): {
  readonly label: string;
  readonly icon: ReactNode;
  readonly href?: string;
  readonly copyValue?: string;
} {
  if (result.type === "url") {
    return {
      label: "Open verified link",
      icon: <ExternalLink className="h-4 w-4" aria-hidden="true" />,
    };
  }

  if (result.type === "email") {
    return {
      label: "Compose email",
      href: result.value.startsWith("mailto:")
        ? result.value
        : `mailto:${result.value.trim()}`,
      icon: <Mail className="h-4 w-4" aria-hidden="true" />,
    };
  }

  if (result.type === "phone") {
    return {
      label: "Call number",
      href: result.value.startsWith("tel:")
        ? result.value
        : `tel:${result.value.trim()}`,
      icon: <Phone className="h-4 w-4" aria-hidden="true" />,
    };
  }

  if (result.type === "sms") {
    return {
      label: "Send SMS",
      href: result.value.toLowerCase().startsWith("sms:")
        ? result.value
        : `sms:${result.value.trim()}`,
      icon: <Smartphone className="h-4 w-4" aria-hidden="true" />,
    };
  }

  if (result.type === "wifi") {
    return {
      label: "Copy Wi-Fi details",
      copyValue: result.value,
      icon: <Wifi className="h-4 w-4" aria-hidden="true" />,
    };
  }

  if (result.type === "vcard") {
    return {
      label: "Copy contact card",
      copyValue: result.value,
      icon: <UserRound className="h-4 w-4" aria-hidden="true" />,
    };
  }

  return {
    label: "Copy text",
    copyValue: result.value,
    icon: <ClipboardList className="h-4 w-4" aria-hidden="true" />,
  };
}

function createScanResult(value: string, source: ScanSource): ScanResult {
  const normalizedUrl = normalizeUrl(value);
  const type = getScanContentType(value, normalizedUrl);
  const url = normalizedUrl ? new URL(normalizedUrl) : null;

  return {
    id: createClientId("scan"),
    value,
    source,
    scannedAt: new Date().toISOString(),
    type,
    label: getScanTypeLabel(type),
    normalizedUrl,
    host: url?.host ?? null,
    isDecodeDynamicUrl: Boolean(url && isDecodeDynamicUrl(url)),
  };
}

function getScanContentType(value: string, normalizedUrl: string | null): ScanContentType {
  const trimmed = value.trim();
  const lower = trimmed.toLowerCase();

  if (normalizedUrl) return "url";
  if (lower.startsWith("mailto:") || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return "email";
  }
  if (lower.startsWith("tel:") || /^\+?[0-9][0-9\s().-]{6,}$/.test(trimmed)) {
    return "phone";
  }
  if (lower.startsWith("sms:") || lower.startsWith("smsto:")) return "sms";
  if (lower.startsWith("wifi:")) return "wifi";
  if (lower.startsWith("begin:vcard")) return "vcard";

  return "text";
}

function getScanTypeLabel(type: ScanContentType): string {
  if (type === "url") return "URL";
  if (type === "email") return "Email";
  if (type === "phone") return "Phone";
  if (type === "sms") return "SMS";
  if (type === "wifi") return "Wi-Fi";
  if (type === "vcard") return "vCard";

  return "Text";
}

function ScanTypeIcon({
  type,
  className,
  "aria-hidden": ariaHidden,
}: {
  readonly type: ScanContentType;
  readonly className?: string;
  readonly "aria-hidden"?: boolean | "true" | "false";
}) {
  if (type === "url") return <LinkIcon className={className} aria-hidden={ariaHidden} />;
  if (type === "email") return <Mail className={className} aria-hidden={ariaHidden} />;
  if (type === "phone") return <Phone className={className} aria-hidden={ariaHidden} />;
  if (type === "sms") return <Smartphone className={className} aria-hidden={ariaHidden} />;
  if (type === "wifi") return <Wifi className={className} aria-hidden={ariaHidden} />;
  if (type === "vcard") return <UserRound className={className} aria-hidden={ariaHidden} />;

  return <FileText className={className} aria-hidden={ariaHidden} />;
}

function getVerdictTone(verdict: Verdict): {
  readonly label: string;
  readonly className: string;
  readonly icon: typeof ShieldCheck;
} {
  if (verdict === "safe") {
    return {
      label: "Safe to review",
      className: "border-emerald-200 bg-emerald-50 text-emerald-900",
      icon: ShieldCheck,
    };
  }
  if (verdict === "caution") {
    return {
      label: "Use caution",
      className: "border-amber-200 bg-amber-50 text-amber-950",
      icon: ShieldAlert,
    };
  }
  if (verdict === "suspicious") {
    return {
      label: "Suspicious destination",
      className: "border-orange-200 bg-orange-50 text-orange-950",
      icon: ShieldAlert,
    };
  }

  return {
    label: "High-risk destination",
    className: "border-rose-200 bg-rose-50 text-rose-900",
    icon: ShieldX,
  };
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

async function stopAndClearScanner(scanner: Html5Qrcode | null): Promise<void> {
  if (!scanner) return;

  try {
    await scanner.stop();
  } catch {
    // html5-qrcode throws when stop is called after decode, cleanup, or route changes.
  }

  try {
    await scanner.clear();
  } catch {
    // Clearing is best-effort; the DOM node can already be gone during unmount.
  }
}

function normalizeUrl(value: string): string | null {
  try {
    const trimmedValue = value.trim();
    if (!trimmedValue || /\s/.test(trimmedValue)) return null;

    const candidate = /^[a-z][a-z0-9+.-]*:/i.test(trimmedValue)
      ? trimmedValue
      : looksLikeHostname(trimmedValue)
        ? `https://${trimmedValue}`
        : trimmedValue;
    const url = new URL(candidate);

    if (url.protocol !== "http:" && url.protocol !== "https:") return null;

    return url.toString();
  } catch {
    return null;
  }
}

function looksLikeHostname(value: string): boolean {
  return /^[a-z0-9.-]+\.[a-z]{2,}(?::\d+)?(?:[/?#].*)?$/i.test(value);
}

function isDecodeDynamicUrl(url: URL): boolean {
  const host = url.hostname.replace(/^www\./, "");
  return (
    (host === "decode.com.ng" || host === window.location.hostname.replace(/^www\./, "")) &&
    /^\/r\/[^/]+\/?$/.test(url.pathname)
  );
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

function getScannerStateLabel(state: ScannerState): string {
  if (state === "requesting") return "Requesting";
  if (state === "scanning") return "Active";
  if (state === "blocked") return "Blocked";
  if (state === "error") return "Unavailable";

  return "Idle";
}

function getVerificationStatusLabel(status: VerificationStatus): string {
  if (status === "checking") return "Checking";
  if (status === "done") return "Complete";
  if (status === "error") return "Needs review";

  return "Waiting";
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

function createClientId(prefix: string): string {
  if (globalThis.crypto?.randomUUID) return `${prefix}-${globalThis.crypto.randomUUID()}`;

  return `${prefix}-${Date.now()}`;
}

function getDeviceClass(): string {
  if (typeof navigator === "undefined") return "unknown";

  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)
    ? "mobile"
    : "desktop";
}

function getSizeBucket(size: number): string {
  if (size < 250_000) return "small";
  if (size < 2_000_000) return "medium";

  return "large";
}

function trackScanEvent(
  name: string,
  properties: Record<string, string | number | boolean | null | undefined>
) {
  try {
    const safeProperties = Object.fromEntries(
      Object.entries(properties).filter(([, value]) => value !== null && value !== undefined)
    ) as Record<string, string | number | boolean>;

    track(name, safeProperties);
  } catch {
    // Analytics must never interrupt scan flow.
  }
}
