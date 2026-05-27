# Decode Public API System

Checked: 2026-05-26

## Executive Decision

Decode should not expose the current browser-session API as a public API. The public API should be a separate product surface with API keys, scopes, rate limits, versioning, idempotency, audit logs, usage metering, and support expectations.

The correct first public API is small: static QR generation, link verification, scan decoding, and read-only public metadata. Saved dynamic QR codes, landing pages, assets, analytics, and workspace mutations should remain session-only until billing, quotas, and abuse controls are implemented.

## When We Need A Public API

Build the public API when at least one of these conditions is true:

- A paying partner needs server-to-server QR generation, scan decoding, or link verification inside their own product.
- Decode needs usage-based billing or partner quotas instead of manual operator workflows.
- Agencies, ecommerce operators, schools, hotels, or SaaS tools need to create QR codes in bulk from their own backend.
- Support is repeatedly handling the same manual API-like workflow for clients.
- Decode's own frontend has stabilized enough that backend API contracts will not churn every week.

Do not build the full public API only because the internal routes exist. An internal route assumes a trusted browser session, same-origin cookies, and Decode UI constraints. A public API assumes unknown clients, malformed requests, leaked credentials, retry storms, and clear support obligations.

## Current State

The `/api` documentation page describes the integration surface and distinguishes public utility examples from session-bound write examples. The current route families include QR creation and rendering, link verification, image scanning, landing pages, assets, reviews, dashboard data, admin routes, and dynamic redirects.

The safe public candidates today are:

| Capability | Current route family | Public readiness | Reason |
| --- | --- | --- | --- |
| Static QR payload generation | `/api/qr-codes` with `save: false` | Phase 1 | Does not require storing workspace data when used as a stateless render/payload operation. |
| Link verification | `/api/links/verify` | Phase 1 | Useful as a bounded utility API with rate limits and validation. |
| QR image decoding | `/api/scans/image` | Phase 1 | Useful for partner upload workflows if file size, MIME type, and rate limits are enforced. |
| Dynamic QR creation | `/api/qr-codes` with `save: true` | Phase 2 | Requires workspace ownership, billing limits, abuse controls, and lifecycle operations. |
| QR render for saved dynamic codes | `/api/qr-codes/[id]/render` | Phase 2 | Requires workspace authorization and export quotas. |
| Landing pages and assets | `/api/landing-pages`, `/api/assets/*` | Phase 2 | Requires asset scanning, storage quotas, ownership checks, and content moderation. |
| Analytics | `/api/qr-codes/[id]/analytics`, dashboard routes | Phase 3 | Requires privacy rules, aggregation limits, and customer-specific access policies. |
| Admin APIs | `/api/admin/*` | Never public | These are back-office APIs only. |

## Public API Boundary

The public API should live under a versioned namespace:

```txt
/api/v1/qr/static
/api/v1/links/verify
/api/v1/scans/image
/api/v1/qr/dynamic
/api/v1/qr/{id}/render
/api/v1/landing-pages
```

The browser workspace API can continue using the existing routes. The public API layer can call the same service functions, but it must have its own route handlers, schemas, auth guard, rate limiter, response mapper, and audit events.

This separation keeps the UI free to evolve while giving partners a stable contract.

## Authentication

Use server-side API keys only. Do not support public API keys from browser JavaScript.

API key format:

```txt
dec_live_<workspacePrefix>_<randomSecret>
dec_test_<workspacePrefix>_<randomSecret>
```

Store only the secret hash. Store the visible prefix, environment, workspace ID, scopes, name, createdAt, lastUsedAt, revokedAt, createdByUserId, and optional expiresAt.

Suggested model:

```prisma
model ApiKey {
  id              String    @id @default(cuid())
  workspaceId     String
  name            String
  environment     String
  prefix          String    @unique
  secretHash      String
  scopes          String[]
  rateLimitTier   String
  createdByUserId String
  createdAt       DateTime  @default(now())
  lastUsedAt      DateTime?
  revokedAt       DateTime?
  expiresAt       DateTime?
}
```

Requests should use:

```http
Authorization: Bearer dec_live_...
Content-Type: application/json
Idempotency-Key: optional-client-generated-key
X-Request-Id: optional-client-trace-id
```

## Scopes

Scopes should be narrow and readable:

```txt
qr.static:create
qr.dynamic:create
qr.dynamic:read
qr.dynamic:update
qr.dynamic:render
links.verify:create
scans.image:create
landing-pages:create
landing-pages:update
assets:create
analytics:read
webhooks:manage
```

Every public route must declare one required scope. Avoid broad scopes like `workspace:write` because they make leaked API keys too damaging.

## Response Contract

Keep the existing Decode response envelope:

```json
{
  "ok": true,
  "data": {},
  "requestId": "req_..."
}
```

Errors should stay machine-readable:

```json
{
  "ok": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed.",
    "fields": {
      "content.url": ["Enter a valid URL."]
    }
  },
  "requestId": "req_..."
}
```

Standard error codes:

| Code | HTTP | Meaning |
| --- | ---: | --- |
| `VALIDATION_ERROR` | 400 | Request shape or field value is invalid. |
| `UNAUTHORIZED` | 401 | API key is missing or invalid. |
| `FORBIDDEN` | 403 | API key exists but lacks the required scope. |
| `NOT_FOUND` | 404 | Resource does not exist in the authenticated workspace. |
| `CONFLICT` | 409 | Duplicate or stale operation. |
| `RATE_LIMITED` | 429 | Client exceeded quota or burst limit. |
| `INTERNAL_ERROR` | 500 | Decode failed after accepting a valid request. |

## Idempotency

All public write endpoints should accept `Idempotency-Key`. The idempotency record should be scoped by workspace ID, route, method, and key.

Suggested model:

```prisma
model ApiIdempotencyKey {
  id             String   @id @default(cuid())
  workspaceId    String
  method         String
  path           String
  key            String
  requestHash    String
  responseStatus Int
  responseBody   Json
  createdAt      DateTime @default(now())
  expiresAt      DateTime

  @@unique([workspaceId, method, path, key])
}
```

If the same key is reused with the same request hash, return the stored response. If the same key is reused with a different request hash, return `409 CONFLICT`.

## Rate Limits And Quotas

Use layered limits:

| Layer | Example |
| --- | --- |
| IP burst | 60 requests per minute for unauthenticated public utility probes. |
| API key burst | 300 requests per minute for paid partners. |
| Workspace daily quota | Plan-specific total requests. |
| Endpoint quota | Separate scan image uploads from lightweight link checks. |
| Storage quota | Assets and saved QR exports by workspace. |

Rate limit responses must include enough headers for clients to back off:

```http
X-RateLimit-Limit: 300
X-RateLimit-Remaining: 247
X-RateLimit-Reset: 1716726000
Retry-After: 30
```

## Public Endpoint Phases

### Phase 1: Public Utilities

Ship this first:

```txt
POST /api/v1/qr/static
POST /api/v1/links/verify
POST /api/v1/scans/image
GET  /api/v1/health
```

Acceptance criteria:

- API keys can be created and revoked from the Decode workspace UI.
- Requests require API key auth except `health`.
- Scopes are enforced.
- Rate limits are active.
- Request IDs are returned and logged.
- Smoke tests cover successful request, validation error, missing key, wrong scope, and rate limit path.

### Phase 2: Saved Workspace Resources

Add:

```txt
POST /api/v1/qr/dynamic
GET  /api/v1/qr/{id}
PATCH /api/v1/qr/{id}
POST /api/v1/qr/{id}/render
POST /api/v1/landing-pages
PATCH /api/v1/landing-pages/{id}
POST /api/v1/assets/presign
POST /api/v1/assets/{id}/confirm
```

Acceptance criteria:

- All resources are workspace-scoped.
- Dynamic QR creation enforces plan limits.
- Asset upload quotas and MIME checks are enforced.
- Every mutation writes an audit event.
- Idempotency is active for create and render operations.

### Phase 3: Partner Operations

Add:

```txt
GET  /api/v1/qr/{id}/analytics
POST /api/v1/webhook-endpoints
DELETE /api/v1/webhook-endpoints/{id}
GET  /api/v1/usage
```

Acceptance criteria:

- Analytics are aggregated and privacy-safe.
- Webhook delivery has signing, retries, and delivery logs.
- Usage reporting matches billing.
- Public docs include copyable examples, SDK-ready snippets, and error examples.

## Webhooks

Decode should publish outbound webhooks only after the public API is paid or partner-facing.

Events:

```txt
qr.created
qr.updated
qr.scan.recorded
landing_page.published
asset.ready
payment.succeeded
payment.failed
```

Delivery rules:

- Sign each webhook with HMAC SHA-256 using a per-endpoint secret.
- Include `Decode-Signature`, `Decode-Timestamp`, `Decode-Event-Id`, and `Decode-Delivery-Id`.
- Retry for transient `5xx` and timeout failures.
- Do not retry permanent `4xx` responses except `429`.
- Store delivery attempts for support.

## Operational Checklist

Before public launch:

- [ ] API key model and management UI exist.
- [ ] Key secrets are hashed and shown only once.
- [ ] Route namespace is versioned.
- [ ] Public routes do not depend on browser cookies.
- [ ] Every route declares required scopes.
- [ ] Zod schemas validate request and response payloads.
- [ ] Rate limits are active in production.
- [ ] Idempotency is implemented for writes.
- [ ] Request IDs are included in logs and responses.
- [ ] Abuse telemetry is visible in Sentry or Vercel logs.
- [ ] API examples include JS, TS, Python, and cURL.
- [ ] Public docs state limits, auth, errors, and support boundaries.
- [ ] Pricing or partner contract defines quota and support terms.

## What To Know By Heart

Public API does not mean "open the internal routes." It means a stable contract with authentication, authorization, quotas, idempotency, logging, and support.

Saved resources must always be workspace-scoped. A leaked API key should only affect the scopes assigned to that key.

Callbacks and webhooks are not the same thing. API clients call Decode; webhooks are Decode calling them.

## What To Recognize

Recognize API key leakage patterns: browser usage, screenshots, copied docs with live keys, public GitHub commits, and shared Postman workspaces.

Recognize retry storms: repeated client timeouts, repeated create requests without idempotency, and webhook receivers returning slow `5xx` responses.

Recognize contract drift: UI route changes, response field renames, and undocumented optional fields becoming required.

## Lookup Only

Lookup exact plan quotas, final endpoint paths, supported image MIME limits, webhook retry schedule, and billing packaging at implementation time.

