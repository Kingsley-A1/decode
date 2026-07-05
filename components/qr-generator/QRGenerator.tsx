"use client";

import { X } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import {
  Alert,
  Badge,
  IconButton,
  MobilePreviewTray,
  ProgressStepper,
  QRPreviewPanel,
} from "@/components/ui";
import { workflowSteps } from "./constants";
import { QRFrame } from "./frame";
import { getTypeLabel } from "./labels";
import { QRPayloadPlaceholder } from "./placeholders";
import { getScanabilityBadgeVariant } from "./scanability";
import { ContentStep } from "./steps/ContentStep";
import { DesignStep } from "./steps/DesignStep";
import { ExportStep } from "./steps/ExportStep";
import { useQRGenerator } from "./useQRGenerator";
import type { QRGeneratorProps } from "./types";

export function QRGenerator({
  showHeader = true,
  initialMode = "static",
  returnTo = null,
}: QRGeneratorProps) {
  const builder = useQRGenerator({ initialMode, returnTo });
  const {
    currentStep,
    stepIndex,
    mode,
    type,
    form,
    design,
    ecSource,
    effectiveErrorCorrectionLevel,
    selectedPreset,
    logoUrl,
    logoChoice,
    validation,
    payload,
    renderableDesign,
    scanability,
    logoChoices,
    hasPreviewPayload,
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
    qrRef,
    mobileQrRef,
    isReady,
    isMobilePreviewReady,
    fileInputRef,
    builderPanelRef,
    builderTopRef,
    stepHeadingRef,
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
    history,
  } = builder;

  return (
    <div className="space-y-4">
      {showHeader && (
        <PageHeader
          title="QR Generator"
          subtitle="Create static QR codes now, or prepare dynamic QR codes for editable destinations."
        />
      )}

      <MobilePreviewTray
        title={`${mode === "dynamic" ? "Dynamic" : "Static"} / ${getTypeLabel(type)}`}
        summary={payload?.summary ?? "Complete content to preview the payload."}
        preview={
          hasPreviewPayload ? (
            <div
              ref={mobileQrRef}
              className="w-full overflow-hidden rounded-md [&_canvas]:!h-auto [&_canvas]:!w-full"
            />
          ) : (
            <QRPayloadPlaceholder mode={mode} compact />
          )
        }
        status={{
          label: scanability.label,
          variant: getScanabilityBadgeVariant(scanability.state),
        }}
        isLoading={hasPreviewPayload && !isMobilePreviewReady}
        data-testid="mobile-preview-tray"
      />

      {draftNotice && (
        <Alert variant="success" title="Draft preserved">
          {draftNotice}
        </Alert>
      )}

      <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,65fr)_minmax(320px,30fr)] xl:items-start">
        <section
          ref={builderPanelRef}
          className="min-w-0 space-y-5 xl:pr-2"
          data-testid="qr-builder-panel"
        >
          <div ref={builderTopRef} className="min-w-0 scroll-mt-28">
            <ProgressStepper
              steps={workflowSteps}
              currentStep={Math.max(stepIndex, 0)}
              onStepSelect={handleStepSelect}
            />
          </div>

          {currentStep === "content" && (
            <ContentStep
              headingRef={stepHeadingRef}
              mode={mode}
              type={type}
              form={form}
              validationErrors={validation.errors}
              onModeChange={handleModeChange}
              onTypeChange={setType}
              onFormChange={handleFormChange}
              onContinue={handleContinueToDesign}
            />
          )}

          {currentStep === "design" && (
            <DesignStep
              headingRef={stepHeadingRef}
              design={design}
              ecSource={ecSource}
              effectiveErrorCorrectionLevel={effectiveErrorCorrectionLevel}
              logoUrl={logoUrl}
              logoChoice={logoChoice}
              logoChoices={logoChoices}
              selectedPreset={selectedPreset}
              scanability={scanability}
              onPresetChange={handlePresetChange}
              onDesignChange={handleDesignChange}
              onErrorCorrectionChange={handleErrorCorrectionChange}
              onLogoChoiceChange={handleLogoChoiceChange}
              onLogoUpload={handleLogoUpload}
              onRemoveLogo={handleRemoveLogo}
              onResetDesign={handleResetDesign}
              logoInputRef={fileInputRef}
              onBack={() => goToStep("content")}
              onContinue={() => goToStep("export")}
            />
          )}

          {currentStep === "export" && (
            <ExportStep
              headingRef={stepHeadingRef}
              mode={mode}
              type={type}
              form={form}
              payload={payload}
              design={design}
              scanability={scanability}
              isReady={isReady}
              copied={copied}
              publishStatus={publishStatus}
              publishError={publishError}
              isPublishing={isPublishing}
              authPromptVisible={authPromptVisible && authState !== "authenticated"}
              authPromptMessage={authPromptMessage}
              isCheckingAuth={isCheckingAuth}
              onBack={() => goToStep("design")}
              onCopyPayload={handleCopyPayload}
              onDownloadSelected={(format) => void handleDownloadSelected(format)}
              onPublishDynamic={handlePublishDynamic}
              onSaveStatic={handleSaveStatic}
              savedQRCodeId={savedQRCodeId}
              onBeforeSignIn={persistAuthDraft}
              historyEntries={history.entries}
              historySource={history.source}
              onClearHistory={history.clear}
            />
          )}
        </section>

        <aside className="hidden min-w-0 xl:block xl:self-start">
          <div className="sticky top-24 space-y-3">
            <QRPreviewPanel
              isLoading={hasPreviewPayload && !isReady}
              variant="bare"
              previewClassName="max-w-[300px] rounded-none p-4 shadow-[0_12px_36px_rgba(15,23,42,0.08)]"
            >
              {hasPreviewPayload ? (
                <QRFrame
                  key={design.frameStyle}
                  frameStyle={design.frameStyle}
                  frameColor={renderableDesign.frameColor}
                  title={form.title}
                >
                  <div
                    ref={qrRef}
                    className="w-full overflow-hidden [&_canvas]:!h-auto [&_canvas]:!w-full"
                  />
                </QRFrame>
              ) : (
                <QRPayloadPlaceholder mode={mode} />
              )}
              {logoUrl && (
                <IconButton
                  onClick={handleRemoveLogo}
                  aria-label="Remove QR logo"
                  variant="danger"
                  className="absolute right-6 top-6 h-9 w-9 rounded-full"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </IconButton>
              )}
            </QRPreviewPanel>

            <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={mode === "dynamic" ? "info" : "neutral"}>
                  {mode === "dynamic" ? "Dynamic" : "Static"}
                </Badge>
                <Badge variant="neutral">{getTypeLabel(type)}</Badge>
                {mode === "dynamic" && payload?.requiresPublish && (
                  <Badge variant="warning">Preview only</Badge>
                )}
                <Badge variant={getScanabilityBadgeVariant(scanability.state)}>
                  {scanability.label}
                </Badge>
              </div>
              <p className="mt-3 break-all text-sm leading-6 text-slate-600">
                {payload?.summary ?? "Complete the content step to preview payload."}
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
