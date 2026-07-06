"use client";

import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { useToolHistory } from "@/components/history/useToolHistory";
import { useQRCode, type QROptions } from "@/hooks/useQRCode";
import { getFreshClientSession } from "@/lib/client-auth";
import type { ToolHistoryEntry } from "@/lib/history/types";
import { getAdaptiveErrorCorrectionLevel } from "@/lib/qr/error-correction";
import { addSearchParams, sanitizeReturnTo } from "@/lib/redirects";
import {
  defaultLogoSizeRatio,
  designPresets,
  initialDesignState,
  initialFormState,
  isDynamicCapableType,
  qrGeneratorAuthDraftStorageKey,
  workflowStepOrder,
} from "./constants";
import { getApiDesign, getCornerSquareType, getSafeHex } from "./design";
import { readQRGeneratorAuthDraft } from "./draft";
import { createLogoPresetDataUrl, getLogoChoiceOptions, logoPresetOptions } from "./logos";
import { getTypeLabel } from "./labels";
import {
  buildApiContent,
  buildPayload,
  getDynamicPublishSignature,
} from "./payload";
import { getScanability } from "./scanability";
import { normalizeHttpUrl, validateContent } from "./validation";
import type {
  ApiResponse,
  ClientAuthState,
  DesignPreset,
  DesignState,
  ErrorCorrectionLevel,
  ErrorCorrectionSource,
  ExportFormat,
  FormState,
  LogoChoiceValue,
  PublishedDynamicPayload,
  QRGeneratorAuthDraft,
  QRMode,
  QRType,
  RenderSavedQRCodeResponse,
  WorkflowStep,
} from "./types";

interface UseQRGeneratorOptions {
  readonly initialMode: QRMode;
  readonly returnTo: string | null;
}

export function useQRGenerator({ initialMode, returnTo }: UseQRGeneratorOptions) {
  const router = useRouter();
  const history = useToolHistory("generate", {
    loadAccountEntries: loadSavedQRCodeHistory,
  });
  const [currentStep, setCurrentStep] = useState<WorkflowStep>("content");
  const [mode, setMode] = useState<QRMode>(initialMode);
  const [type, setType] = useState<QRType>("url");
  const [form, setForm] = useState<FormState>(initialFormState);
  const [design, setDesign] = useState<DesignState>(initialDesignState);
  const [ecSource, setEcSource] = useState<ErrorCorrectionSource>("auto");
  const [selectedPreset, setSelectedPreset] = useState<DesignPreset>("clean");
  const [logoUrl, setLogoUrl] = useState("");
  const [logoChoice, setLogoChoice] = useState<LogoChoiceValue>("none");
  const [copied, setCopied] = useState(false);
  const [publishStatus, setPublishStatus] = useState<string | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [savedQRCodeId, setSavedQRCodeId] = useState<string | null>(null);
  const [publishedDynamicPayload, setPublishedDynamicPayload] =
    useState<PublishedDynamicPayload | null>(null);
  const [authPromptVisible, setAuthPromptVisible] = useState(false);
  const [authPromptMessage, setAuthPromptMessage] = useState<string | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(false);
  const [authState, setAuthState] = useState<ClientAuthState>("checking");
  const [draftNotice, setDraftNotice] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const builderPanelRef = useRef<HTMLElement>(null);
  const builderTopRef = useRef<HTMLDivElement>(null);
  const stepHeadingRef = useRef<HTMLHeadingElement>(null);
  const previousStepRef = useRef(currentStep);
  const logoSelectionRequestRef = useRef(0);
  const safeReturnTo = returnTo ? sanitizeReturnTo(returnTo, "/landing-pages") : null;

  const refreshAuthSession = useCallback(async () => {
    const session = await getFreshClientSession();

    if (session?.user) {
      setAuthState("authenticated");
      setAuthPromptVisible(false);
      setAuthPromptMessage(null);
      return session;
    }

    setAuthState("anonymous");
    return null;
  }, []);

  const validation = useMemo(
    () => validateContent({ type, mode, form }),
    [type, mode, form]
  );
  // Adaptive error correction: derive from mode/logo/content length. For the
  // payload length we build the static payload with neutral publish inputs —
  // dynamic codes resolve to H regardless, which breaks the memo cycle with
  // the publish signature below.
  const autoErrorCorrectionLevel = useMemo(() => {
    const staticPayloadLength =
      mode === "dynamic"
        ? 0
        : buildPayload({ type, mode, form })?.value.length ?? 0;

    return getAdaptiveErrorCorrectionLevel({
      isDynamic: mode === "dynamic",
      hasLogo: Boolean(logoUrl),
      payloadLength: staticPayloadLength,
    });
  }, [mode, type, form, logoUrl]);
  // The design that previews, scanability, and API payloads all consume.
  // "auto" applies the adaptive level; "user" keeps the explicit choice.
  const resolvedDesign = useMemo<DesignState>(
    () =>
      ecSource === "user"
        ? design
        : { ...design, errorCorrectionLevel: autoErrorCorrectionLevel },
    [design, ecSource, autoErrorCorrectionLevel]
  );
  const dynamicPublishSignature = useMemo(
    () =>
      getDynamicPublishSignature({ type, form, design: resolvedDesign, logoUrl }),
    [type, form, resolvedDesign, logoUrl]
  );
  const payload = useMemo(
    () =>
      buildPayload({
        type,
        mode,
        form,
        publishedDynamicPayload,
        dynamicPublishSignature,
      }),
    [type, mode, form, publishedDynamicPayload, dynamicPublishSignature]
  );
  const renderableDesign = useMemo(
    () => ({
      ...resolvedDesign,
      foregroundColor: getSafeHex(
        resolvedDesign.foregroundColor,
        initialDesignState.foregroundColor
      ),
      backgroundColor: getSafeHex(
        resolvedDesign.backgroundColor,
        initialDesignState.backgroundColor
      ),
      frameColor: getSafeHex(
        resolvedDesign.frameColor,
        initialDesignState.frameColor
      ),
    }),
    [resolvedDesign]
  );
  const scanability = useMemo(
    () => getScanability({ design: resolvedDesign, hasLogo: Boolean(logoUrl) }),
    [resolvedDesign, logoUrl]
  );
  const logoChoices = useMemo(
    () => getLogoChoiceOptions(type, logoChoice),
    [type, logoChoice]
  );
  const stepIndex = workflowStepOrder.indexOf(currentStep);
  const previewValue = useMemo(() => {
    if (payload?.value) return payload.value;

    if (mode === "dynamic" && type === "url" && validation.isValid) {
      try {
        return normalizeHttpUrl(form.url);
      } catch {
        return "";
      }
    }

    return "";
  }, [form.url, mode, payload?.value, type, validation.isValid]);
  const hasPreviewPayload = Boolean(previewValue);
  const qrOptions = useMemo<QROptions>(
    () => ({
      data: previewValue,
      width: renderableDesign.size,
      height: renderableDesign.size,
      margin: renderableDesign.margin,
      dotsColor: renderableDesign.foregroundColor,
      backgroundColor: renderableDesign.backgroundColor,
      dotsType: renderableDesign.dotStyle,
      cornersSquareType: getCornerSquareType(renderableDesign.cornerStyle),
      cornersDotType: renderableDesign.cornerStyle === "dot" ? "dot" : "square",
      errorCorrectionLevel: renderableDesign.errorCorrectionLevel,
      logoUrl,
      logoSize: logoUrl ? renderableDesign.logoSizeRatio : 0,
      containerKey: renderableDesign.frameStyle,
    }),
    [
      previewValue,
      renderableDesign.size,
      renderableDesign.margin,
      renderableDesign.foregroundColor,
      renderableDesign.backgroundColor,
      renderableDesign.dotStyle,
      renderableDesign.cornerStyle,
      renderableDesign.errorCorrectionLevel,
      renderableDesign.frameStyle,
      logoUrl,
      renderableDesign.logoSizeRatio,
    ]
  );
  const mobileQrOptions = useMemo<QROptions>(
    () => ({ ...qrOptions, width: 256, height: 256 }),
    [qrOptions]
  );

  const { ref: qrRef, isReady } = useQRCode(qrOptions);
  const { ref: mobileQrRef, isReady: isMobilePreviewReady } =
    useQRCode(mobileQrOptions);

  useEffect(() => {
    const draft = readQRGeneratorAuthDraft();
    if (!draft) return;

    setCurrentStep(draft.currentStep);
    setMode(draft.mode);
    setType(draft.type);
    setForm(draft.form);
    setDesign(draft.design);
    setEcSource(draft.ecSource ?? "auto");
    setSelectedPreset(draft.selectedPreset);
    setLogoUrl(draft.logoUrl);
    setLogoChoice(draft.logoChoice);
    setDraftNotice("Restored your QR draft after sign-in.");
    window.localStorage.removeItem(qrGeneratorAuthDraftStorageKey);
  }, []);

  useEffect(() => {
    const handleFocus = () => {
      void refreshAuthSession();
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void refreshAuthSession();
      }
    };

    void refreshAuthSession();
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [refreshAuthSession]);

  useEffect(() => {
    if (previousStepRef.current === currentStep) return;

    previousStepRef.current = currentStep;
    builderPanelRef.current?.scrollTo({ top: 0 });
    builderTopRef.current?.scrollIntoView({ block: "start" });
    window.requestAnimationFrame(() => {
      stepHeadingRef.current?.focus({ preventScroll: true });
    });
  }, [currentStep]);

  useEffect(() => {
    if (!publishedDynamicPayload || !dynamicPublishSignature) return;
    if (publishedDynamicPayload.signature === dynamicPublishSignature) return;

    setPublishStatus(null);
  }, [publishedDynamicPayload, dynamicPublishSignature]);

  // When the content or design that produced a saved/published record changes,
  // clear the stale "saved" affordances so they don't point at the old code.
  // Publishing/saving does not mutate these inputs, so a successful result is
  // preserved until the user actually edits something.
  useEffect(() => {
    setSavedQRCodeId(null);
    setPublishStatus(null);
    setPublishError(null);
  }, [mode, type, form, resolvedDesign, logoUrl]);

  const goToStep = (nextStep: WorkflowStep) => {
    setCurrentStep(nextStep);
  };

  const handleStepSelect = (nextStepIndex: number) => {
    if (nextStepIndex > stepIndex) return;

    const nextStep = workflowStepOrder[nextStepIndex];
    if (nextStep) {
      goToStep(nextStep);
    }
  };

  const persistAuthDraft = () => {
    if (typeof window === "undefined") return;

    const draft: QRGeneratorAuthDraft = {
      version: 1,
      currentStep,
      mode,
      type,
      form,
      design,
      selectedPreset,
      logoUrl,
      logoChoice,
      ecSource,
    };

    // localStorage has a small quota (~5MB) and an uploaded logo data URL can be
    // large, so persisting may throw QuotaExceededError. Degrade gracefully:
    // retry without the logo, and never let a failed save break the sign-in flow.
    try {
      window.localStorage.setItem(
        qrGeneratorAuthDraftStorageKey,
        JSON.stringify(draft)
      );
      setDraftNotice("Your QR draft is saved in this browser before sign-in.");
    } catch {
      try {
        window.localStorage.setItem(
          qrGeneratorAuthDraftStorageKey,
          JSON.stringify({ ...draft, logoUrl: "", logoChoice: "none" })
        );
        setDraftNotice(
          "Your QR draft is saved in this browser, but the logo was too large to keep. Re-add it after signing in."
        );
      } catch {
        setDraftNotice(
          "We could not save your QR draft in this browser. Keep this tab open while you sign in."
        );
      }
    }
  };

  const handleFormChange = (key: keyof FormState, value: string | boolean) => {
    setForm((previous) => ({ ...previous, [key]: value }));
  };

  const handleModeChange = (nextMode: QRMode) => {
    setMode(nextMode);
    // Dynamic mode supports a subset of types (url, text, vcard). Keep the
    // current type when it is dynamic-capable; otherwise fall back to url.
    if (nextMode === "dynamic" && !isDynamicCapableType(type)) {
      setType("url");
    }
  };

  const handlePresetChange = (nextPreset: DesignPreset) => {
    setSelectedPreset(nextPreset);

    if (nextPreset === "custom") return;

    setDesign((previous) => ({ ...previous, ...designPresets[nextPreset] }));
  };

  const handleDesignChange: Dispatch<SetStateAction<DesignState>> = (
    nextDesign
  ) => {
    setSelectedPreset("custom");
    setDesign(nextDesign);
  };

  const handleResetDesign = () => {
    setSelectedPreset("clean");
    setLogoUrl("");
    setLogoChoice("none");
    setDesign(initialDesignState);
    setEcSource("auto");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleErrorCorrectionChange = (
    level: ErrorCorrectionLevel | "auto"
  ) => {
    if (level === "auto") {
      setEcSource("auto");
      return;
    }

    setEcSource("user");
    setSelectedPreset("custom");
    setDesign((previous) => ({ ...previous, errorCorrectionLevel: level }));
  };

  const applyLogoSafeDesign = () => {
    setDesign((previous) => ({
      ...previous,
      logoSizeRatio:
        previous.logoSizeRatio > 0 ? previous.logoSizeRatio : defaultLogoSizeRatio,
    }));
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const requestId = ++logoSelectionRequestRef.current;
    setSelectedPreset("custom");
    setLogoChoice("upload");
    const reader = new FileReader();
    reader.onloadend = () => {
      if (logoSelectionRequestRef.current === requestId) {
        setLogoUrl(reader.result as string);
      }
    };
    reader.readAsDataURL(file);
    applyLogoSafeDesign();
  };

  const handleRemoveLogo = () => {
    logoSelectionRequestRef.current += 1;
    setSelectedPreset("custom");
    setLogoUrl("");
    setLogoChoice("none");
    setDesign((previous) => ({ ...previous, logoSizeRatio: 0 }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleLogoChoiceChange = async (nextChoice: LogoChoiceValue) => {
    setSelectedPreset("custom");

    if (nextChoice === "upload") return;

    if (nextChoice === "none") {
      handleRemoveLogo();
      return;
    }

    const option = logoPresetOptions.find((item) => item.value === nextChoice);
    if (!option) return;

    const requestId = ++logoSelectionRequestRef.current;
    setLogoChoice(nextChoice);
    const nextLogoUrl = await createLogoPresetDataUrl(option);
    if (logoSelectionRequestRef.current !== requestId) return;

    setLogoUrl(nextLogoUrl);
    applyLogoSafeDesign();
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleCopyPayload = async () => {
    if (!payload?.value) {
      setPublishError(
        "Publish to assign public link before copying the dynamic QR payload."
      );
      return;
    }

    await navigator.clipboard.writeText(payload.value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleContinueToDesign = () => {
    if (!validation.isValid) return;
    goToStep("design");
  };

  // Static (and anonymous) downloads render through the same server SVG pipeline
  // as saved/dynamic codes, so the frame and frame color are baked into the
  // exported file exactly as shown in the preview.
  const downloadStaticQRCode = async (format: ExportFormat) => {
    const value = payload?.value;
    if (!value) {
      throw new Error("Add content before downloading this QR code.");
    }

    const response = await fetch("/api/qr-codes/render", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        value,
        title: form.title || "Decode QR Code",
        format,
        design: getApiDesign(resolvedDesign, logoUrl),
      }),
    });
    const result = (await response.json()) as ApiResponse<{
      base64: string;
      contentType: string;
      extension: string;
    }>;

    if (!result.ok || !result.data) {
      throw new Error(result.error?.message ?? "Could not render QR code export.");
    }

    triggerBase64Download({
      base64: result.data.base64,
      contentType: result.data.contentType,
      fileName: `${form.title || "Decode QR Code"}.${result.data.extension}`,
    });
  };

  const downloadSavedDynamicQRCode = async ({
    qrCodeId,
    format,
  }: {
    readonly qrCodeId: string;
    readonly format: ExportFormat;
  }) => {
    const response = await fetch(
      `/api/qr-codes/${encodeURIComponent(qrCodeId)}/render`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ format }),
      }
    );
    const result = (await response.json()) as ApiResponse<RenderSavedQRCodeResponse>;

    if (!result.ok) {
      throw new Error(result.error?.message ?? "Could not render QR code export.");
    }

    if (!result.data?.downloadUrl) {
      throw new Error("The rendered QR export did not include a download URL.");
    }

    const link = document.createElement("a");
    link.href = result.data.downloadUrl;
    link.rel = "noopener noreferrer";
    link.download = `${form.title || "Decode QR Code"}.${format}`;
    document.body.append(link);
    link.click();
    link.remove();
  };

  const handleDownloadSelected = async (format: ExportFormat) => {
    if (!isReady) return;

    if (!payload?.value) {
      setPublishError(
        "Publish to assign public link before downloading this dynamic QR."
      );
      setPublishStatus(null);
      return;
    }

    // Static QR codes encode their content directly — no account is required.
    // Download instantly from the client renderer for the smoothest path.
    if (mode !== "dynamic") {
      setPublishError(null);
      try {
        await downloadStaticQRCode(format);
        history.append({
          title: form.title || "Decode QR Code",
          subtitle: `${getTypeLabel(type)} · ${format.toUpperCase()} download`,
          dedupeKey: `download:${payload.value}:${format}`,
        });
      } catch (error) {
        setPublishError(
          error instanceof Error ? error.message : "Could not download QR code."
        );
      }
      return;
    }

    // Dynamic downloads come from the server renderer (styled + cached) and
    // require a published record, which in turn requires sign-in.
    setIsCheckingAuth(true);
    setPublishError(null);

    try {
      const session = await refreshAuthSession();

      if (!session?.user) {
        persistAuthDraft();
        setAuthPromptVisible(true);
        setAuthPromptMessage(
          `Sign in to download the ${format.toUpperCase()} export. Your current QR draft is saved in this browser.`
        );
        return;
      }

      setAuthPromptVisible(false);
      setAuthPromptMessage(null);

      if (!publishedDynamicPayload?.qrCodeId) {
        throw new Error("Publish this dynamic QR before downloading it.");
      }

      await downloadSavedDynamicQRCode({
        qrCodeId: publishedDynamicPayload.qrCodeId,
        format,
      });
      history.append({
        title: form.title || "Dynamic QR Code",
        subtitle: `Dynamic · ${format.toUpperCase()} download`,
        href: `/dashboard/qr/${publishedDynamicPayload.qrCodeId}`,
        dedupeKey: `download:${publishedDynamicPayload.qrCodeId}:${format}`,
      });
      setPublishStatus(`Download ready for ${format.toUpperCase()} export.`);
    } catch (error) {
      if (error instanceof Error && error.message.toLowerCase().includes("sign in")) {
        persistAuthDraft();
        setAuthPromptVisible(true);
        setAuthPromptMessage(
          "We could not confirm your sign-in state. Sign in again to continue the download."
        );
      } else {
        setPublishError(
          error instanceof Error ? error.message : "Could not download QR code."
        );
      }
    } finally {
      setIsCheckingAuth(false);
    }
  };

  const handlePublishDynamic = async () => {
    if (mode !== "dynamic" || !isDynamicCapableType(type) || !validation.isValid) {
      return;
    }

    if (scanability.blocksPublish) {
      setPublishError("Resolve blocked scanability issues before publishing.");
      setPublishStatus(null);
      return;
    }

    setIsPublishing(true);
    setPublishError(null);
    setPublishStatus(null);

    try {
      const response = await fetch("/api/qr-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "dynamic",
          type,
          title: form.title || "Dynamic QR Code",
          save: true,
          content: buildApiContent(type, form),
          design: getApiDesign(resolvedDesign, logoUrl),
        }),
      });
      const result = (await response.json()) as ApiResponse<{
        qrCode: {
          id: string;
          slug: string | null;
          redirectUrl?: string | null;
          destinationUrl?: string | null;
        };
        payload: {
          value: string;
          destinationUrl?: string;
        };
      }>;

      if (!result.ok) {
        if (response.status === 401) {
          persistAuthDraft();
          setAuthPromptVisible(true);
          setAuthPromptMessage(
            "Sign in to publish this dynamic QR. Your current QR draft is saved in this browser."
          );
          return;
        }

        throw new Error(result.error?.message ?? "Could not publish QR code.");
      }

      const qrCodeId = result.data?.qrCode.id;
      const payloadValue = result.data?.payload.value;
      // Only url dynamics carry an external destination; text/vcard are hosted.
      const destinationUrl = result.data?.payload.destinationUrl ?? "";

      if (!qrCodeId || !payloadValue || !dynamicPublishSignature) {
        throw new Error("Published QR response did not include a public payload.");
      }

      setPublishedDynamicPayload({
        qrCodeId,
        slug: result.data?.qrCode.slug ?? null,
        payloadValue,
        destinationUrl,
        signature: dynamicPublishSignature,
      });
      history.append({
        title: form.title || "Dynamic QR Code",
        subtitle: "Published dynamic QR",
        href: `/dashboard/qr/${qrCodeId}`,
        dedupeKey: qrCodeId,
      });
      setAuthState("authenticated");
      setAuthPromptVisible(false);
      setAuthPromptMessage(null);
      setPublishStatus(`Published dynamic QR: ${payloadValue}`);

      if (safeReturnTo) {
        router.push(
          addSearchParams(safeReturnTo, { qrCodeId, qrCreated: "1" })
        );
      }
    } catch (error) {
      setPublishError(
        error instanceof Error ? error.message : "Could not publish QR code."
      );
    } finally {
      setIsPublishing(false);
    }
  };

  const handleSaveStatic = async () => {
    if (mode !== "static" || !validation.isValid) return;

    if (scanability.blocksPublish) {
      setPublishError("Resolve blocked scanability issues before saving.");
      setPublishStatus(null);
      return;
    }

    setIsPublishing(true);
    setPublishError(null);
    setPublishStatus(null);

    try {
      const response = await fetch("/api/qr-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "static",
          type,
          title: form.title || `${getTypeLabel(type)} QR Code`,
          save: true,
          content: buildApiContent(type, form),
          design: getApiDesign(resolvedDesign, logoUrl),
        }),
      });
      const result = (await response.json()) as ApiResponse<{
        qrCode: { id: string } | null;
      }>;

      if (!result.ok) {
        if (response.status === 401) {
          persistAuthDraft();
          setAuthPromptVisible(true);
          setAuthPromptMessage(
            "Sign in to save this QR code to your workspace. Your current QR draft is saved in this browser."
          );
          return;
        }

        throw new Error(result.error?.message ?? "Could not save QR code.");
      }

      const savedId = result.data?.qrCode?.id ?? null;
      setSavedQRCodeId(savedId);
      if (savedId) {
        history.append({
          title: form.title || `${getTypeLabel(type)} QR Code`,
          subtitle: "Saved to workspace",
          href: `/dashboard/qr/${savedId}`,
          dedupeKey: savedId,
        });
      }
      setAuthState("authenticated");
      setAuthPromptVisible(false);
      setAuthPromptMessage(null);
      setPublishStatus("Saved to your workspace.");
    } catch (error) {
      setPublishError(
        error instanceof Error ? error.message : "Could not save QR code."
      );
    } finally {
      setIsPublishing(false);
    }
  };

  return {
    // step + mode/content state
    currentStep,
    stepIndex,
    mode,
    type,
    form,
    design,
    ecSource,
    effectiveErrorCorrectionLevel: resolvedDesign.errorCorrectionLevel,
    selectedPreset,
    logoUrl,
    logoChoice,
    // derived
    validation,
    payload,
    renderableDesign,
    scanability,
    logoChoices,
    previewValue,
    hasPreviewPayload,
    // export/publish state
    copied,
    publishStatus,
    publishError,
    isPublishing,
    savedQRCodeId,
    authState,
    authPromptVisible,
    authPromptMessage,
    isCheckingAuth,
    draftNotice,
    // renderer
    qrRef,
    mobileQrRef,
    isReady,
    isMobilePreviewReady,
    // refs
    fileInputRef,
    builderPanelRef,
    builderTopRef,
    stepHeadingRef,
    // handlers
    setType,
    goToStep,
    handleStepSelect,
    handleModeChange,
    handleFormChange,
    handleContinueToDesign,
    handlePresetChange,
    handleDesignChange,
    handleErrorCorrectionChange,
    handleLogoChoiceChange,
    handleLogoUpload,
    handleRemoveLogo,
    handleResetDesign,
    handleCopyPayload,
    handleDownloadSelected,
    handlePublishDynamic,
    handleSaveStatic,
    persistAuthDraft,
    // history
    history,
  };
}

// Account-backed history for signed-in users: the workspace's most recent
// saved QR codes, read from the same API the dashboard uses. Anonymous
// visitors (or a failed load) keep the device-local history instead.
async function loadSavedQRCodeHistory(): Promise<
  readonly ToolHistoryEntry[] | null
> {
  const session = await getFreshClientSession();
  if (!session?.user) return null;

  const response = await fetch("/api/qr-codes?take=10", {
    cache: "no-store",
    credentials: "include",
  });
  if (!response.ok) return null;

  const result = (await response.json()) as ApiResponse<{
    qrCodes?: readonly Record<string, unknown>[];
  }>;
  if (!result.ok || !Array.isArray(result.data?.qrCodes)) return null;

  return result.data.qrCodes.flatMap((row) => {
    if (typeof row.id !== "string" || row.id.length === 0) return [];

    const createdAt =
      typeof row.createdAt === "string" ? row.createdAt : new Date().toISOString();
    const mode = typeof row.mode === "string" ? row.mode : "static";
    const type = typeof row.type === "string" ? row.type : "url";

    return [
      {
        id: row.id,
        tool: "generate" as const,
        at: createdAt,
        title:
          typeof row.title === "string" && row.title.length > 0
            ? row.title
            : "Untitled QR code",
        subtitle: `${mode === "dynamic" ? "Dynamic" : "Static"} · ${type}`,
        href: `/dashboard/qr/${row.id}`,
      },
    ];
  });
}

function triggerBase64Download({
  base64,
  contentType,
  fileName,
}: {
  readonly base64: string;
  readonly contentType: string;
  readonly fileName: string;
}) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  const blob = new Blob([bytes], { type: contentType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.rel = "noopener noreferrer";
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
