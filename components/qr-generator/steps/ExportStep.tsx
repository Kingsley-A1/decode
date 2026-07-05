import { useEffect, useRef, useState } from "react";
import {
  Check,
  Copy,
  Download,
  Rocket,
  UploadCloud,
} from "lucide-react";
import {
  Alert,
  Badge,
  BuilderActionBar,
  Button,
  ChoiceRail,
} from "@/components/ui";
import { OAuthSignInPanel } from "@/components/auth/OAuthSignInPanel";
import { HistoryPanel } from "@/components/history/HistoryPanel";
import type { ToolHistorySource } from "@/components/history/useToolHistory";
import type { ToolHistoryEntry } from "@/lib/history/types";
import { exportFormatOptions } from "../constants";
import { getFrameExportLabel, getTypeLabel } from "../labels";
import type {
  DesignState,
  ExportFormat,
  FormState,
  PayloadResult,
  QRMode,
  QRType,
  ScanabilityResult,
} from "../types";

export function ExportStep({
  headingRef,
  mode,
  type,
  form,
  payload,
  design,
  scanability,
  isReady,
  copied,
  publishStatus,
  publishError,
  isPublishing,
  authPromptVisible,
  authPromptMessage,
  isCheckingAuth,
  onBack,
  onCopyPayload,
  onDownloadSelected,
  onPublishDynamic,
  onSaveStatic,
  savedQRCodeId,
  onBeforeSignIn,
  historyEntries,
  historySource,
  onClearHistory,
}: {
  readonly headingRef: React.RefObject<HTMLHeadingElement | null>;
  readonly mode: QRMode;
  readonly type: QRType;
  readonly form: FormState;
  readonly payload: PayloadResult | null;
  readonly design: DesignState;
  readonly scanability: ScanabilityResult;
  readonly isReady: boolean;
  readonly copied: boolean;
  readonly publishStatus: string | null;
  readonly publishError: string | null;
  readonly isPublishing: boolean;
  readonly authPromptVisible: boolean;
  readonly authPromptMessage: string | null;
  readonly isCheckingAuth: boolean;
  readonly onBack: () => void;
  readonly onCopyPayload: () => void;
  readonly onDownloadSelected: (format: ExportFormat) => void;
  readonly onPublishDynamic: () => void;
  readonly onSaveStatic: () => void;
  readonly savedQRCodeId: string | null;
  readonly onBeforeSignIn: () => void;
  readonly historyEntries: readonly ToolHistoryEntry[];
  readonly historySource: ToolHistorySource;
  readonly onClearHistory: () => void;
}) {
  const [exportFormat, setExportFormat] = useState<ExportFormat>("png");
  const authPromptRef = useRef<HTMLDivElement>(null);
  const selectedExport =
    exportFormatOptions.find((option) => option.value === exportFormat) ??
    exportFormatOptions[0];
  const canUsePayload = Boolean(payload?.value);
  const handleDownloadSelected = () => {
    onDownloadSelected(exportFormat);
  };

  useEffect(() => {
    if (!authPromptVisible) return;

    window.requestAnimationFrame(() => {
      authPromptRef.current?.scrollIntoView({
        block: "center",
        behavior: "smooth",
      });
    });
  }, [authPromptVisible, authPromptMessage]);

  return (
    <div className="space-y-5">
      <div>
        <h2
          id="qr-step-export-heading"
          ref={headingRef}
          tabIndex={-1}
          className="scroll-mt-28 text-lg font-semibold text-slate-950 focus:outline-none"
        >
          3. Export and publish
        </h2>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          Download the QR or publish a dynamic redirect when signed in.
        </p>
      </div>

      <ChoiceRail
        value={exportFormat}
        options={exportFormatOptions}
        onChange={setExportFormat}
        label="Export format"
        size="md"
        desktopColumns={3}
        getDescription={(option) => (
          <>
            <span className="font-medium text-slate-800">
              {option.label}:
            </span>{" "}
            {option.value === "png"
              ? `${design.size} x ${design.size} ${option.description.toLowerCase()}`
              : option.description}
          </>
        )}
      />

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={mode === "dynamic" ? "info" : "neutral"}>
            {mode === "dynamic" ? "Dynamic" : "Static"}
          </Badge>
          <Badge variant="neutral">{getTypeLabel(type)}</Badge>
          <Badge variant="info">{design.errorCorrectionLevel} correction</Badge>
          <Badge variant="neutral">{getFrameExportLabel(design.frameStyle)}</Badge>
        </div>
        <p className="mt-3 break-all text-sm leading-6 text-slate-700">
          {payload?.summary ?? "No payload generated."}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            variant="secondary"
            onClick={onCopyPayload}
            disabled={!canUsePayload}
            leftIcon={
              copied ? (
                <Check className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Copy className="h-4 w-4" aria-hidden="true" />
              )
            }
          >
            {copied ? "Copied payload" : "Copy payload"}
          </Button>
          {mode === "dynamic" && (
            <Button
              variant="primary"
              onClick={onPublishDynamic}
              disabled={scanability.blocksPublish}
              isLoading={isPublishing}
              leftIcon={<Rocket className="h-4 w-4" aria-hidden="true" />}
            >
              Publish dynamic QR
            </Button>
          )}
          {mode !== "dynamic" && (
            <Button
              variant="primary"
              onClick={onSaveStatic}
              disabled={scanability.blocksPublish || !canUsePayload}
              isLoading={isPublishing}
              leftIcon={<UploadCloud className="h-4 w-4" aria-hidden="true" />}
            >
              Save to workspace
            </Button>
          )}
        </div>
      </div>

      {mode === "dynamic" && (
        <Alert variant="info" title="Dynamic destination">
          {payload?.isStale
            ? "Destination or design changed after publish. Publish again before downloading or copying the updated dynamic QR."
            : payload?.requiresPublish
              ? "Publish to assign public link before copying or downloading this dynamic QR."
              : "This dynamic QR has a server-assigned public link."}{" "}
          Destination: {form.url || "Add a destination URL"}.
        </Alert>
      )}
      {mode === "dynamic" && scanability.blocksPublish && (
        <Alert variant="danger" title="Publish blocked">
          Resolve blocked scanability issues before publishing this dynamic QR.
        </Alert>
      )}
      {publishStatus && <Alert variant="success">{publishStatus}</Alert>}
      {mode !== "dynamic" && savedQRCodeId && (
        <Alert variant="success" title="Saved to workspace">
          <a
            className="font-semibold text-sky-800 underline underline-offset-2"
            href={`/dashboard/qr/${savedQRCodeId}`}
          >
            View saved QR code
          </a>
        </Alert>
      )}
      {publishError && <Alert variant="danger">{publishError}</Alert>}
      {authPromptVisible && (
        <div ref={authPromptRef}>
          <OAuthSignInPanel
            title="Sign in to finish export"
            description={
              authPromptMessage ??
              "Sign in with Google or GitHub to download or publish from this QR workspace."
            }
            className="border-sky-200 bg-sky-50/50"
            onBeforeSignIn={onBeforeSignIn}
          />
        </div>
      )}

      <HistoryPanel
        title="History"
        entries={historyEntries}
        source={historySource}
        description={
          historySource === "account"
            ? "Your workspace's most recent QR codes."
            : "Recent QR codes from this device."
        }
        onClear={onClearHistory}
        footer={
          historySource === "local" ? (
            <p className="mt-3 text-xs leading-5 text-slate-500">
              This history lives in this browser. Sign in to keep your QR
              codes in your workspace.
            </p>
          ) : null
        }
      />

      <BuilderActionBar
        desktop={
          <>
            <Button variant="secondary" onClick={onBack}>
              Back to design
            </Button>
            <Button
              variant="primary"
              onClick={handleDownloadSelected}
              disabled={!isReady || isCheckingAuth || !canUsePayload}
              isLoading={isCheckingAuth}
              leftIcon={<Download className="h-4 w-4" aria-hidden="true" />}
            >
              Download {selectedExport.label}
            </Button>
          </>
        }
        desktopClassName="sm:justify-between"
        mobile={
          <div className="grid grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] gap-2">
            <Button variant="secondary" onClick={onBack} className="w-full">
              Back
            </Button>
            <Button
              variant="primary"
              onClick={handleDownloadSelected}
              disabled={!isReady || isCheckingAuth || !canUsePayload}
              isLoading={isCheckingAuth}
              className="w-full"
              leftIcon={<Download className="h-4 w-4" aria-hidden="true" />}
            >
              Download {selectedExport.label}
            </Button>
          </div>
        }
      />
    </div>
  );
}
