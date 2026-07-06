"use client";

import { type FormEvent, type ReactNode, useMemo, useState } from "react";
import {
  ArrowRightLeft,
  Check,
  Copy,
  FileInput,
  FileOutput,
  Play,
  Server,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { cipherOptions, type CipherType } from "@/lib/crypto";
import { cn } from "@/lib/utils";
import {
  Alert,
  Badge,
  Button,
  IconButton,
  SegmentedControl,
  Slider,
  Textarea,
} from "@/components/ui";

type DecodeDirection = "encode" | "decode";

interface DecodeTransformResult {
  algorithm: CipherType;
  direction: DecodeDirection;
  output: string;
  inputLength: number;
  outputLength: number;
}

type DecodeApiResponse =
  | {
      ok: true;
      data: DecodeTransformResult;
      requestId: string;
    }
  | {
      ok: false;
      error: {
        code: string;
        message: string;
        fields?: Record<string, string[]>;
      };
      requestId: string;
    };

const directionOptions = [
  {
    value: "encode",
    label: "Encode",
    description: "Convert plain text into the selected format.",
  },
  {
    value: "decode",
    label: "Decode",
    description: "Validate encoded input before converting it back.",
  },
] as const;

const algorithmPlaceholders: Record<
  CipherType,
  { encode: string; decode: string; format: string }
> = {
  caesar: {
    encode: "Plain text to shift, for example: meet at sunrise",
    decode: "Caesar-shifted text, for example: phhw dw vxqulvh",
    format: "Letters are shifted by the selected amount. Numbers and symbols stay unchanged.",
  },
  base64: {
    encode: "Plain text to encode, for example: Decode Platform",
    decode: "Base64 text, for example: RGVjb2RlIFBsYXRmb3Jt",
    format: "Base64 input may contain A-Z, a-z, 0-9, plus, slash, and padding.",
  },
  rot13: {
    encode: "Plain text to rotate by 13 letters, for example: hello",
    decode: "ROT13 text, for example: uryyb",
    format: "ROT13 is symmetric, so encode and decode produce the opposite rotation.",
  },
  reverse: {
    encode: "Plain text to reverse, for example: decode",
    decode: "Reversed text, for example: edoced",
    format: "Characters are reversed exactly as entered.",
  },
  morse: {
    encode: "Plain text to encode, for example: SOS 2026",
    decode: "... --- ... / ..--- ----- ..--- -....",
    format: "Use spaces between Morse tokens and / between words.",
  },
  binary: {
    encode: "Plain text to encode, for example: Hi",
    decode: "01001000 01101001",
    format: "Decode input must be 8-bit binary groups separated by spaces.",
  },
  hex: {
    encode: "Plain text to encode, for example: Hi",
    decode: "48 69",
    format: "Decode input must contain an even number of hexadecimal characters.",
  },
  url: {
    encode: "Text or URL component, for example: Decode Platform",
    decode: "Decode%20Platform",
    format: "Decode input must be valid percent-encoded URL text.",
  },
};

const transformLabels: Record<DecodeDirection, { input: string; output: string }> = {
  encode: {
    input: "Source text",
    output: "Encoded output",
  },
  decode: {
    input: "Encoded input",
    output: "Decoded output",
  },
};

function getApiErrorMessage(payload: Extract<DecodeApiResponse, { ok: false }>) {
  const fieldMessages = payload.error.fields
    ? Object.values(payload.error.fields).flat()
    : [];

  return fieldMessages[0] ?? payload.error.message;
}

function getOppositeDirection(direction: DecodeDirection): DecodeDirection {
  return direction === "encode" ? "decode" : "encode";
}

export function CipherTool() {
  const [inputText, setInputText] = useState("");
  const [outputText, setOutputText] = useState("");
  const [selectedCipher, setSelectedCipher] = useState<CipherType>("base64");
  const [direction, setDirection] = useState<DecodeDirection>("encode");
  const [shift, setShift] = useState(3);
  const [isTransforming, setIsTransforming] = useState(false);
  const [transformError, setTransformError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<DecodeTransformResult | null>(
    null
  );
  const [copied, setCopied] = useState(false);

  const selectedOption = cipherOptions.find(
    (option) => option.id === selectedCipher
  );
  const selectedPlaceholder = algorithmPlaceholders[selectedCipher];
  const selectedLabels = transformLabels[direction];
  const hasOutput = outputText.length > 0;

  const algorithmSelectionOptions = useMemo(
    () =>
      cipherOptions.map((cipher) => ({
        value: cipher.id,
        label: cipher.name,
        description: cipher.description,
      })),
    []
  );

  const resetResultState = () => {
    setOutputText("");
    setTransformError(null);
    setLastResult(null);
    setCopied(false);
  };

  const handleAlgorithmChange = (nextCipher: CipherType) => {
    setSelectedCipher(nextCipher);
    resetResultState();
  };

  const handleDirectionChange = (nextDirection: DecodeDirection) => {
    setDirection(nextDirection);
    resetResultState();
  };

  const handleInputChange = (value: string) => {
    setInputText(value);
    resetResultState();
  };

  const handleShiftChange = (value: number) => {
    setShift(value);
    resetResultState();
  };

  const handleTransform = async (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    setIsTransforming(true);
    setTransformError(null);
    setCopied(false);

    try {
      const response = await fetch("/api/decode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          algorithm: selectedCipher,
          direction,
          input: inputText,
          shift,
        }),
      });
      const payload = (await response.json()) as DecodeApiResponse;

      if (!payload.ok) {
        throw new Error(getApiErrorMessage(payload));
      }

      setOutputText(payload.data.output);
      setLastResult(payload.data);
    } catch (error) {
      setOutputText("");
      setLastResult(null);
      setTransformError(
        error instanceof Error
          ? error.message
          : "The transform could not be completed."
      );
    } finally {
      setIsTransforming(false);
    }
  };

  const copyOutput = async () => {
    if (!outputText) return;

    try {
      await navigator.clipboard.writeText(outputText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setTransformError("Output could not be copied to the clipboard.");
    }
  };

  const swapTexts = () => {
    if (!outputText) return;

    setInputText(outputText);
    setOutputText(inputText);
    setDirection((currentDirection) => getOppositeDirection(currentDirection));
    setTransformError(null);
    setLastResult(null);
    setCopied(false);
  };

  const clearAll = () => {
    setInputText("");
    resetResultState();
  };

  return (
    <div className="space-y-5 p-4 sm:p-5 lg:p-6">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="min-w-0 space-y-4">
          <SegmentedControl
            value={selectedCipher}
            options={algorithmSelectionOptions}
            onChange={handleAlgorithmChange}
            label="Algorithm"
            columns={4}
          />

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_16rem]">
            <SegmentedControl
              value={direction}
              options={directionOptions}
              onChange={handleDirectionChange}
              label="Direction"
              columns={2}
            />

            {selectedOption?.hasShift ? (
              <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <Slider
                  label="Shift amount"
                  valueLabel={String(shift)}
                  min="1"
                  max="25"
                  value={shift}
                  onChange={(event) =>
                    handleShiftChange(Number(event.target.value))
                  }
                  minLabel="1"
                  maxLabel="25"
                />
              </div>
            ) : (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-800">
                  Format guardrail
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  {selectedPlaceholder.format}
                </p>
              </div>
            )}
          </div>
        </div>

        <aside className="rounded-lg border border-sky-100 bg-sky-50/80 p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-white p-2 text-sky-700 shadow-sm">
              <Server className="h-4 w-4" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-950">
                API validation
              </p>
              <p className="text-xs leading-5 text-slate-600">
                Every transform is checked by `/api/decode`.
              </p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <StatPill label="Input" value={inputText.length.toLocaleString()} />
            <StatPill
              label="Output"
              value={(lastResult?.outputLength ?? outputText.length).toLocaleString()}
            />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge
              variant={lastResult ? "success" : transformError ? "danger" : "info"}
              icon={<ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />}
            >
              {lastResult ? "Validated" : transformError ? "Needs review" : "Ready"}
            </Badge>
            <Badge variant="neutral">{selectedOption?.name}</Badge>
          </div>
        </aside>
      </div>

      {transformError && (
        <Alert variant="danger" title="Transform failed">
          {transformError}
        </Alert>
      )}

      <form className="space-y-4" onSubmit={handleTransform}>
        <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_3.25rem_minmax(0,1fr)] lg:items-stretch">
          <section className="min-w-0 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <PaneHeader
              icon={<FileInput className="h-4 w-4" aria-hidden="true" />}
              title={selectedLabels.input}
              meta={`${inputText.length.toLocaleString()} chars`}
            />
            <Textarea
              label="Input text"
              value={inputText}
              onChange={(event) => handleInputChange(event.target.value)}
              placeholder={selectedPlaceholder[direction]}
              containerClassName="mt-4"
              className="min-h-72 resize-y font-mono text-sm leading-6 wrap-break-word"
            />
          </section>

          <div className="flex items-center justify-center">
            <IconButton
              aria-label="Swap input and output"
              onClick={swapTexts}
              disabled={!hasOutput}
              variant="secondary"
              className="rounded-full"
            >
              <ArrowRightLeft className="h-5 w-5" aria-hidden="true" />
            </IconButton>
          </div>

          <section className="min-w-0 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <PaneHeader
              icon={<FileOutput className="h-4 w-4" aria-hidden="true" />}
              title={selectedLabels.output}
              meta={`${outputText.length.toLocaleString()} chars`}
              actions={
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyOutput}
                  disabled={!hasOutput}
                  leftIcon={
                    copied ? (
                      <Check className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <Copy className="h-4 w-4" aria-hidden="true" />
                    )
                  }
                >
                  {copied ? "Copied" : "Copy"}
                </Button>
              }
            />
            <Textarea
              label="Output text"
              value={isTransforming ? "" : outputText}
              readOnly
              placeholder={
                isTransforming
                  ? "Validating with the decode API..."
                  : "Output will appear here after validation."
              }
              containerClassName="mt-4"
              className={cn(
                "min-h-72 resize-y font-mono text-sm leading-6 wrap-break-word",
                "read-only:bg-slate-50"
              )}
            />
          </section>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm leading-6 text-slate-600">
            {selectedPlaceholder.format}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button
              variant="ghost"
              onClick={clearAll}
              leftIcon={<Trash2 className="h-4 w-4" aria-hidden="true" />}
              className="w-full sm:w-auto"
            >
              Clear
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isTransforming}
              leftIcon={<Play className="h-4 w-4" aria-hidden="true" />}
              className="w-full sm:w-auto"
            >
              Run transform
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/80 bg-white/80 px-3 py-2">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function PaneHeader({
  icon,
  title,
  meta,
  actions,
}: {
  icon: ReactNode;
  title: string;
  meta: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <span className="rounded-lg bg-sky-50 p-2 text-sky-700">{icon}</span>
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-slate-950">{title}</h2>
          <p className="text-sm text-slate-600">{meta}</p>
        </div>
      </div>
      {actions && <div className="flex shrink-0 justify-start sm:justify-end">{actions}</div>}
    </div>
  );
}
