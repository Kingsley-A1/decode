import {
  designPresetOptions,
  initialDesignState,
  initialFormState,
  qrGeneratorAuthDraftStorageKey,
  typeOptions,
} from "./constants";
import { logoPresetOptions } from "./logos";
import type {
  DesignPreset,
  DesignState,
  FormState,
  LogoChoiceValue,
  QRGeneratorAuthDraft,
  QRMode,
  QRType,
  WorkflowStep,
} from "./types";

export function readQRGeneratorAuthDraft(): QRGeneratorAuthDraft | null {
  if (typeof window === "undefined") return null;

  try {
    const rawDraft = window.localStorage.getItem(qrGeneratorAuthDraftStorageKey);
    if (!rawDraft) return null;

    const draft = JSON.parse(rawDraft) as unknown;
    if (!isRecord(draft) || draft.version !== 1) return null;

    const form = isRecord(draft.form)
      ? ({ ...initialFormState, ...draft.form } as FormState)
      : initialFormState;
    const design = isRecord(draft.design)
      ? ({ ...initialDesignState, ...draft.design } as DesignState)
      : initialDesignState;

    return {
      version: 1,
      currentStep: isWorkflowStep(draft.currentStep)
        ? draft.currentStep
        : "export",
      mode: isQRMode(draft.mode) ? draft.mode : "static",
      type: isQRType(draft.type) ? draft.type : "url",
      form,
      design,
      selectedPreset: isDesignPreset(draft.selectedPreset)
        ? draft.selectedPreset
        : "custom",
      logoUrl: typeof draft.logoUrl === "string" ? draft.logoUrl : "",
      logoChoice: isLogoChoiceValue(draft.logoChoice)
        ? draft.logoChoice
        : "none",
    };
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isWorkflowStep(value: unknown): value is WorkflowStep {
  return value === "content" || value === "design" || value === "export";
}

function isQRMode(value: unknown): value is QRMode {
  return value === "static" || value === "dynamic";
}

function isQRType(value: unknown): value is QRType {
  return typeOptions.some((option) => option.value === value);
}

function isDesignPreset(value: unknown): value is DesignPreset {
  return designPresetOptions.some((option) => option.value === value);
}

function isLogoChoiceValue(value: unknown): value is LogoChoiceValue {
  if (value === "none" || value === "upload") return true;

  return logoPresetOptions.some((option) => option.value === value);
}
