import { useState } from "react";
import { FileDown, Palette, X } from "lucide-react";
import {
  BuilderActionBar,
  Button,
  ChoiceRail,
  ColorInput,
  ColorSwatch,
  DisclosureSection,
  FileUpload,
  Select,
  Slider,
  Tabs,
} from "@/components/ui";
import {
  backgroundColorPresets,
  colorPresets,
  cornerStyleOptions,
  designPresetOptions,
  dotStyleOptions,
  errorCorrectionOptions,
  maxLogoSizeRatio,
  maxMargin,
  minLogoSizeRatio,
  minMargin,
} from "../constants";
import { normalizeHexDraft } from "../design";
import { FramePicker } from "../frame";
import { LogoChoicePreview, ScanabilityMeter } from "../placeholders";
import type {
  DesignPreset,
  DesignState,
  DesignTab,
  ErrorCorrectionLevel,
  ErrorCorrectionSource,
  LogoChoiceOption,
  LogoChoiceValue,
  ScanabilityResult,
} from "../types";

export function DesignStep({
  headingRef,
  design,
  ecSource,
  effectiveErrorCorrectionLevel,
  logoUrl,
  logoChoice,
  logoChoices,
  selectedPreset,
  scanability,
  logoInputRef,
  onPresetChange,
  onDesignChange,
  onErrorCorrectionChange,
  onLogoChoiceChange,
  onLogoUpload,
  onRemoveLogo,
  onResetDesign,
  onBack,
  onContinue,
}: {
  readonly headingRef: React.RefObject<HTMLHeadingElement | null>;
  readonly design: DesignState;
  readonly ecSource: ErrorCorrectionSource;
  readonly effectiveErrorCorrectionLevel: ErrorCorrectionLevel;
  readonly logoUrl: string;
  readonly logoChoice: LogoChoiceValue;
  readonly logoChoices: readonly LogoChoiceOption[];
  readonly selectedPreset: DesignPreset;
  readonly scanability: ScanabilityResult;
  readonly logoInputRef: React.RefObject<HTMLInputElement | null>;
  readonly onPresetChange: (preset: DesignPreset) => void;
  readonly onDesignChange: React.Dispatch<React.SetStateAction<DesignState>>;
  readonly onErrorCorrectionChange: (
    level: ErrorCorrectionLevel | "auto"
  ) => void;
  readonly onLogoChoiceChange: (value: LogoChoiceValue) => void;
  readonly onLogoUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  readonly onRemoveLogo: () => void;
  readonly onResetDesign: () => void;
  readonly onBack: () => void;
  readonly onContinue: () => void;
}) {
  const shouldOpenAdvanced = scanability.state !== "ready";
  const [activeDesignTab, setActiveDesignTab] = useState<DesignTab>("preset");
  const hasLogo = Boolean(logoUrl);
  const designTabItems = [
    {
      value: "preset",
      label: "Template preset",
      panel: (
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <ChoiceRail
            value={selectedPreset}
            options={designPresetOptions}
            onChange={onPresetChange}
            label="Template preset"
            size="md"
            desktopColumns={4}
            getDescription={(option) => (
              <>
                <span className="font-medium text-slate-800">
                  {option.label}:
                </span>{" "}
                {option.description}
              </>
            )}
          />
        </section>
      ),
    },
    {
      value: "frame",
      label: "QR frame",
      panel: (
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <FramePicker
            value={design.frameStyle}
            frameColor={design.frameColor}
            onChange={(value) =>
              onDesignChange((previous) => ({ ...previous, frameStyle: value }))
            }
          />
        </section>
      ),
    },
    {
      value: "color",
      label: "Color",
      panel: (
        <section className="space-y-5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-5 lg:grid-cols-2">
            <ColorInput
              pickerLabel="Frame"
              label="Frame color hex"
              value={design.frameColor}
              onChange={(value) =>
                onDesignChange((previous) => ({
                  ...previous,
                  frameColor: normalizeHexDraft(value),
                }))
              }
              hint="Styles the frame border, label bar, and call-to-action."
            />
            <ColorInput
              pickerLabel="Background"
              label="Background color hex"
              value={design.backgroundColor}
              onChange={(value) =>
                onDesignChange((previous) => ({
                  ...previous,
                  backgroundColor: normalizeHexDraft(value),
                }))
              }
              hint="Sets the QR canvas behind the modules."
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-2">
              <p className="flex items-center gap-2 text-sm font-medium text-slate-800">
                <Palette className="h-4 w-4" aria-hidden="true" />
                Frame presets
              </p>
              <div className="flex flex-wrap gap-2">
                {colorPresets.map((preset) => (
                  <ColorSwatch
                    key={preset.value}
                    color={preset.value}
                    label={`Use ${preset.name} frame color`}
                    isSelected={
                      design.frameColor.toLowerCase() ===
                      preset.value.toLowerCase()
                    }
                    onClick={() =>
                      onDesignChange((previous) => ({
                        ...previous,
                        frameColor: preset.value.toUpperCase(),
                      }))
                    }
                  />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-800">
                Background presets
              </p>
              <div className="flex flex-wrap gap-2">
                {backgroundColorPresets.map((preset) => (
                  <ColorSwatch
                    key={preset.value}
                    color={preset.value}
                    label={`Use ${preset.name} background color`}
                    isSelected={
                      design.backgroundColor.toLowerCase() ===
                      preset.value.toLowerCase()
                    }
                    onClick={() =>
                      onDesignChange((previous) => ({
                        ...previous,
                        backgroundColor: preset.value.toUpperCase(),
                      }))
                    }
                  />
                ))}
              </div>
            </div>
          </div>
        </section>
      ),
    },
    {
      value: "logo",
      label: "Logo",
      panel: (
        <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-end">
            <FileUpload
              id="qr-logo-upload"
              ref={logoInputRef}
              label="Logo"
              accept="image/*"
              onChange={onLogoUpload}
              hint="Upload a square PNG or SVG, or choose a preset icon below."
            />
            <Button
              variant="secondary"
              onClick={onRemoveLogo}
              disabled={!hasLogo}
              leftIcon={<X className="h-4 w-4" aria-hidden="true" />}
            >
              Remove logo
            </Button>
          </div>

          <ChoiceRail
            value={logoChoice}
            options={logoChoices}
            onChange={onLogoChoiceChange}
            label="Logo icon"
            size="icon"
            desktopColumns={4}
            data-testid="logo-choice-picker"
            railTestId="logo-choice-rail"
            renderPreview={(option) => <LogoChoicePreview option={option} />}
            getDescription={(option) => (
              <>
                <span className="font-medium text-slate-800">
                  {option.label}:
                </span>{" "}
                {option.description}
              </>
            )}
          />

          {hasLogo && (
            <Slider
              label="Logo size"
              min={minLogoSizeRatio}
              max={maxLogoSizeRatio}
              step={0.01}
              value={design.logoSizeRatio}
              valueLabel={`${Math.round(design.logoSizeRatio * 100)}%`}
              minLabel={`${Math.round(minLogoSizeRatio * 100)}%`}
              maxLabel={`${Math.round(maxLogoSizeRatio * 100)}%`}
              onChange={(event) =>
                onDesignChange((previous) => ({
                  ...previous,
                  logoSizeRatio: Number(event.target.value),
                }))
              }
            />
          )}
        </section>
      ),
    },
  ] satisfies {
    readonly value: DesignTab;
    readonly label: string;
    readonly panel: React.ReactNode;
  }[];

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2
            id="qr-step-design-heading"
            ref={headingRef}
            tabIndex={-1}
            className="scroll-mt-28 text-lg font-semibold text-slate-950 focus:outline-none"
          >
            2. Design and guardrails
          </h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Start with a safe preset, then refine only what matters.
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onResetDesign}
          className="self-start"
        >
          Reset design
        </Button>
      </div>

      <Tabs
        value={activeDesignTab}
        items={designTabItems}
        onChange={setActiveDesignTab}
        label="Design controls"
      />

      <ScanabilityMeter scanability={scanability} />

      <DisclosureSection
        title="Advanced design controls"
        description="QR module color, dots, corners, quiet zone, error correction, and export size."
        defaultOpen={shouldOpenAdvanced}
      >
        <div className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <ColorInput
              pickerLabel="Dots"
              label="QR dots hex"
              value={design.foregroundColor}
              onChange={(value) =>
                onDesignChange((previous) => ({
                  ...previous,
                  foregroundColor: normalizeHexDraft(value),
                }))
              }
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <ChoiceRail
              value={design.dotStyle}
              options={dotStyleOptions}
              onChange={(value) =>
                onDesignChange((previous) => ({
                  ...previous,
                  dotStyle: value,
                }))
              }
              label="Dot style"
              size="sm"
              desktopColumns={3}
            />
            <ChoiceRail
              value={design.cornerStyle}
              options={cornerStyleOptions}
              onChange={(value) =>
                onDesignChange((previous) => ({
                  ...previous,
                  cornerStyle: value,
                }))
              }
              label="Corner style"
              size="sm"
              desktopColumns={3}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Select
              label="Error correction"
              value={ecSource === "auto" ? "auto" : design.errorCorrectionLevel}
              onChange={(event) =>
                onErrorCorrectionChange(
                  event.target.value as ErrorCorrectionLevel | "auto"
                )
              }
              hint="Auto picks High (30%) for dynamic codes, logos, and short content. Higher correction recovers more if the QR is covered or damaged."
            >
              <option value="auto">
                Auto — {getErrorCorrectionLabel(effectiveErrorCorrectionLevel)}
              </option>
              {errorCorrectionOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
            <Select
              label="Export size"
              value={String(design.size)}
              onChange={(event) =>
                onDesignChange((previous) => ({
                  ...previous,
                  size: Number(event.target.value),
                }))
              }
              hint="PNG and PDF exports use this source size."
            >
              <option value="512">512 x 512</option>
              <option value="1024">1024 x 1024</option>
              <option value="2048">2048 x 2048</option>
            </Select>
          </div>

          <Slider
            label="Quiet zone (margin)"
            min={minMargin}
            max={maxMargin}
            step={1}
            value={design.margin}
            valueLabel={`${design.margin}`}
            minLabel="None"
            maxLabel="Wide"
            onChange={(event) =>
              onDesignChange((previous) => ({
                ...previous,
                margin: Number(event.target.value),
              }))
            }
          />
        </div>
      </DisclosureSection>

      <BuilderActionBar
        desktop={
          <>
            <Button variant="secondary" onClick={onBack}>
              Back to content
            </Button>
            <Button
              variant="primary"
              onClick={onContinue}
              rightIcon={<FileDown className="h-4 w-4" aria-hidden="true" />}
            >
              Continue to export
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
              onClick={onContinue}
              className="w-full"
              rightIcon={<FileDown className="h-4 w-4" aria-hidden="true" />}
            >
              Continue
            </Button>
          </div>
        }
      />
    </div>
  );
}

function getErrorCorrectionLabel(level: ErrorCorrectionLevel): string {
  return (
    errorCorrectionOptions.find((option) => option.value === level)?.label ??
    level
  );
}
