import { Link as LinkIcon, Sparkles } from "lucide-react";
import {
  Alert,
  BuilderActionBar,
  Button,
  ChoiceRail,
  Input,
  SegmentedControl,
  Select,
  Textarea,
} from "@/components/ui";
import { modeOptions, typeOptions } from "../constants";
import { validateContent } from "../validation";
import type { FormState, QRMode, QRType } from "../types";

export function ContentStep({
  headingRef,
  mode,
  type,
  form,
  validationErrors,
  onModeChange,
  onTypeChange,
  onFormChange,
  onContinue,
}: {
  readonly headingRef: React.RefObject<HTMLHeadingElement | null>;
  readonly mode: QRMode;
  readonly type: QRType;
  readonly form: FormState;
  readonly validationErrors: Record<string, string>;
  readonly onModeChange: (mode: QRMode) => void;
  readonly onTypeChange: (type: QRType) => void;
  readonly onFormChange: (key: keyof FormState, value: string | boolean) => void;
  readonly onContinue: () => void;
}) {
  const isDynamic = mode === "dynamic";
  const visibleTypeOptions = typeOptions.map((option) => ({
    ...option,
    disabled: isDynamic && option.value !== "url",
  }));
  const validation = validateContent({ type, mode, form });

  return (
    <div className="space-y-5">
      <div>
        <h2
          id="qr-step-content-heading"
          ref={headingRef}
          tabIndex={-1}
          className="scroll-mt-28 text-lg font-semibold text-slate-950 focus:outline-none"
        >
          1. Choose content
        </h2>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          Pick the QR behavior, then enter the minimum content needed.
        </p>
      </div>

      <SegmentedControl
        value={mode}
        options={modeOptions}
        onChange={onModeChange}
        label="QR behavior"
        columns={2}
      />

      {isDynamic && (
        <Alert variant="info" title="Dynamic v1 supports URL redirects">
          Dynamic QR codes require a website URL. Decode assigns the stable public link when you publish.
        </Alert>
      )}

      <ChoiceRail
        value={type}
        options={visibleTypeOptions.map((option) => ({
          value: option.value,
          label: option.shortLabel,
          disabled: option.disabled,
          ariaLabel: `${option.shortLabel} QR type`,
        }))}
        onChange={onTypeChange}
        label="QR type"
        size="sm"
        desktopColumns={4}
        getDescription={(option) => {
          const typeOption = typeOptions.find(
            (item) => item.value === option.value
          );

          return (
            <>
              <span className="font-medium text-slate-800">
                {typeOption?.label ?? option.label}:
              </span>{" "}
              {typeOption?.description}
              {isDynamic ? " Dynamic v1 supports URL codes only." : ""}
            </>
          );
        }}
      />

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <ContentFields
          type={type}
          mode={mode}
          form={form}
          errors={validationErrors}
          onFormChange={onFormChange}
        />
      </div>

      <p className="text-sm text-slate-600 sm:hidden" aria-live="polite">
        {validation.isValid
          ? "Content is valid."
          : "Complete the required fields to continue."}
      </p>
      <BuilderActionBar
        desktop={
          <>
            <p className="text-sm text-slate-600" aria-live="polite">
              {validation.isValid
                ? "Content is valid. Continue to QR design."
                : "Complete the required fields to continue."}
            </p>
            <Button
              variant="primary"
              onClick={onContinue}
              disabled={!validation.isValid}
              rightIcon={<Sparkles className="h-4 w-4" aria-hidden="true" />}
            >
              Continue to design
            </Button>
          </>
        }
        mobile={
          <Button
            variant="primary"
            onClick={onContinue}
            disabled={!validation.isValid}
            className="w-full"
            rightIcon={<Sparkles className="h-4 w-4" aria-hidden="true" />}
          >
            Continue to design
          </Button>
        }
      />
    </div>
  );
}

function ContentFields({
  type,
  mode,
  form,
  errors,
  onFormChange,
}: {
  readonly type: QRType;
  readonly mode: QRMode;
  readonly form: FormState;
  readonly errors: Record<string, string>;
  readonly onFormChange: (key: keyof FormState, value: string | boolean) => void;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Input
        label="Title"
        value={form.title}
        onChange={(event) => onFormChange("title", event.target.value)}
        placeholder="Spring campaign"
        hint="Used in downloads and dashboard labels."
        containerClassName="md:col-span-2"
      />

      {type === "url" && (
        <Input
          label={mode === "dynamic" ? "Destination URL" : "Website URL"}
          value={form.url}
          onChange={(event) => onFormChange("url", event.target.value)}
          placeholder="https://example.com"
          inputMode="url"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          error={errors.url}
          leftIcon={<LinkIcon className="h-4 w-4" aria-hidden="true" />}
          containerClassName="md:col-span-2"
        />
      )}

      {type === "text" && (
        <Textarea
          label="Text"
          value={form.text}
          onChange={(event) => onFormChange("text", event.target.value)}
          placeholder="Text to encode"
          error={errors.text}
          containerClassName="md:col-span-2"
        />
      )}

      {type === "email" && (
        <>
          <Input
            label="Email address"
            type="email"
            value={form.email}
            onChange={(event) => onFormChange("email", event.target.value)}
            placeholder="hello@example.com"
            error={errors.email}
          />
          <Input
            label="Subject"
            value={form.emailSubject}
            onChange={(event) => onFormChange("emailSubject", event.target.value)}
            placeholder="Hello"
          />
          <Textarea
            label="Body"
            value={form.emailBody}
            onChange={(event) => onFormChange("emailBody", event.target.value)}
            placeholder="Optional message"
            containerClassName="md:col-span-2"
          />
        </>
      )}

      {type === "phone" && (
        <Input
          label="Phone number"
          type="tel"
          value={form.phone}
          onChange={(event) => onFormChange("phone", event.target.value)}
          placeholder="+15551234567"
          error={errors.phone}
          containerClassName="md:col-span-2"
        />
      )}

      {type === "sms" && (
        <>
          <Input
            label="Phone number"
            type="tel"
            value={form.smsPhone}
            onChange={(event) => onFormChange("smsPhone", event.target.value)}
            placeholder="+15551234567"
            error={errors.smsPhone}
          />
          <Input
            label="Message"
            value={form.smsMessage}
            onChange={(event) => onFormChange("smsMessage", event.target.value)}
            placeholder="Optional SMS text"
          />
        </>
      )}

      {type === "whatsapp" && (
        <>
          <Input
            label="WhatsApp number"
            type="tel"
            value={form.whatsappPhone}
            onChange={(event) =>
              onFormChange("whatsappPhone", event.target.value)
            }
            placeholder="+15551234567"
            error={errors.whatsappPhone}
          />
          <Input
            label="Message"
            value={form.whatsappMessage}
            onChange={(event) =>
              onFormChange("whatsappMessage", event.target.value)
            }
            placeholder="Optional WhatsApp text"
          />
        </>
      )}

      {type === "wifi" && (
        <>
          <Input
            label="Network name"
            value={form.wifiSsid}
            onChange={(event) => onFormChange("wifiSsid", event.target.value)}
            placeholder="Guest Wi-Fi"
            error={errors.wifiSsid}
          />
          <Input
            label="Password"
            value={form.wifiPassword}
            onChange={(event) => onFormChange("wifiPassword", event.target.value)}
            placeholder="Optional"
          />
          <Select
            label="Encryption"
            value={form.wifiEncryption}
            onChange={(event) =>
              onFormChange(
                "wifiEncryption",
                event.target.value as FormState["wifiEncryption"]
              )
            }
          >
            <option value="WPA">WPA/WPA2</option>
            <option value="WEP">WEP</option>
            <option value="nopass">No password</option>
          </Select>
          <label className="flex min-h-12 items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800">
            <input
              type="checkbox"
              checked={form.wifiHidden}
              onChange={(event) => onFormChange("wifiHidden", event.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-sky-600"
            />
            Hidden network
          </label>
        </>
      )}

      {type === "vcard" && (
        <>
          <Input
            label="First name"
            value={form.firstName}
            onChange={(event) => onFormChange("firstName", event.target.value)}
            error={errors.vcardName}
          />
          <Input
            label="Last name"
            value={form.lastName}
            onChange={(event) => onFormChange("lastName", event.target.value)}
          />
          <Input
            label="Organization"
            value={form.organization}
            onChange={(event) => onFormChange("organization", event.target.value)}
          />
          <Input
            label="Title"
            value={form.jobTitle}
            onChange={(event) => onFormChange("jobTitle", event.target.value)}
          />
          <Input
            label="Phone"
            type="tel"
            value={form.vcardPhone}
            onChange={(event) => onFormChange("vcardPhone", event.target.value)}
          />
          <Input
            label="Email"
            type="email"
            value={form.vcardEmail}
            onChange={(event) => onFormChange("vcardEmail", event.target.value)}
            error={errors.vcardEmail}
          />
          <Input
            label="Website"
            value={form.vcardWebsite}
            onChange={(event) => onFormChange("vcardWebsite", event.target.value)}
            inputMode="url"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            error={errors.vcardWebsite}
          />
          <Input
            label="Address"
            value={form.vcardAddress}
            onChange={(event) => onFormChange("vcardAddress", event.target.value)}
          />
        </>
      )}
    </div>
  );
}
