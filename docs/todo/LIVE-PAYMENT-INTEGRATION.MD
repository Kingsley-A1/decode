# Decode Live Payment Integration

Checked: 2026-05-26

Provider: Paystack

Current Decode payment state: the pricing page uses a manual OPay account and WhatsApp proof flow in `app/(app)/pricing/PricingPaymentAction.tsx`. That is acceptable for pilot sales, but it should not remain the production payment system once Decode starts activating plans automatically, selling self-serve subscriptions, or exposing public API quotas.

## Strategic Decision

Use Paystack Transaction Initialize and Verify as the first live payment path. This is the fastest reliable upgrade from the mocked payment flow because Decode keeps plan, workspace, invoice, amount, and reference control on the server, while Paystack handles card, bank, USSD, transfer, and checkout security.

Add Dedicated Virtual Accounts after the first checkout flow is stable. DVA is powerful for repeat Nigerian bank-transfer payments and account-based top-ups, but it introduces customer records, identity/compliance requirements for some business categories, DVA assignment webhooks, account display rules, and reconciliation work.

The strongest sequence is:

1. Card and checkout payment through Paystack Initialize Transaction.
2. Verify Transaction on callback and webhook.
3. Payment ledger, invoice, subscription, and workspace entitlement activation.
4. DVA for repeat bank transfer customers.
5. Transaction splits only if Decode must settle money to vendors, agencies, or resellers.

## Paystack Source Baseline

Paystack's Accept Payments documentation describes three checkout paths: API, Popup JS, and SDKs. It recommends initializing a transaction from the backend, completing the payment, then verifying transaction status.

Paystack's Transactions API initializes payments through `POST /transaction/initialize`, returns an `authorization_url`, `access_code`, and `reference`, and verifies payments through `GET /transaction/verify/{reference}`. Amounts are passed in the currency subunit, and the initialize request can include `email`, `amount`, `channels`, `currency`, `reference`, `callback_url`, `metadata`, `split_code`, `subaccount`, `transaction_charge`, and `bearer`.

Paystack's webhook documentation states that webhook events include an `x-paystack-signature` header, which is an HMAC SHA512 signature of the event payload signed with the secret key. Decode must verify this signature before processing payment events.

Paystack's DVA documentation states that Dedicated Virtual Accounts are available to Nigerian merchants for creating customer-specific bank accounts. The DVA API supports assigning a DVA through `POST /dedicated_account/assign`; it accepts customer details, preferred bank, country, and optional validation/split fields. Paystack's DVA guide also states that some business categories require customer validation before bank account numbers can be generated.

Paystack's transaction split guidance allows payments to be split to subaccounts or split groups. Decode should defer this until there is a real reseller, marketplace, or agency settlement requirement.

Primary Paystack references:

- Accept payments: https://paystack.com/docs/payments/accept-payments/
- Transactions API: https://paystack.com/docs/api/transaction/
- Webhooks: https://paystack.com/docs/payments/webhooks/
- Dedicated Virtual Accounts: https://paystack.com/docs/payments/dedicated-virtual-accounts/
- Dedicated Virtual Account API: https://paystack.com/docs/api/dedicated-virtual-account/
- Customer validation: https://paystack.com/docs/payments/dedicated-virtual-accounts/customer-validation/
- Transaction splits: https://paystack.com/docs/payments/split-payments/

## Target User Flows

### Card Or Checkout Payment

The user chooses a paid plan on `/pricing`. Decode creates a pending invoice and payment intent, then calls Paystack from the server.

Server request:

```txt
POST https://api.paystack.co/transaction/initialize
Authorization: Bearer PAYSTACK_SECRET_KEY
Content-Type: application/json
```

Payload shape:

```json
{
  "email": "customer@example.com",
  "amount": "600000",
  "currency": "NGN",
  "reference": "dec_pi_01HY...",
  "callback_url": "https://decode.com.ng/billing/paystack/callback",
  "metadata": {
    "workspaceId": "wrk_123",
    "invoiceId": "inv_123",
    "planCode": "creators_monthly",
    "paymentIntentId": "pi_123"
  }
}
```

Decode stores the reference before redirecting the user to Paystack. After payment, Paystack sends the user back to the callback URL with the reference. Decode must call Paystack Verify Transaction from the server before activating any plan.

Callback rule: the callback page can display "verifying payment", but it cannot activate a plan by trusting URL parameters.

Webhook rule: webhook `charge.success` should be treated as the most reliable asynchronous signal. The webhook handler still validates amount, currency, reference, workspace, and invoice before activation.

### Dedicated Virtual Account Payment

DVA is for repeat bank-transfer payments. Decode creates or reuses a Paystack customer, assigns a DVA, stores the account details, and shows the customer a bank account number tied to their workspace.

Recommended Decode use:

- Business Pack annual renewals.
- Agency customers who prefer bank transfer.
- Workspace wallet or credit top-up if Decode later introduces API usage credits.

Do not use DVA as the first live payment path. It is operationally heavier than checkout and requires more reconciliation UI.

### Transaction Splits

Use splits only if Decode must route part of the payment to another account. Examples: agency reseller commission, marketplace templates, or partner-managed workspaces.

Until that need exists, all payments should settle into the main Decode Paystack account. This keeps reconciliation, refunds, disputes, and accounting simpler.

## Data Model

Add these models before replacing the mock flow:

```prisma
model BillingCustomer {
  id                    String   @id @default(cuid())
  workspaceId           String   @unique
  email                 String
  name                  String?
  phone                 String?
  paystackCustomerCode  String?
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
}

model Invoice {
  id            String   @id @default(cuid())
  workspaceId   String
  planCode      String
  amountKobo    Int
  currency      String
  status        String
  dueAt         DateTime?
  paidAt        DateTime?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model PaymentIntent {
  id                  String   @id @default(cuid())
  workspaceId          String
  invoiceId            String
  provider             String
  providerReference    String   @unique
  providerAccessCode   String?
  checkoutUrl          String?
  amountKobo           Int
  currency             String
  status               String
  channel              String?
  metadata             Json
  initializedAt        DateTime @default(now())
  verifiedAt           DateTime?
  paidAt               DateTime?
  failedAt             DateTime?
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt
}

model Subscription {
  id          String    @id @default(cuid())
  workspaceId String
  planCode    String
  status      String
  startsAt    DateTime
  renewsAt    DateTime?
  endsAt      DateTime?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

model DedicatedVirtualAccount {
  id                       String   @id @default(cuid())
  workspaceId               String
  billingCustomerId         String
  provider                  String
  providerDedicatedAccountId String?
  accountName               String
  accountNumber             String
  bankName                  String
  bankSlug                  String?
  currency                  String
  active                    Boolean  @default(true)
  assigned                  Boolean  @default(false)
  createdAt                 DateTime @default(now())
  updatedAt                 DateTime @updatedAt
}

model PaymentWebhookEvent {
  id                String   @id @default(cuid())
  provider          String
  event             String
  providerReference String?
  signatureHash     String
  payload           Json
  processedAt       DateTime?
  createdAt         DateTime @default(now())

  @@unique([provider, signatureHash])
}
```

## API Routes

```txt
POST /api/billing/paystack/initialize
GET  /billing/paystack/callback
POST /api/webhooks/paystack
POST /api/billing/paystack/verify
POST /api/billing/paystack/dva/assign
GET  /api/billing/invoices/[id]
GET  /api/billing/subscription
```

Route behavior:

| Route | Auth | Responsibility |
| --- | --- | --- |
| `POST /api/billing/paystack/initialize` | User session | Create invoice if needed, create pending payment intent, initialize Paystack, return checkout URL. |
| `GET /billing/paystack/callback` | Public browser | Read reference, call internal verification action, show success/pending/failure UI. |
| `POST /api/webhooks/paystack` | Paystack signature | Verify signature from raw body, store event, process idempotently. |
| `POST /api/billing/paystack/verify` | User session | Verify a reference from the user's workspace and return payment state. |
| `POST /api/billing/paystack/dva/assign` | User session/admin | Create or assign a DVA after billing customer data is complete. |
| `GET /api/billing/subscription` | User session | Return active plan and limits for workspace UI. |

## Payment Verification Rules

Decode can mark an invoice paid only when all checks pass:

- [ ] Paystack Verify Transaction returns success.
- [ ] Paystack reference equals `PaymentIntent.providerReference`.
- [ ] Paystack amount equals `PaymentIntent.amountKobo`.
- [ ] Paystack currency equals `PaymentIntent.currency`.
- [ ] Payment intent belongs to the workspace or invoice being activated.
- [ ] Payment intent is not already attached to a different invoice.
- [ ] Invoice is not already voided, refunded, or superseded.
- [ ] Event is processed idempotently.

After these checks pass, update in one transaction:

```txt
PaymentIntent.status = "paid"
PaymentIntent.paidAt = now()
Invoice.status = "paid"
Invoice.paidAt = now()
Subscription.status = "active"
Workspace.planCode = invoice.planCode
AuditLog.action = "billing.payment_succeeded"
```

## Webhook Handler Requirements

The webhook route must read the raw request body first. Do not call `request.json()` before signature verification, because signature verification must use the original body bytes/string.

Next.js route handler shape:

```ts
import crypto from "node:crypto";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-paystack-signature") ?? "";
  const expected = crypto
    .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY!)
    .update(rawBody)
    .digest("hex");

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const event = JSON.parse(rawBody);
  // Store event before processing. Then process idempotently by reference/event.
  return NextResponse.json({ ok: true });
}
```

Implementation detail: guard `timingSafeEqual` against unequal buffer lengths before comparing, otherwise Node throws.

## Environment Variables

```txt
PAYSTACK_PUBLIC_KEY=pk_live_...
PAYSTACK_SECRET_KEY=sk_live_...
PAYSTACK_WEBHOOK_SECRET=sk_live_... # use PAYSTACK_SECRET_KEY if following Paystack signature docs directly
PAYSTACK_BASE_URL=https://api.paystack.co
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_live_...
PAYSTACK_CALLBACK_URL=https://decode.com.ng/billing/paystack/callback
```

The secret key must never be exposed to client components. The public key can be used by Popup JS if Decode chooses the popup flow, but transaction initialization must still happen on the server.

## UI Changes

Replace the manual OPay and WhatsApp proof panel with:

- "Pay with card or transfer" primary button.
- Checkout loading state.
- Redirect to Paystack `authorization_url` or open Paystack Popup using the server-generated access code.
- Payment status page at `/billing/paystack/callback`.
- "Payment pending" state when callback arrives before webhook or verification settles.
- Invoice receipt view after successful verification.
- Admin/support view listing payment intents, invoices, provider reference, status, and request ID.

Keep WhatsApp support as a fallback contact method, not as the payment proof mechanism.

## Testing Plan

Use Paystack test keys in preview and local development.

Card/checkout tests:

- [ ] Initialize transaction returns checkout URL and stores pending intent.
- [ ] Callback with valid reference verifies and activates plan.
- [ ] Callback with unknown reference returns safe pending/failure UI.
- [ ] Verify response with wrong amount does not activate invoice.
- [ ] Verify response with wrong currency does not activate invoice.
- [ ] Replayed callback does not double-activate plan.
- [ ] Webhook `charge.success` is idempotent.
- [ ] Webhook with invalid signature returns 401.

DVA tests:

- [ ] Customer record exists before DVA assignment.
- [ ] Test mode uses supported Paystack test bank value.
- [ ] DVA assignment success webhook stores account details.
- [ ] Transfer payment webhook reconciles against workspace/customer.
- [ ] Replayed DVA webhook does not duplicate payment ledger entries.

## Release Checklist

- [ ] Paystack live account is approved and verified.
- [ ] Production callback URL is configured.
- [ ] Production webhook URL is configured in Paystack dashboard.
- [ ] `PAYSTACK_SECRET_KEY` and `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` are set in Vercel production.
- [ ] Payment tables are migrated.
- [ ] Pricing page no longer displays manual OPay instructions as primary payment.
- [ ] Payment activation is server-side only.
- [ ] Webhook signature verification uses raw body.
- [ ] Payment verification validates reference, amount, currency, invoice, and workspace.
- [ ] Audit log records payment success, failure, refund, and manual override.
- [ ] Admin can inspect payment state without reading raw sensitive payloads.
- [ ] Refund/dispute manual process is documented before high-volume launch.

## What To Know By Heart

Never activate a plan from a frontend callback alone. Always verify the transaction with Paystack from Decode's server.

Always store a Decode-generated reference before sending the user to Paystack. The reference is the join point between Paystack events and Decode invoices.

Paystack amounts use the currency subunit. For NGN, NGN 6,000 is `600000` kobo.

Webhook processing must be idempotent. A provider can send the same event more than once.

## What To Recognize

Recognize the difference between checkout and DVA. Checkout is the first self-serve payment flow. DVA is a repeat bank-transfer account assigned to a customer.

Recognize payment drift. If Paystack says success but amount, currency, reference, or workspace does not match Decode's pending intent, do not activate.

Recognize callback timing. The customer can return before the webhook arrives, after the webhook arrives, or not return at all. The ledger must handle all three paths.

## Lookup Only

Lookup Paystack's current test card numbers, test bank provider slugs, supported DVA banks, final fee schedule, refund/dispute endpoints, and account category requirements immediately before implementation.
