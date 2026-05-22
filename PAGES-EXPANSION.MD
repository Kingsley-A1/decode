# Decode Pages Expansion Plan

## Executive Decision

The conventional answer is to add more landing-page template cards for schools, restaurants, hotels, and institutions.

The stronger strategic answer is to turn Pages into a template operating system: searchable user-facing templates, owned asset packs, predictable preview behavior, and an admin-managed template catalog that can publish new templates into `/landing-pages` without a code deploy for every content change.

This plan keeps the current Decode product direction: light sky UI, dynamic QR destinations, R2-backed media uploads, mobile-first previews, accessible public pages, and dashboard/admin visibility.

## What UI-CLEANUP.MD Means For Pages

The Pages expansion must follow the cleanup principles already defined:

- Templates are choice controls, not long reading sections.
- Preview should appear early and remain stable.
- Operational screens should feel like tools, not marketing pages.
- Mobile must not force users through long vertical friction before seeing the result.
- Touch targets must stay at least `44x44px`.
- Keyboard users must be able to search, filter, select, edit, preview, save, and publish.
- Images need real labels, predictable dimensions, lazy loading, and no layout shift.

The current Pages feature is structurally correct, but still basic:

- Existing route: `/landing-pages`.
- Existing builder: `components/landing-pages/LandingPageBuilder.tsx`.
- Existing preview: `components/landing-pages/LandingPagePreview.tsx`.
- Existing static template list: `components/landing-pages/landing-page-data.ts`.
- Existing backend: `server/landing-pages/*`.
- Existing content types: profile, business, links, menu, coupon, event, feedback, PDF, images, video link, audio link.

## Product Model

### Current Model

```text
Landing page type -> hard-coded form -> hard-coded preview -> saved landing page
```

This works, but it does not scale well for many industries.

### Target Model

```text
Template catalog -> template preset -> stable page type -> typed form -> live preview -> saved landing page
```

Important distinction:

- Page type: the structural renderer, such as `menu`, `business`, `event`, `pdf`, or `images`.
- Template preset: the professional starting point, such as `School Admissions`, `Hotel Concierge`, `Restaurant Menu`, or `Clinic Appointment`.

This avoids creating too many custom renderers too early. Most new templates can map to existing page types or to a small number of new composable page types.

## Goals

- Make `/landing-pages` feel like a professional template gallery and page builder.
- Let users search templates by use case, institution type, industry, and content need.
- Add high-quality templates for individuals, schools, restaurants, hotels, institutions, and local businesses.
- Add owned visual assets where images improve trust or comprehension.
- Keep public pages accessible, fast, and mobile-first.
- Let admins create, edit, preview, publish, archive, and reorder templates.
- Make admin-published templates appear in `/landing-pages` without hard-coding every template in React.
- Preserve predictable behavior when switching templates.

## Non-Goals

- Do not turn Pages into a full website builder in this phase.
- Do not add arbitrary drag-and-drop blocks before the data model is stable.
- Do not use unlicensed stock images.
- Do not create one-off renderers for every industry unless the content structure requires it.
- Do not let admin templates inject unsafe HTML, scripts, external CSS, or unvalidated asset URLs.

## Template Expansion Strategy

### Template Categories

Use these top-level categories in the user-facing template gallery:

- Popular
- Personal
- Business
- Restaurant
- Hotel
- School
- Event
- Retail
- Healthcare
- Real Estate
- Nonprofit
- Religious Institution
- Government And Public Service
- Media
- Documents
- Feedback

### User-Facing Template Metadata

Every template should have:

- Name
- Short one-line purpose
- Category
- Industry
- Tags
- Page type
- Default content
- Required fields
- Optional fields
- Required asset slots
- Preview thumbnail
- Mobile preview screenshot
- Accessibility notes
- Recommended QR use case
- Publish status
- Sort priority

Example:

```ts
{
  key: "school-admissions",
  name: "School Admissions",
  category: "School",
  industry: "Education",
  type: "business",
  tags: ["school", "admissions", "application", "prospectus"],
  requiredFields: ["businessName", "description", "website"],
  requiredAssets: ["logo"],
  recommendedFor: "Flyers, open days, school banners, admission campaigns"
}
```

## Template Catalog

### Personal Templates

- Personal Profile
  - Type: `profile`
  - Best for: identity QR, bio, social links
  - Images needed: avatar
- Portfolio
  - Type: `links` or new `portfolio`
  - Best for: designers, developers, creators
  - Images needed: profile image, optional project thumbnails
- Digital CV
  - Type: `pdf`
  - Best for: job seekers, consultants, speakers
  - Images needed: optional avatar, PDF document
- Creator Link Hub
  - Type: `links`
  - Best for: social links, videos, storefronts, community links
  - Images needed: avatar or brand mark
- Speaker Page
  - Type: `event` or `profile`
  - Best for: conference badges, event brochures
  - Images needed: speaker portrait

### Business Templates

- Business Card
  - Type: `business`
  - Best for: contact details, website, call, email
  - Images needed: logo
- Service Booking
  - Type: `links`
  - Best for: appointment businesses
  - Images needed: brand logo, optional service image
- Product Info
  - Type: new `product` or `business`
  - Best for: packaging QR, warranty, manuals
  - Images needed: product image
- Price List
  - Type: `menu`
  - Best for: salons, repair services, studios
  - Images needed: logo, optional service image
- Customer Feedback
  - Type: `feedback`
  - Best for: post-service reviews and support forms
  - Images needed: logo

### Restaurant Templates

- Restaurant Menu
  - Type: `menu`
  - Best for: table QR, window QR, takeaway menu
  - Images needed: logo, optional hero food image
- Daily Specials
  - Type: `menu` or `coupon`
  - Best for: rotating offers
  - Images needed: dish photo
- Reservation Page
  - Type: `links`
  - Best for: bookings, WhatsApp, phone, maps
  - Images needed: venue image
- Delivery Links
  - Type: `links`
  - Best for: Bolt Food, Glovo, Chowdeck, direct ordering
  - Images needed: logo
- Restaurant Coupon
  - Type: `coupon`
  - Best for: flyer offers, loyalty campaigns
  - Images needed: optional food image

### Hotel Templates

- Hotel Welcome
  - Type: `business`
  - Best for: lobby QR, guest arrival
  - Images needed: hotel exterior or lobby image, logo
- Room Directory
  - Type: `links`
  - Best for: room service, Wi-Fi, reception, spa, restaurant
  - Images needed: room image or logo
- Concierge Guide
  - Type: `links`
  - Best for: local attractions, transport, hotel services
  - Images needed: destination or hotel image
- Booking Page
  - Type: `business`
  - Best for: direct booking and contact
  - Images needed: room image
- Guest Feedback
  - Type: `feedback`
  - Best for: checkout QR, room QR
  - Images needed: logo
- Event Hall
  - Type: `event` or `business`
  - Best for: venue marketing
  - Images needed: hall image

### School Templates

- School Admissions
  - Type: `business`
  - Best for: admission campaigns and open days
  - Images needed: school logo, OPTIONAL BUT NEEDED campus image
- School Notice Board
  - Type: `links`
  - Best for: parent updates, calendars, fee links, portals
  - Images needed: school logo
- Open Day Event
  - Type: `event`
  - Best for: school visits and enrollment events
  - Images needed: campus or event image
- Staff Profile
  - Type: `profile`
  - Best for: teacher profile, department contact
  - Images needed: staff portrait
- School Prospectus
  - Type: `pdf`
  - Best for: downloadable admissions document
  - Images needed: PDF cover preview
- Alumni Registration
  - Type: `feedback` or `links`
  - Best for: alumni forms and community links
  - Images needed: school logo
- Library Resources
  - Type: `links`
  - Best for: student resource links
  - Images needed: optional library image

### Healthcare Templates

- Clinic Profile
  - Type: `business`
  - Best for: clinic contact, hours, location
  - Images needed: clinic logo, reception image
- Appointment Booking
  - Type: `links`
  - Best for: booking, WhatsApp, call, maps
  - Images needed: logo
- Doctor Profile
  - Type: `profile`
  - Best for: consultant profile QR
  - Images needed: doctor portrait
- Patient Information PDF
  - Type: `pdf`
  - Best for: instructions, preparation guides, policies
  - Images needed: PDF asset
- Feedback And Complaints
  - Type: `feedback`
  - Best for: patient service feedback
  - Images needed: logo

### Religious Institution Templates

- Church Information
  - Type: `business`
  - Best for: service times, address, contact
  - Images needed: logo, building image
- Service Program
  - Type: `event`
  - Best for: worship program, special service
  - Images needed: event image
- Giving And Donation Links
  - Type: `links`
  - Best for: online giving and bank/payment links
  - Images needed: logo
- Sermon Audio
  - Type: `audio_link`
  - Best for: audio message sharing
  - Images needed: optional cover image

### Government And Public Service Templates

- Office Service Directory
  - Type: `links`
  - Best for: public office links, forms, help desks
  - Images needed: official logo or building image
- Public Notice
  - Type: `pdf` or `links`
  - Best for: notices, regulations, forms
  - Images needed: PDF
- Citizen Feedback
  - Type: `feedback`
  - Best for: complaint and service feedback forms
  - Images needed: logo
- Event Registration
  - Type: `event`
  - Best for: town halls, workshops, public meetings
  - Images needed: event banner

### Real Estate Templates

- Property Listing
  - Type: new `property` or `images`
  - Best for: house signs, agent flyers
  - Images needed: property hero, gallery images
- Agent Profile
  - Type: `profile`
  - Best for: agent business cards
  - Images needed: agent portrait
- Inspection Event
  - Type: `event`
  - Best for: open house visits
  - Images needed: property image

### Retail And Ecommerce Templates

- Product Warranty
  - Type: `pdf` or new `product`
  - Best for: packaging QR
  - Images needed: product image, PDF
- Product Catalog
  - Type: `pdf` or `images`
  - Best for: store campaigns
  - Images needed: catalog PDF or product gallery
- Promo Coupon
  - Type: `coupon`
  - Best for: store flyers
  - Images needed: product or brand image
- Store Links
  - Type: `links`
  - Best for: marketplace, WhatsApp, Instagram, website
  - Images needed: logo

## New Page Types To Consider

Do not add all of these immediately. Add only when existing types cannot express the content cleanly.

### `institution`

For schools, churches, clinics, hotels, NGOs, public offices.

Fields:

- institutionName
- category
- summary
- logoAssetId
- heroAssetId
- address
- phone
- email
- website
- openingHours
- primaryAction
- secondaryLinks

### `product`

For packaging, warranty, manuals, product pages.

Fields:

- productName
- brandName
- summary
- heroAssetId
- gallery
- manualPdfAssetId
- warrantyUrl
- supportUrl
- buyUrl

### `property`

For real estate listings.

Fields:

- propertyTitle
- address
- price
- bedrooms
- bathrooms
- size
- heroAssetId
- gallery
- agentName
- phone
- viewingUrl

### `program`

For schools, churches, events, training centers.

Fields:

- programName
- organizationName
- dateOrSchedule
- location
- description
- agenda
- registrationUrl
- contactLinks

## Image And Asset Strategy

### Core Rule

Decode should own or generate its template assets. Do not depend on random stock images, scraped images, or brand assets without rights.

### Asset Sources

Use these sources in order:

1. Original Decode-created graphics and template thumbnails.
2. Commissioned or internally produced photography.
3. AI-generated images with internal review and no trademarked subjects.
4. User-uploaded assets for their own pages.
5. Licensed asset packs only when license terms are saved and tracked.

### Asset Types Needed

Every professional template needs some combination of:

- Template thumbnail
- Mobile preview screenshot
- Optional hero image
- Optional logo placeholder
- Optional gallery placeholder
- Optional PDF cover placeholder
- Optional audio cover image
- Category icon
- Empty asset placeholder

### Required Dimensions

- Template thumbnail: `800x500`, WebP/AVIF, target under `120KB`.
- Mobile preview screenshot: `390x844`, WebP/AVIF, target under `180KB`.
- Hero image: `1600x900`, WebP/AVIF, target under `250KB`.
- Logo placeholder: SVG or PNG, square, target under `40KB`.
- Gallery image: `1200x800`, WebP/AVIF, target under `180KB`.
- PDF cover thumbnail: `800x1100`, WebP/AVIF, target under `150KB`.
- Category icon: SVG, single-color compatible, `24x24` viewBox.

### Asset Metadata

Every asset must store:

- Alt text
- Caption
- Credit or source
- License type
- Generated by
- Created date
- Review status
- Dominant color
- Width
- Height
- File size
- Content type
- Purpose

### Initial Owned Asset Packs

#### Education Pack

Images needed:

- Campus exterior
- Classroom
- Students studying
- Library/resource center
- School event/open day
- Prospectus PDF cover

Templates covered:

- School Admissions
- School Notice Board
- Open Day Event
- School Prospectus
- Library Resources

#### Restaurant Pack

Images needed:

- Restaurant interior
- Plated meal
- Coffee/breakfast
- Menu board
- Delivery/takeaway package
- Coupon background image

Templates covered:

- Restaurant Menu
- Daily Specials
- Reservation Page
- Delivery Links
- Restaurant Coupon

#### Hotel Pack

Images needed:

- Hotel exterior
- Lobby
- Guest room
- Restaurant/bar
- Concierge/local guide
- Event hall

Templates covered:

- Hotel Welcome
- Room Directory
- Concierge Guide
- Booking Page
- Guest Feedback
- Event Hall

#### Institutional Pack

Images needed:

- Public office reception
- Clinic reception
- Church auditorium
- NGO field work
- Training room
- Community event

Templates covered:

- Clinic Profile
- Appointment Booking
- Church Information
- Office Service Directory
- NGO Campaign
- Public Notice

#### Retail And Product Pack

Images needed:

- Product packaging
- Product shelf
- Warranty card
- Catalog spread
- Promo/product display

Templates covered:

- Product Warranty
- Product Catalog
- Promo Coupon
- Store Links

## User-Facing Template Gallery

### Layout

Desktop:

- Left filter rail or compact top filter bar.
- Search input at the top.
- Category tabs.
- Template grid with stable card dimensions.
- Sticky preview/details panel after selecting a template.

Mobile:

- Search input first.
- Horizontal category chips.
- Template cards in a single-column or compact two-column grid depending on width.
- Preview drawer or inline preview tray.
- Primary action always visible after selection: `Use template`.

### Template Card

Each card should show:

- Thumbnail image
- Template name
- Category
- One-line purpose
- Asset requirement badges: `Logo`, `Hero`, `PDF`, `Gallery`, `Audio`
- Best-for tag
- `Use template` button

Do not put long descriptions in cards. Put details in the selected template panel.

### Search Behavior

Search should match:

- Template name
- Category
- Industry
- Tags
- Page type
- Recommended use case

Examples:

- `school`
- `admission`
- `hotel`
- `menu`
- `coupon`
- `church`
- `clinic`
- `feedback`
- `pdf`
- `real estate`

Search requirements:

- Debounced client search for already-loaded catalog.
- Server search once templates are DB-backed and numerous.
- Empty state with clear recovery: `Try school, hotel, menu, coupon, event, PDF`.
- Keyboard focus remains in search after filtering.
- Results count announced with an `aria-live` region.

### Filters

Filters:

- Category
- Industry
- Asset type
- Page type
- Popular/new
- Free/pro if pricing arrives later

Filter behavior:

- Filters combine predictably with search.
- Active filters are visible as removable chips.
- `Clear filters` is available and keyboard accessible.

## Predictable Template Behavior

### Switching Templates

When a user changes templates:

- If no fields were edited, replace content with the new template defaults.
- If fields were edited, show a confirmation dialog:
  - `Keep my content and change layout`
  - `Replace with template defaults`
  - `Cancel`
- Preserve shared fields where safe, such as title, phone, email, website, address, links.
- Never silently delete uploaded assets.

### Draft And Publish

Draft:

- Allows incomplete optional fields.
- Requires title, page type, and QR attachment if the current backend still requires it.

Publish:

- Requires all template-required fields.
- Requires required assets.
- Requires valid URLs.
- Requires accessible labels for images, PDF, audio, and buttons.

### Preview Stability

- Preview frame must have stable dimensions.
- Image slots reserve aspect ratio before upload.
- Template switching must not cause horizontal overflow.
- Mobile preview should appear before long forms.
- Desktop preview should stay sticky without covering page controls.

## Admin Template System

### Admin Requirements

Admins should be able to:

- Create templates.
- Edit templates.
- Upload template thumbnails and preview assets.
- Set category, industry, tags, and sort order.
- Define required fields.
- Define required asset slots.
- Choose the base page type.
- Provide default content.
- Preview mobile and desktop output before publishing.
- Publish, archive, or restore templates.
- See template usage counts.
- See audit history for template changes.

### Admin Safety Rules

- Admin templates cannot inject arbitrary HTML.
- Admin templates cannot reference unapproved external images.
- Admin templates must use owned, uploaded, or licensed assets.
- Published templates must pass schema validation.
- Published templates must have alt text for every non-decorative image.
- Template publishing must create an audit event.
- Template assets must go through the same R2 asset flow.

### Admin Routes

Add:

- `/admin/templates`
- `/admin/templates/new`
- `/admin/templates/[id]`
- `/admin/templates/[id]/edit`
- `/admin/template-assets`

### Admin APIs

Add:

- `GET /api/admin/templates`
- `POST /api/admin/templates`
- `GET /api/admin/templates/[id]`
- `PATCH /api/admin/templates/[id]`
- `POST /api/admin/templates/[id]/publish`
- `POST /api/admin/templates/[id]/archive`
- `GET /api/landing-page-templates`

Optional later:

- `POST /api/admin/templates/[id]/duplicate`
- `POST /api/admin/templates/[id]/preview`
- `GET /api/admin/templates/[id]/usage`

## Proposed Database Model

### `LandingPageTemplate`

Fields:

- `id`
- `key`
- `name`
- `summary`
- `category`
- `industry`
- `type`
- `status`
- `tags`
- `defaultContent`
- `fieldSchema`
- `requiredFields`
- `requiredAssetSlots`
- `styleTokens`
- `thumbnailAssetId`
- `previewAssetId`
- `heroAssetId`
- `sortOrder`
- `version`
- `createdByAdminId`
- `updatedByAdminId`
- `publishedAt`
- `archivedAt`
- `createdAt`
- `updatedAt`
- `deletedAt`

Indexes:

- `[status, category, sortOrder]`
- `[industry, status]`
- `[type, status]`
- unique `key`

### `LandingPageTemplateAsset`

Fields:

- `id`
- `templateId`
- `assetId`
- `slot`
- `alt`
- `caption`
- `licenseType`
- `source`
- `createdAt`

### `LandingPageTemplateUsage`

Fields:

- `id`
- `templateId`
- `workspaceId`
- `landingPageId`
- `qrCodeId`
- `usedAt`

Use this later for popular templates and admin reporting.

## Frontend Implementation Plan

### Layout Correction Note - May 22, 2026

The previous completion status for the user-facing template gallery is superseded by a fresh rendered baseline captured on `http://localhost:3000/landing-pages`. Current metrics show the gallery is not production-ready: `390x844` overflows horizontally by `1242px`, `768x1024` overflows by `880px`, and desktop/wide viewports avoid document overflow only by compressing the template grid to four `148.5px` columns with `123px` thumbnails and six truncated labels.

Treat the earlier Phase 2 layout readiness claims as blocked until the updated acceptance targets pass: document/body overflow `<= 2px` at `390x844`, `768x1024`, `1366x900`, and `1536x900`; mobile grid one column; tablet grid two columns; desktop cards at least `220px` wide with thumbnails at least `180px` wide; template search visible in the first viewport; labels and buttons unclipped; and category chip overflow contained inside its own rail only.

### Phase 1 And 2 Review - May 20, 2026

Status: completed and cleaned for the current static-template slice. Evidence reviewed in the current codebase:

- `components/landing-pages/landing-page-template-types.ts` separates template catalog metadata from landing-page content types.
- `components/landing-pages/landing-page-data.ts` exports `defaultLandingPageTemplatePresets` with deterministic keys, categories, industry labels, status, sort priority, tags, flags, required fields, optional fields, asset requirements, default content, thumbnail metadata, mobile preview metadata, and accessibility notes.
- `components/landing-pages/LandingPageBuilder.tsx` includes debounced template search, category chips, page-type filtering, media filtering, popular/new filtering, active filter chips, clear filters, filtered template cards, selected-template details, result count announcement, empty state, and `Use template` loading behavior.
- `tests/smoke/release.spec.ts` includes a mobile smoke test for searching `school`, `restaurant`, `hotel`, `coupon`, `event`, and `pdf`, combined filtering, clearing filters, category filtering, selection, and preset loading.

Verification run:

- `npm run lint` passed.
- `npm run typecheck` passed.
- `npm run test` passed: 18 files, 61 tests.
- `npx playwright test tests/smoke/release.spec.ts:107` passed against the existing local server.
- `npm run build` passed.

What remains, but is outside Phase 1 and 2:

- Full hero/gallery/PDF/media assets still need to be generated from `PAGES-IMAGE-REQUIREMENTS.md` before every template can feel fully premium.
- `Use template` immediately replaces current content. Phase 4 must add dirty-state confirmation and shared-field preservation before this is production-safe.
- Required asset metadata and required field metadata exist, but template-specific required assets are not enforced as a publish checklist yet.
- The category model currently compresses religious, public service, and nonprofit templates into `institution`; acceptable for the static slice, but the admin catalog should support the fuller category set.

### Phase 1: Template Catalog Data Model

- [x] Add template catalog types separate from landing page content types.
- [x] Rename current static `landingPageTemplates` concept to `defaultLandingPageTemplatePresets`.
- [x] Add template category, industry, tags, asset requirements, and thumbnail metadata.
- [x] Add status, sort priority, required fields, optional fields, flags, mobile preview metadata, and accessibility notes.
- [x] Keep existing hard-coded templates as seed templates.
- [x] Add deterministic template keys.

Acceptance criteria:

- [x] Current templates still render.
- [x] Template metadata supports search and filtering.
- [x] Existing tests still pass.

### Phase 2: Professional Template Gallery

- [x] Add search input above the builder.
- [x] Add category chips.
- [x] Add page-type, media, and popular/new filters.
- [x] Add active filter chips and `Clear filters`.
- [x] Debounce client-side search for the loaded catalog.
- [x] Add filtered template cards.
- [x] Add selected-template details panel.
- [x] Add `Use template` behavior.
- [x] Add empty search state.
- [x] Add keyboard and screen-reader support for result counts.

Acceptance criteria:

- [x] Users can search for `school`, `restaurant`, `hotel`, `coupon`, `event`, and `pdf`.
- [ ] BLOCKED: Template cards do not resize unpredictably. May 22 baseline shows desktop/wide cards compressed to `149px` with `123px` thumbnails.
- [ ] BLOCKED: Mobile has no horizontal overflow. May 22 baseline shows `1242px` horizontal overflow at `390x844` and `880px` at `768x1024`.
- [x] Search and filter controls are keyboard accessible.

### Phase 3: Expanded Static Template Presets

- [x] Add school presets.
- [x] Add restaurant presets.
- [x] Add hotel presets.
- [x] Add healthcare presets.
- [x] Add religious institution presets.
- [x] Add government/public service presets.
- [x] Add real estate presets.
- [x] Add retail/product presets.
- [x] Add owned placeholder thumbnails.

Acceptance criteria:

- [x] At least 30 professional AND CLEAN templates are available.
- [x] Every template maps to a validated page type.
- [x] Every template has a thumbnail, tags, category, and required asset metadata.

Phase 3 completion note - May 20, 2026:

- Static catalog now has 36 presets, covering all first-30 target use cases plus existing media/document presets.
- Missing first-30 presets added: Digital business card, Portfolio, Digital CV, Service Booking, Product Info, Daily Specials, Delivery Links, Restaurant Coupon, Hotel Concierge, Hotel Booking, Guest Feedback, Open Day Event, School Prospectus, Alumni Registration, Clinic Profile, and Office Service Directory.
- Category-owned placeholder thumbnails now live under `public/assets/landing-page-templates/thumbnails/` and are rendered in the template cards through `thumbnail.assetPath`.
- Phase 3 still uses existing validated page types only. New page types such as `product`, `property`, or `institution` remain later decisions.

### Phase 4: Preview And Form Predictability

- [x] Add template switch confirmation when user has edited content.
- [x] Preserve shared fields safely.
- [x] Add required field checklist.
- [x] Add required asset checklist.
- [x] Move mobile preview higher in the builder.
- [x] Reserve image aspect ratios in preview.

Acceptance criteria:

- [x] Users do not lose content accidentally when switching templates.
- [x] Required fields are clear before publishing.
- [x] Preview remains stable while templates and assets change.

Phase 4 completion note - May 20, 2026:

- Builder now separates selected template inspection from the active template loaded into the form, so checklist state does not change until a template is applied.
- Edited content triggers a confirmation dialog before applying another template, with options to cancel, preserve shared fields/assets, or replace with template defaults.
- Save readiness now shows required field and asset checklists from the active template metadata, and publish/save remains blocked when required fields or required assets are missing.
- Mobile preview is surfaced above the content editor on small screens; the desktop preview remains sticky on wide layouts.
- Preview image, avatar/logo, and document areas now reserve stable dimensions while assets are missing or loading.

### Phase 5: Admin Template Backend

- [x] Add Prisma models for templates and template assets.
- [x] Add migration.
- [x] Add seed script for first-party templates.
- [x] Add admin APIs.
- [x] Add public `GET /api/landing-page-templates`.
- [x] Add audit events for create, update, publish, archive, restore.
- [x] Add usage tracking when a template is used.

Acceptance criteria:

- [x] Admin-created published templates appear in `/landing-pages`.
- [x] Archived templates disappear from user-facing selection.
- [x] Audit records show template changes.
- [x] Invalid template definitions cannot be published.

Completed notes:

- Added database-backed template catalog, asset requirements, and usage tracking with Prisma models and migration.
- Added first-party template seed script, public template API, admin create/update/list/read APIs, and admin audit events for template lifecycle changes.
- `/landing-pages` now hydrates templates from the public API and sends the selected `templateKey` when creating a landing page.
- Verified with Prisma validation, typecheck, lint, unit tests, production build, and the landing page template gallery smoke test.

### Phase 6: Admin Template Console

- [x] Add `/admin/templates` list page.
- [x] Add create/edit forms.
- [x] Add asset upload controls.
- [x] Add mobile/desktop preview.
- [x] Add guarded publish/archive actions.
- [x] Add template usage count.

Acceptance criteria:

- [x] Admin can create a school template and publish it.
- [x] User can search for that school template in `/landing-pages`.
- [x] Template assets load from the owned asset flow.

Completed notes:

- Added `/admin/templates`, `/admin/templates/new`, `/admin/templates/[id]`, `/admin/templates/[id]/edit`, and `/admin/template-assets`.
- Added `/api/admin/templates` aliases plus guarded publish/archive endpoints while keeping Phase 5 template APIs compatible.
- Added admin-owned template asset uploads through R2 with a public template asset serving endpoint.
- Added create/edit form controls, asset requirement upload controls, readiness checks, mobile and desktop previews, and visible usage counts.
- Verified with Prisma validation, Prisma generate, typecheck, lint, unit tests, production build, and the landing page gallery smoke test.

### Phase 7: Public Page Renderer Upgrade

- [x] Add renderer support for any new page types.
- [x] Improve public page typography and spacing.
- [x] Add optional hero image rendering.
- [x] Add image lazy loading and intrinsic dimensions.
- [x] Add accessible media labels.
- [x] Add no-JS resilient public output.

Acceptance criteria:

- [x] Public pages pass axe with no serious or critical issues.
- [x] Public pages have one clear `h1`.
- [x] Images have useful alt text.
- [x] Media controls are labeled.
- [x] Lighthouse accessibility is 95+.

Completed notes:

- Public renderer now outputs semantic no-JS HTML with one page `h1`, typed sections, labeled link groups, labeled audio media, and safer fallback rendering for proposed `institution`, `product`, `property`, and `program` content shapes.
- Optional hero images and gallery images now support owned asset paths or Decode asset IDs, useful alt text, captions, lazy loading for non-critical images, eager loading for hero media, and intrinsic width/height defaults.
- Public typography, spacing, focus states, CTA contrast, media frames, and responsive image grids were tightened for the lightweight public `/r/[slug]` output.
- Verified with typecheck, lint, unit tests, production build, Playwright axe public-renderer smoke test, and a targeted Lighthouse public-renderer fixture scoring `100` accessibility.

### Phase 8: Quality Gate

- [x] Add unit tests for template schemas.
- [x] Add API tests for admin template CRUD.
- [x] Add Playwright tests for search, filtering, selecting, previewing, and publishing.
- [x] Add mobile screenshots at `390x844`, `768x1024`, `1366x900`.
- [x] Add Lighthouse checks for `/landing-pages` and representative public landing pages.

Acceptance criteria:

- [x] `npm run lint` passes.
- [x] `npm run typecheck` passes.
- [x] `npm run test` passes.
- [x] `npm run smoke:e2e` passes.
- [x] `npm run build` passes.
- [x] No critical text overlap or clipped buttons.

Completed notes:

- May 22, 2026 correction: the verification below is superseded for layout readiness. Fresh rendered metrics show mobile/tablet document overflow and desktop card compression, so `/landing-pages` must not be treated as deployment-ready until the Phase 0 acceptance targets pass again.
- Added stricter landing-page template schema tests for first-party seed publishability, required default content, empty update payload rejection, asset dimensions, mobile preview dimensions, and type-specific content shapes.
- Added admin template API route tests for list, create, invalid create, get, patch, empty patch rejection, publish, and archive. This exposed and fixed a PATCH validation bug where update defaults made `{}` look valid.
- Extended Playwright release smoke coverage for landing-page template publishing and retained search, filtering, selection, template-switch confirmation, shared-field preservation, breakpoint screenshots, axe checks, overflow checks, and clipped-control checks.
- Wired `npm run lhci` to include the existing `/landing-pages` LHCI route plus a representative server-rendered public landing page fixture. Public renderer Lighthouse accessibility scored `100`.
- Verification passed: `npm run lint`, `npm run typecheck`, `npm run test` (20 files, 77 tests), `npm run smoke:e2e` (12 browser tests), `npm run build`, `npm run prisma:validate`, and `npm run lhci`.
- Non-blocking LHCI warnings remain on existing performance budgets: `/generate` performance/TBT, `/dashboard` CLS, and `/landing-pages` TBT. Accessibility assertions passed.

## First 30 Templates To Ship

Ship these first because they cover the highest-value QR use cases:

1. Personal Profile
2. Digital Business Card
3. Creator Link Hub
4. Portfolio
5. Digital CV
6. Business Contact
7. Service Booking
8. Customer Feedback
9. Product Info
10. Product Warranty
11. Restaurant Menu
12. Daily Specials
13. Restaurant Reservation
14. Delivery Links
15. Restaurant Coupon
16. Hotel Welcome
17. Room Directory
18. Hotel Concierge
19. Hotel Booking
20. Guest Feedback
21. School Admissions
22. School Notice Board
23. Open Day Event
24. School Prospectus
25. Alumni Registration
26. Clinic Profile
27. Appointment Booking
28. Church Information
29. Office Service Directory
30. Property Listing

## Asset Production Checklist

For every new template:

- [ ] Template thumbnail exists.
- [ ] Mobile preview screenshot exists.
- [ ] Required image slots are declared.
- [ ] Default alt text exists.
- [ ] Asset source/license is recorded.
- [ ] Asset dimensions are known.
- [ ] Asset is optimized.
- [ ] Asset has stable aspect ratio in UI.
- [ ] Asset is stored through the Decode asset flow or committed as first-party static asset.

## Accessibility Checklist

- [ ] Template cards are buttons or links with clear labels.
- [ ] Search input has a visible label.
- [ ] Result count uses `aria-live`.
- [ ] Filter chips expose selected state.
- [ ] Template selection exposes `aria-pressed` or equivalent.
- [ ] Preview has a clear accessible name.
- [ ] Public page has one `h1`.
- [ ] Links describe the destination.
- [ ] Images have useful alt text.
- [ ] Decorative images use empty alt text.
- [ ] Audio has an accessible label.
- [ ] Video links have descriptive text.
- [ ] PDF links identify the document.
- [ ] Keyboard-only flow can complete template selection and save.

## Performance Checklist

- [ ] Template thumbnails use `next/image` where possible.
- [ ] Public-rendered images include width and height.
- [ ] Non-critical images lazy load.
- [ ] Template gallery avoids loading full hero assets.
- [ ] Search/filtering does not block typing.
- [ ] No layout shift when thumbnails load.
- [ ] Public pages remain small and fast.

## Strong Implementation Order

1. Build the searchable static template gallery first.
2. Add 30 curated presets using existing page types where possible.
3. Improve preview behavior and template switching.
4. Add owned asset packs and metadata.
5. Add admin database-backed templates.
6. Add admin create/edit/publish UI.
7. Add new page types only where existing types become awkward.
8. Harden public rendering and release gates.

## Strategic Standard

The Pages section should not feel like a list of forms. It should feel like choosing a professional campaign asset:

```text
Search use case -> choose template -> replace content -> preview mobile page -> publish -> attach to QR -> edit later
```

This is how Decode moves beyond QR generation into a business QR campaign platform.
