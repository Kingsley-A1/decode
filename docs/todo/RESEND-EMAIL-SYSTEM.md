# Decode Resend Email System Integration

Checked: 2026-05-27

Provider: Resend

Payment context: `docs/todo/LIVE-PAYMENT-INTEGRATION.MD`

Decode does not need a marketing email platform first. It needs a reliable transactional email system that can send account, billing, QR, landing page, public API, and support notifications from server-side events without leaking secrets into client code or double-sending during retries.

## Strategic Decision

Use Resend for transactional email first. Implement it as a server-side email outbox, not as scattered `resend.emails.send()` calls inside route handlers. The outbox gives Decode the same reliability pattern required by the Paystack payment plan: state changes are committed once, events are processed idempotently, provider responses are stored, and webhooks update delivery status after the fact.

Start with the smallest production set:

1. Domain setup and environment configuration.
2. Shared email provider wrapper.
3. Email outbox and delivery records.
4. Billing emails attached to Paystack payment lifecycle.
5. Account and product workflow emails.
6. Resend webhook ingestion for delivered, bounced, complained, failed, opened, and clicked events.

Do not implement newsletter, bulk marketing, contact lists, or broadcasts until Decode has a clear consent model and unsubscribe preferences. Transactional messages can ship earlier because they are triggered by user or workspace actions.

## Resend Source Baseline

Resend's Next.js guide shows the App Router pattern: install the `resend` package, create a React email template, and send from a server route using `new Resend(process.env.RESEND_API_KEY)`.

Resend's Email API sends through `POST /emails`. The API accepts sender, recipient, subject, HTML, text, React components through the Node SDK, attachments, tags, and templates. The `Idempotency-Key` header prevents duplicate email requests during retry windows.

Resend's API reference uses `https://api.resend.com`, requires HTTPS, and authenticates direct HTTP requests with `Authorization: Bearer re_xxxxxxxxx`. SDKs handle required client headers such as `User-Agent`.

Resend's domain documentation recommends sending from a subdomain, then verifying SPF and DKIM DNS records. DMARC should be added after SPF and DKIM pass.

Resend's webhook documentation uses Svix headers. Decode should verify webhooks through the SDK using `svix-id`, `svix-timestamp`, `svix-signature`, and `RESEND_WEBHOOK_SECRET`, then store and process the event idempotently.

Primary Resend references:

- Next.js guide: https://resend.com/docs/send-with-nextjs
- Send Email API: https://resend.com/docs/api-reference/emails
- API introduction: https://resend.com/docs/api-reference/introduction
- Domain setup: https://resend.com/docs/dashboard/domains/introduction
- Subdomain guidance: https://resend.com/docs/knowledge-base/is-it-better-to-send-emails-from-a-subdomain-or-the-root-domain
- Webhook management: https://resend.com/docs/dashboard/webhooks/body-parameters
- Webhook verification: https://resend.com/docs/webhooks/verify-webhooks-requests
- Webhook event types: https://resend.com/docs/dashboard/webhooks/event-types
- Topics and preferences: https://resend.com/docs/dashboard/topics/introduction

## Domain And Sender Model

Use a dedicated sending subdomain instead of the root domain. The first production sender should be:

```txt
notifications.decode.com.ng
```

Default sender:

```txt
Decode <notifications@notifications.decode.com.ng>
```

Reply-to:

```txt
support@decode.com.ng
```

This keeps product and billing email reputation separate from the root domain and avoids brand-adjacent domains that look suspicious. If Decode later sends marketing email, add a separate subdomain such as `updates.decode.com.ng` with separate templates, topics, and unsubscribe handling.

DNS requirements:

- [ ] Add the Resend domain for `notifications.decode.com.ng`.
- [ ] Add Resend's SPF TXT record.
- [ ] Add Resend's DKIM TXT records.
- [ ] Add DMARC after SPF and DKIM verify.
- [ ] Keep normal business inbox MX records separate from the Resend sending subdomain.
- [ ] Do not send from `@resend.dev` in production.

## Environment Variables

Add these to local, preview, and production environments:

```txt
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=Decode <notifications@notifications.decode.com.ng>
RESEND_REPLY_TO=support@decode.com.ng
RESEND_WEBHOOK_SECRET=whsec_...
EMAIL_DELIVERY_MODE=outbox
EMAIL_SUPPRESS_SEND=false
```

Use `EMAIL_SUPPRESS_SEND=true` in local test runs when developers need database assertions without sending provider traffic. Preview can use real Resend only after the preview sender domain and recipient policy are defined.

Security rules:

- [ ] `RESEND_API_KEY` is server-only.
- [ ] `RESEND_WEBHOOK_SECRET` is server-only.
- [ ] No `NEXT_PUBLIC_RESEND_*` variable is allowed.
- [ ] API keys use the narrowest Resend permission that still supports the current feature set.
- [ ] Rotate the key if it appears in logs, screenshots, browser bundles, or source control.

## Architecture

Create a dedicated email module under `server/email`.

```txt
server/email/
  constants.ts
  events.ts
  provider.ts
  resend.ts
  service.ts
  templates/
    BillingReceiptEmail.tsx
    PaymentPendingEmail.tsx
    DedicatedVirtualAccountEmail.tsx
    WelcomeEmail.tsx
    QRPublishedEmail.tsx
    DestinationChangedEmail.tsx
  __tests__/
    service.test.ts
    webhook.test.ts

app/api/webhooks/resend/route.ts
```

`server/email/provider.ts` defines the interface Decode owns:

```ts
export type SendEmailInput = {
  to: string;
  subject: string;
  react: React.ReactElement;
  text: string;
  idempotencyKey: string;
  tags: Array<{ name: string; value: string }>;
};

export type SendEmailResult = {
  providerMessageId: string;
};

export interface EmailProvider {
  send(input: SendEmailInput): Promise<SendEmailResult>;
}
```

`server/email/resend.ts` implements that interface with Resend. All other modules call Decode's `EmailProvider`, never the Resend SDK directly. That keeps tests simple and makes the provider replaceable if pricing, compliance, or deliverability requirements change.

## Data Model

Add email persistence after the payment tables are planned. The outbox should be independent from the provider response so Decode can queue messages before Resend accepts them.

```prisma
model EmailOutbox {
  id              String    @id @default(cuid())
  workspaceId     String?
  userId          String?
  recipientEmail  String
  templateKey     String
  subject         String
  status          String
  idempotencyKey  String    @unique
  provider        String?
  providerEmailId String?
  payload         Json
  lastError       String?
  scheduledAt     DateTime  @default(now())
  sentAt          DateTime?
  failedAt        DateTime?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}

model EmailDeliveryEvent {
  id              String   @id @default(cuid())
  provider        String
  providerEmailId String?
  eventType       String
  eventId         String?
  recipientEmail  String?
  payload         Json
  processedAt     DateTime?
  createdAt       DateTime @default(now())

  @@unique([provider, eventType, eventId])
}

model EmailPreference {
  id             String   @id @default(cuid())
  userId         String?
  workspaceId    String?
  email          String
  category       String
  enabled        Boolean  @default(true)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  @@unique([email, category])
}
```

Recommended `EmailOutbox.status` values:

```txt
queued
sending
sent
delivery_delayed
delivered
bounced
complained
failed
suppressed
```

Transactional messages should bypass promotional preferences, but they should still respect hard suppression after a bounce, complaint, or admin block.

## Email Event Contract

Email should be triggered from internal domain events, not from UI components.

```ts
export type DecodeEmailEvent =
  | {
      type: "billing.payment_succeeded";
      workspaceId: string;
      invoiceId: string;
      paymentIntentId: string;
    }
  | {
      type: "billing.payment_pending";
      workspaceId: string;
      invoiceId: string;
      paymentIntentId: string;
    }
  | {
      type: "billing.dva_assigned";
      workspaceId: string;
      dedicatedVirtualAccountId: string;
    }
  | {
      type: "qr.published";
      workspaceId: string;
      qrCodeId: string;
    }
  | {
      type: "qr.destination_changed";
      workspaceId: string;
      qrCodeId: string;
    }
  | {
      type: "account.welcome";
      userId: string;
    };
```

Each event handler fetches current database state, validates that the recipient is allowed to receive the message, creates an `EmailOutbox` row with a deterministic idempotency key, and lets the sender process it.

Idempotency key format:

```txt
decode:{environment}:{eventType}:{entityId}:{templateVersion}
```

Example:

```txt
decode:production:billing.payment_succeeded:inv_123:v1
```

This key should also be passed to Resend as the email API `Idempotency-Key`.

## Payment Integration

The Paystack plan in `LIVE-PAYMENT-INTEGRATION.MD` defines invoice, payment intent, subscription, DVA, and webhook state. Email must follow those state transitions exactly.

Billing email map:

| Payment event | Email | Send condition |
| --- | --- | --- |
| Transaction initialized | Checkout link email | Optional. Send only if user requests email checkout link. |
| Callback received but not verified | Payment pending | Send only if verification is delayed and invoice remains pending. |
| `charge.success` verified | Receipt and plan activation | Send after amount, currency, reference, invoice, and workspace checks pass. |
| Invoice paid by DVA transfer | Transfer receipt | Send after transfer is reconciled to a workspace invoice. |
| DVA assigned | Bank transfer account details | Send after account number and bank name are stored. |
| Payment failed | Payment failed notice | Send after Paystack verify or webhook reports failure. |
| Subscription renewed | Renewal receipt | Send after the new invoice is paid. |
| Subscription cancelled | Cancellation confirmation | Send after server-side cancellation is committed. |
| Refund/dispute recorded | Support notice | Send to admin/support first; customer copy depends on policy. |

Never send a "payment successful" email from a frontend callback alone. The email is proof-like communication to the customer and must be emitted only after Decode's server marks the invoice paid.

Recommended transaction boundary:

```txt
1. Verify Paystack event or reference.
2. Update PaymentIntent, Invoice, Subscription, Workspace, and AuditLog in one database transaction.
3. Insert EmailOutbox row in the same transaction.
4. Commit.
5. Send from outbox.
6. Store Resend provider id.
```

If the email send fails after the database commits, the invoice remains paid and the outbox retry mechanism handles delivery. Do not roll back billing state because an email provider had a temporary failure.

## Product Email Integration

Initial product emails should be intentionally narrow:

- [ ] Welcome email after first successful sign-in or workspace creation.
- [ ] Dynamic QR published confirmation with redirect URL.
- [ ] Dynamic QR destination changed alert.
- [ ] QR archived confirmation for paid workspaces.
- [ ] Landing page published confirmation.
- [ ] Public API key created or rotated notice when the public API system ships.

Avoid putting sensitive QR payload data in email. Link to the dashboard detail page and include only high-level labels such as QR title, workspace name, and public redirect URL.

Destination change emails are security-sensitive. If someone changes a dynamic QR destination, the workspace owner should receive an alert with the old host and new host so malicious account access is easier to notice.

## Webhook Handler

Create:

```txt
POST /api/webhooks/resend
```

Handler rules:

- [ ] Read the raw request body as text.
- [ ] Verify `svix-id`, `svix-timestamp`, and `svix-signature` with `RESEND_WEBHOOK_SECRET`.
- [ ] Return `401` for invalid signatures.
- [ ] Store every valid webhook in `EmailDeliveryEvent`.
- [ ] Process events idempotently.
- [ ] Update matching `EmailOutbox` by `providerEmailId`.
- [ ] Mark bounced and complained recipients as suppressed.
- [ ] Return `200` after successful storage and processing.

Next.js route shape:

```ts
import { Resend } from "resend";
import { NextResponse } from "next/server";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  const payload = await request.text();
  const headers = {
    id: request.headers.get("svix-id") ?? "",
    timestamp: request.headers.get("svix-timestamp") ?? "",
    signature: request.headers.get("svix-signature") ?? "",
  };

  const event = resend.webhooks.verify({
    payload,
    headers,
    webhookSecret: process.env.RESEND_WEBHOOK_SECRET!,
  });

  // Store and process idempotently.
  return NextResponse.json({ ok: true });
}
```

Resend events to handle in phase one:

```txt
email.sent
email.delivered
email.delivery_delayed
email.bounced
email.complained
email.failed
email.opened
email.clicked
```

Open and click events are engagement signals only. They must never be used as billing proof, authentication proof, or legal consent.

## Template Rules

Use React Email-compatible components through the Resend Node SDK for maintainable transactional templates.

Every template must provide:

- [ ] Subject line.
- [ ] React HTML body.
- [ ] Plain text fallback.
- [ ] Preview data for local rendering tests.
- [ ] Stable template key and version.
- [ ] No private API keys, raw payment payloads, or sensitive QR content.
- [ ] Dashboard links using `APP_URL` or the normalized public URL helper.

Template folder pattern:

```txt
server/email/templates/BillingReceiptEmail.tsx
server/email/templates/BillingReceiptEmail.test.tsx
```

Billing receipt content:

- Plan name.
- Amount and currency.
- Invoice reference.
- Payment channel if available.
- Link to invoice in Decode.
- Support reply-to address.

DVA account email content:

- Workspace name.
- Account name.
- Account number.
- Bank name.
- Currency.
- Warning that transfers activate only after Decode verifies Paystack events.

## Worker Strategy

Decode can start with a synchronous outbox sender called after the database transaction commits. That is acceptable for low volume, but the structure should be ready for a worker or cron.

Phase one sender:

```txt
create outbox row -> commit -> process one queued email immediately
```

Phase two sender:

```txt
cron or queue -> claim queued rows -> send -> update status
```

Claiming rule:

- [ ] Update `queued` to `sending` with a bounded batch size.
- [ ] Use retry count or `lastError` to avoid hot loops.
- [ ] Back off after provider rate limits.
- [ ] Keep a support-visible failed queue.

## Implementation Phases

### Phase 1: Foundation

- [ ] Verify `notifications.decode.com.ng` in Resend.
- [ ] Add `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `RESEND_REPLY_TO`, and `RESEND_WEBHOOK_SECRET` to `.env.example`.
- [ ] Install `resend`.
- [ ] Add `server/email/provider.ts`.
- [ ] Add `server/email/resend.ts`.
- [ ] Add `EmailOutbox`, `EmailDeliveryEvent`, and `EmailPreference` models.
- [ ] Add a mock provider for tests.
- [ ] Add one internal service method: `queueEmail(event)`.

### Phase 2: Billing Emails

- [ ] Implement `BillingReceiptEmail`.
- [ ] Implement `PaymentPendingEmail`.
- [ ] Implement `PaymentFailedEmail`.
- [ ] Implement `DedicatedVirtualAccountEmail`.
- [ ] Insert billing email outbox rows inside Paystack verification transactions.
- [ ] Make receipt sending idempotent by invoice id.
- [ ] Add admin/support alert for webhook signature failures and payment drift.

### Phase 3: Account And Product Emails

- [ ] Implement `WelcomeEmail`.
- [ ] Implement `QRPublishedEmail`.
- [ ] Implement `DestinationChangedEmail`.
- [ ] Implement `LandingPagePublishedEmail`.
- [ ] Send destination-change alert only after the new destination is committed.
- [ ] Respect user/workspace email preferences for non-critical product notices.

### Phase 4: Delivery Webhooks And Suppression

- [ ] Add `POST /api/webhooks/resend`.
- [ ] Verify Svix webhook headers using the Resend SDK.
- [ ] Store delivery events idempotently.
- [ ] Suppress bounced and complained recipients.
- [ ] Show delivery status on admin/support email logs.

### Phase 5: Preferences And Broadcast Readiness

- [ ] Add email preference UI for product updates and scan reports.
- [ ] Keep billing and security messages transactional.
- [ ] Evaluate Resend Topics before any broadcast or newsletter work.
- [ ] Add unsubscribe links for non-transactional email.

## Testing Plan

Unit tests:

- [ ] Resend provider maps Decode input to `resend.emails.send`.
- [ ] Provider passes the deterministic idempotency key.
- [ ] Email service does not create duplicate outbox rows for the same event.
- [ ] Billing receipt template renders plan, amount, invoice, and dashboard URL.
- [ ] DVA template renders bank account details without exposing raw provider payload.
- [ ] Webhook route rejects invalid signatures.
- [ ] Webhook route stores and processes delivered, bounced, complained, and failed events.
- [ ] Bounced and complained recipients are suppressed.

Integration tests:

- [ ] Successful Paystack verification creates one receipt email outbox row.
- [ ] Replayed Paystack webhook does not create a second receipt.
- [ ] Failed Paystack verification does not send a success receipt.
- [ ] DVA assignment creates one account details email after account details are stored.
- [ ] QR destination change creates one owner alert with old and new host.

Manual smoke tests:

- [ ] Send a local test email with Resend test recipient.
- [ ] Trigger payment success in Paystack test mode and receive receipt.
- [ ] Trigger DVA assignment in test mode and receive account details.
- [ ] Trigger Resend webhook replay and confirm idempotent handling.
- [ ] Confirm no email provider key is visible in browser source or client bundles.

## Release Checklist

- [ ] Sending subdomain is verified in Resend.
- [ ] SPF and DKIM pass.
- [ ] DMARC record exists.
- [ ] Production `RESEND_API_KEY` is set in Vercel.
- [ ] Production webhook endpoint is configured in Resend.
- [ ] Webhook secret is set in Vercel.
- [ ] Email outbox migration is deployed.
- [ ] Payment receipt emails are tied to verified Paystack state only.
- [ ] Bounce and complaint suppression is active.
- [ ] Admin/support can inspect failed email deliveries.
- [ ] All templates have text fallbacks.
- [ ] Non-transactional emails have preference handling before they ship.

## What To Know By Heart

Do not send email from client components. Resend API keys stay on the server.

Do not send payment success receipts from the browser callback. Receipts follow verified server-side Paystack state.

Use an outbox for emails that matter. The database state and the email queue must agree before external provider calls happen.

Pass a deterministic idempotency key to Resend and store the same key in Decode.

Verify Resend webhooks before processing them. The webhook route needs raw body text and Svix headers.

## What To Recognize

Recognize transactional email versus marketing email. Billing receipts, security alerts, DVA details, and QR destination-change alerts are transactional. Product updates, newsletters, and scan digest campaigns are not.

Recognize provider delivery state versus business truth. `email.delivered` means the message reached the recipient's mail server; it does not prove the customer read it or paid.

Recognize reputation risk. Sending from the root domain or mixing marketing and billing traffic can damage inbox placement for critical messages.

Recognize callback timing. Paystack and Resend webhooks can arrive more than once and out of order. The database must handle replays safely.

## Lookup Only

Lookup Resend's current pricing, sending limits, attachment limits, DNS records, webhook event list, SDK method signatures, and suppression-list behavior immediately before implementation.

Lookup Nigerian payment receipt requirements and tax invoice wording before using Decode receipts as formal accounting documents.
