# Pages Image Requirements

## Asset Rules

- Own, generate, commission, or license every image.
- Store source/license metadata for every asset.
- Use WebP or AVIF for raster previews.
- Keep real user uploads separate from first-party template assets.
- Every non-decorative image needs useful alt text which will be automatically derived from teh name of the image.
- Do not use copyrighted brands, trademarked logos, public figures, school crests, hospital marks, platform logos, or readable third-party signage.

## Standard Sizes

| Asset | Size | Target |
| --- | ---: | ---: |
| Template thumbnail | 800x500 | under 120 KB |
| Mobile preview screenshot | 390x844 | under 180 KB |
| Hero image | 1600x900 | under 250 KB |
| Gallery image | 1200x800 | under 180 KB |
| PDF cover | 800x1100 | under 150 KB |
| Logo placeholder | 512x512 | under 40 KB |
| Category icon | 24x24 SVG | under 8 KB |

## ChatGPT Image Generation Rules

- Generator: ChatGPT Image.
- Default style: clean, realistic, professional, bright, trustworthy, and compatible with Decode's light sky-blue UI.
- Default negative constraints: no copyrighted brands, no trademarked products, no public figures, no readable text, no logos, no watermarks, no UI screenshots from real products, no dark stock-photo mood, no heavy blur, no distorted hands or faces.
- People: use photorealsitic, generic people only. Avoid identifiable minors; for school scenes, show students from behind, or with non-identifying faces.
- Text: avoid readable text. For documents, menus, boards, screens, and covers, use abstract lines and layout blocks only.
- Delivery: generate the image, review it, then optimize to WebP or PNG at the target path below.

## Location Convention

Use this first-party static path structure:

```text
public/assets/landing-page-templates/{pack}/{asset-name}.{webp|png}
```

Use PNG only for logo placeholders if transparency is required. Use WebP for all hero, gallery, cover, and thumbnail-like assets.

## Metadata To Capture

- Asset name
- Template key
- Asset slot
- Alt text
- Caption
- Width
- Height
- File size
- Content type
- License: `First-party generated asset, internal review required`
- Created by
- Review status

## Prompt Register

### Personal

#### `personal-portrait-placeholder`

- Location: `public/assets/landing-page-templates/personal/personal-portrait-placeholder.png`
- Size: `512x512`
- Templates: Personal profile, Creator link hub.
- Alt text: `Professional profile avatar placeholder.`
- Prompt: Generate a square professional avatar placeholder for a QR landing-page template. Show a clean, synthetic head-and-shoulders portrait silhouette in soft studio lighting with sky-blue and neutral accents. Brand-neutral, polished SaaS style, no real person, no text, no logo, no watermark.

#### `personal-creator-workspace`

- Location: `public/assets/landing-page-templates/personal/personal-creator-workspace.webp`
- Size: `1600x900`
- Templates: Creator link hub, Portfolio.
- Alt text: `Modern creator workspace with laptop and content tools.`
- Prompt: Generate a bright modern creator workspace with a laptop, notebook, phone, compact camera, and organized desk tools near a window. Professional editorial photography, clean surfaces, sky-blue accent object, no brand marks, no readable screen text, no logos, no watermark.

#### `personal-portfolio-project-thumbnail`

- Location: `public/assets/landing-page-templates/personal/personal-portfolio-project-thumbnail.webp`
- Size: `800x500`
- Templates: Portfolio.
- Alt text: `Generic portfolio project preview boards.`
- Prompt: Generate a clean portfolio project thumbnail showing abstract website and app mockup boards, color swatches, and project cards on a neutral desk. High-end product design presentation, no real brand identities, no readable text, no actual UI from known products, no watermark.

#### `personal-digital-cv-cover`

- Location: `public/assets/landing-page-templates/personal/personal-digital-cv-cover.webp`
- Size: `800x1100`
- Templates: Digital CV.
- Alt text: `Minimal digital CV document cover placeholder.`
- Prompt: Generate a portrait PDF cover placeholder for a digital CV template. Use a polished resume-like layout with abstract heading bars, section lines, and a subtle sky-blue accent. No readable text, no name, no logo, no real company marks, no watermark.

### Business

#### `business-office-team-hero`

- Location: `public/assets/landing-page-templates/business/business-office-team-hero.webp`
- Size: `1600x900`
- Templates: Business contact, Customer feedback.
- Alt text: `Professional team working in a bright office.`
- Prompt: Generate a bright professional office scene with a small diverse team collaborating around a table, laptops and notes visible, modern workspace, natural daylight, calm business mood. Generic people, no recognizable faces, no company logos, no readable text, no watermark.

#### `business-logo-placeholder`

- Location: `public/assets/landing-page-templates/business/business-logo-placeholder.png`
- Size: `512x512`
- Templates: Business contact, Service booking, Customer feedback.
- Alt text: `Generic business logo placeholder.`
- Prompt: Generate a transparent-background business logo placeholder: simple geometric abstract mark using sky blue, slate, and white. It should look like a professional placeholder symbol, not a real brand. No letters, no monogram, no text, no trademark-like mark, no watermark.

#### `business-service-booking-hero`

- Location: `public/assets/landing-page-templates/business/business-service-booking-hero.webp`
- Size: `1600x900`
- Templates: Service booking.
- Alt text: `Service booking desk with calendar and phone.`
- Prompt: Generate a clean service booking scene with a reception desk, calendar, smartphone showing abstract appointment blocks, and a small plant. Professional local-service business feel, bright daylight, sky-blue accent, no readable text, no real app UI, no logos, no watermark.

#### `business-product-service-display`

- Location: `public/assets/landing-page-templates/business/business-product-service-display.webp`
- Size: `1600x900`
- Templates: Product info.
- Alt text: `Generic product and service display on a clean table.`
- Prompt: Generate a generic product and service display on a clean studio table with neutral packaging, small tools, cards, and a tablet showing abstract blocks. Premium but brand-neutral ecommerce style, no trademarks, no readable labels, no logos, no watermark.

### Restaurant

#### `restaurant-interior`

- Location: `public/assets/landing-page-templates/restaurant/restaurant-interior.webp`
- Size: `1600x900`
- Templates: Restaurant menu, Restaurant reservation.
- Alt text: `Modern restaurant interior with warm seating.`
- Prompt: Generate a modern restaurant interior with warm seating, clean tables, soft daylight, and a professional hospitality feel. Keep it bright, inviting, and realistic. No visible brand names, no readable menu text, no people as main subjects, no logos, no watermark.

#### `restaurant-plated-meal`

- Location: `public/assets/landing-page-templates/restaurant/restaurant-plated-meal.webp`
- Size: `1600x900`
- Templates: Restaurant menu, Daily specials.
- Alt text: `Fresh plated meal on a restaurant table.`
- Prompt: Generate a photorealistic plated meal on a clean restaurant table, fresh ingredients, balanced composition, natural light, appetizing but not exaggerated. Leave subtle negative space for template overlays. No branded plates, no text, no logos, no watermark.

#### `restaurant-coffee-breakfast`

- Location: `public/assets/landing-page-templates/restaurant/restaurant-coffee-breakfast.webp`
- Size: `1600x900`
- Templates: Daily specials, Restaurant menu.
- Alt text: `Coffee and breakfast setting.`
- Prompt: Generate a bright cafe breakfast scene with coffee, pastry, fruit, and a clean table setting. Professional food photography, soft morning light, warm but restrained palette with a small sky-blue accent. No brand labels, no readable text, no logos, no watermark.

#### `restaurant-menu-board`

- Location: `public/assets/landing-page-templates/restaurant/restaurant-menu-board.webp`
- Size: `1600x900`
- Templates: Restaurant menu.
- Alt text: `Generic restaurant menu board with abstract lines.`
- Prompt: Generate a clean restaurant counter with a modern menu board in the background using only abstract lines and blocks, no readable words or prices. Bright hospitality setting, professional composition, no brand marks, no logos, no watermark.

#### `restaurant-delivery-package`

- Location: `public/assets/landing-page-templates/restaurant/restaurant-delivery-package.webp`
- Size: `1600x900`
- Templates: Delivery links.
- Alt text: `Generic takeaway delivery package.`
- Prompt: Generate a neat takeaway delivery package scene with plain kraft bags, sealed food containers, receipt-shaped blank paper, and a phone with abstract ordering blocks. No delivery platform names, no restaurant logos, no readable text, no watermark.

#### `restaurant-coupon-food-background`

- Location: `public/assets/landing-page-templates/restaurant/restaurant-coupon-food-background.webp`
- Size: `1600x900`
- Templates: Promo coupon, Restaurant coupon.
- Alt text: `Food background with space for a coupon offer.`
- Prompt: Generate a polished food background for a restaurant coupon template, with a clean plated dish and side items placed around open negative space for UI copy. Bright, appetizing, professional. No actual text, no brand labels, no logos, no watermark.

### Hotel

#### `hotel-exterior`

- Location: `public/assets/landing-page-templates/hotel/hotel-exterior.webp`
- Size: `1600x900`
- Templates: Hotel welcome, Hotel booking.
- Alt text: `Modern hotel exterior entrance.`
- Prompt: Generate a modern hotel exterior entrance in daylight, clean architecture, welcoming doorway, subtle landscaping, premium but generic hospitality feel. No hotel name, no signage text, no flags, no brand logos, no watermark.

#### `hotel-lobby`

- Location: `public/assets/landing-page-templates/hotel/hotel-lobby.webp`
- Size: `1600x900`
- Templates: Hotel welcome, Guest feedback.
- Alt text: `Bright hotel lobby reception area.`
- Prompt: Generate a bright hotel lobby with reception desk, lounge seating, plants, and warm neutral materials. Professional hospitality photography, clean and calm. No readable signage, no hotel logo, no people as main subjects, no watermark.

#### `hotel-guest-room`

- Location: `public/assets/landing-page-templates/hotel/hotel-guest-room.webp`
- Size: `1600x900`
- Templates: Room directory, Hotel booking.
- Alt text: `Clean hotel guest room.`
- Prompt: Generate a clean modern hotel guest room with made bed, bedside table, window light, and subtle blue accent. Realistic hospitality photography, uncluttered, premium but generic. No branded objects, no readable text, no logos, no watermark.

#### `hotel-dining-restaurant`

- Location: `public/assets/landing-page-templates/hotel/hotel-dining-restaurant.webp`
- Size: `1600x900`
- Templates: Room directory, Hotel welcome.
- Alt text: `Hotel dining area.`
- Prompt: Generate an elegant hotel dining or breakfast area with clean table settings, warm lighting, and modern hospitality decor. Professional photography, no readable menu text, no hotel branding, no restaurant logos, no watermark.

#### `hotel-concierge-local-guide`

- Location: `public/assets/landing-page-templates/hotel/hotel-concierge-local-guide.webp`
- Size: `1600x900`
- Templates: Concierge guide.
- Alt text: `Concierge desk with local guide materials.`
- Prompt: Generate a concierge desk scene with a city map, key card, small luggage tag, and phone showing abstract blocks. Premium travel feel, bright and organized. No real city names, no readable text, no travel brand marks, no watermark.

#### `hotel-event-hall`

- Location: `public/assets/landing-page-templates/hotel/hotel-event-hall.webp`
- Size: `1600x900`
- Templates: Event hall.
- Alt text: `Hotel event hall prepared for a gathering.`
- Prompt: Generate a modern hotel event hall prepared for a professional gathering, rows of chairs, soft lighting, clean stage area, neutral decor with sky-blue accent lighting. No banners, no readable text, no company logos, no watermark.

### School

#### `school-campus-exterior`

- Location: `public/assets/landing-page-templates/school/school-campus-exterior.webp`
- Size: `1600x900`
- Templates: School admissions.
- Alt text: `School campus exterior.`
- Prompt: Generate a bright school campus exterior with modern learning buildings, trees, walkway, and welcoming academic atmosphere. No school crest, no name signs, no identifiable students in foreground, no readable text, no logos, no watermark.

#### `school-classroom`

- Location: `public/assets/landing-page-templates/school/school-classroom.webp`
- Size: `1600x900`
- Templates: School notice board, School admissions.
- Alt text: `Clean modern classroom.`
- Prompt: Generate a clean modern classroom with desks, learning materials, and a teacher workspace, bright daylight, organized and welcoming. No readable posters, no school branding, no identifiable children, no logos, no watermark.

#### `school-students-studying`

- Location: `public/assets/landing-page-templates/school/school-students-studying.webp`
- Size: `1600x900`
- Templates: School admissions, Alumni registration.
- Alt text: `Students studying together in a school setting.`
- Prompt: Generate students studying together at a table in a bright school setting, shown from behind or at non-identifying distance, books and tablets visible. Positive academic mood. No uniforms with crests, no readable text, no logos, no watermark.

#### `school-library-resource-center`

- Location: `public/assets/landing-page-templates/school/school-library-resource-center.webp`
- Size: `1600x900`
- Templates: Library resources.
- Alt text: `School library and resource center.`
- Prompt: Generate a school library or resource center with bookshelves, study tables, laptops, and soft daylight. Clean, modern, student-friendly. No readable book titles, no school branding, no identifiable students, no logos, no watermark.

#### `school-open-day-event`

- Location: `public/assets/landing-page-templates/school/school-open-day-event.webp`
- Size: `1600x900`
- Templates: Open day event.
- Alt text: `School open day event setup.`
- Prompt: Generate a school open day event setup with welcome tables, balloons or simple decor, campus walkway, and visitors at a non-identifying distance. Bright and trustworthy. No readable banners, no school crests, no logos, no watermark.

#### `school-prospectus-cover`

- Location: `public/assets/landing-page-templates/school/school-prospectus-cover.webp`
- Size: `800x1100`
- Templates: School prospectus.
- Alt text: `School prospectus PDF cover placeholder.`
- Prompt: Generate a portrait PDF cover placeholder for a school prospectus, with abstract campus shapes, clean content blocks, and sky-blue academic accents. No readable text, no real school name, no crest, no logo, no watermark.

#### `school-logo-placeholder`

- Location: `public/assets/landing-page-templates/school/school-logo-placeholder.png`
- Size: `512x512`
- Templates: School admissions, School notice board, Alumni registration.
- Alt text: `Generic school logo placeholder.`
- Prompt: Generate a transparent-background school logo placeholder using a simple abstract shield or book-inspired geometric mark in sky blue and slate. It must not resemble any real school crest. No letters, no readable text, no trademark, no watermark.

### Healthcare

#### `healthcare-clinic-reception`

- Location: `public/assets/landing-page-templates/healthcare/healthcare-clinic-reception.webp`
- Size: `1600x900`
- Templates: Clinic profile, Clinic appointment, Feedback form.
- Alt text: `Clean clinic reception area.`
- Prompt: Generate a clean clinic reception area with front desk, seating, plants, and bright natural light. Professional healthcare atmosphere, calm and accessible. No hospital name, no medical brand logos, no readable posters, no patients as main subjects, no watermark.

#### `healthcare-doctor-portrait-placeholder`

- Location: `public/assets/landing-page-templates/healthcare/healthcare-doctor-portrait-placeholder.png`
- Size: `512x512`
- Templates: Doctor profile.
- Alt text: `Doctor profile portrait placeholder.`
- Prompt: Generate a square professional doctor portrait placeholder with a synthetic clinician in neutral medical attire, soft studio lighting, friendly but realistic. No real person, no hospital badge, no readable name tag, no medical logo, no watermark.

#### `healthcare-appointment-desk`

- Location: `public/assets/landing-page-templates/healthcare/healthcare-appointment-desk.webp`
- Size: `1600x900`
- Templates: Clinic appointment.
- Alt text: `Appointment desk with calendar and phone.`
- Prompt: Generate a healthcare appointment desk with a calendar, pen, phone, and abstract scheduling screen blocks. Clean clinic environment, reassuring and professional. No readable patient data, no real app UI, no logos, no watermark.

#### `healthcare-patient-info-cover`

- Location: `public/assets/landing-page-templates/healthcare/healthcare-patient-info-cover.webp`
- Size: `800x1100`
- Templates: Patient information PDF.
- Alt text: `Patient information PDF cover placeholder.`
- Prompt: Generate a portrait PDF cover placeholder for patient information, using clean medical document layout blocks, soft sky-blue accents, and subtle healthcare icons as abstract shapes. No readable text, no hospital logo, no patient data, no watermark.

#### `healthcare-clinic-logo-placeholder`

- Location: `public/assets/landing-page-templates/healthcare/healthcare-clinic-logo-placeholder.png`
- Size: `512x512`
- Templates: Clinic profile, Clinic appointment, Feedback form.
- Alt text: `Generic clinic logo placeholder.`
- Prompt: Generate a transparent-background clinic logo placeholder with a simple abstract health cross or care mark using sky blue, teal, and slate. It must be generic and not resemble a real healthcare brand. No letters, no text, no watermark.

### Institution

#### `institution-church-auditorium`

- Location: `public/assets/landing-page-templates/institution/institution-church-auditorium.webp`
- Size: `1600x900` 
- Templates: Church information, Service program.
- Alt text: `Church auditorium interior.`
- Prompt: Generate a bright church auditorium interior with rows of seats, simple stage, warm lighting, and respectful community atmosphere. Keep it generic and modern. No church name, no readable signage, no denominational logos, no watermark.

#### `institution-public-office-reception`

- Location: `public/assets/landing-page-templates/institution/institution-public-office-reception.webp`
- Size: `1600x900`
- Templates: Office service directory, Public notice.
- Alt text: `Public office reception area.`
- Prompt: Generate a clean public office reception area with service counter, seating, queue markers, and neutral civic design. Professional and accessible. No government seal, no flags as focus, no readable forms or signage, no logos, no watermark.

#### `institution-community-event`

- Location: `public/assets/landing-page-templates/institution/institution-community-event.webp`
- Size: `1600x900`
- Templates: Public notice, Service program.
- Alt text: `Community event gathering.`
- Prompt: Generate a community event gathering in a bright hall or outdoor civic space, tables, chairs, and people at non-identifying distance. Welcoming, organized, inclusive. No campaign signs, no readable banners, no organization logos, no watermark.

#### `institution-ngo-field-work`

- Location: `public/assets/landing-page-templates/institution/institution-ngo-field-work.webp`
- Size: `1600x900`
- Templates: NGO campaign.
- Alt text: `Generic NGO field work scene.`
- Prompt: Generate a respectful NGO field-work scene with volunteers organizing supplies and community materials in daylight. Documentary style but polished, generic location, people non-identifying. No charity logos, no political symbols, no readable text, no watermark.

#### `institution-training-room`

- Location: `public/assets/landing-page-templates/institution/institution-training-room.webp`
- Size: `1600x900`
- Templates: Service program.
- Alt text: `Training room prepared for a program.`
- Prompt: Generate a modern training room with tables, chairs, projector, notebooks, and a blank presentation screen with abstract blocks only. Professional workshop atmosphere, no real company branding, no readable text, no logos, no watermark.

#### `institution-logo-placeholder`

- Location: `public/assets/landing-page-templates/institution/institution-logo-placeholder.png`
- Size: `512x512`
- Templates: Church information, Office service directory, NGO campaign, Public notice.
- Alt text: `Generic institution logo placeholder.`
- Prompt: Generate a transparent-background institution logo placeholder using simple geometric civic shapes, sky blue, slate, and white. Generic and trustworthy, not a government seal or religious mark. No letters, no readable text, no trademark, no watermark.

### Real Estate

#### `real-estate-property-exterior`

- Location: `public/assets/landing-page-templates/real-estate/real-estate-property-exterior.webp`
- Size: `1600x900`
- Templates: Property listing, Inspection event.
- Alt text: `Modern residential property exterior.`
- Prompt: Generate a modern residential property exterior in daylight with clean landscaping, driveway, and welcoming front view. Realistic real estate photography, generic location. No house number, no agency sign, no logos, no readable text, no watermark.

#### `real-estate-living-room`

- Location: `public/assets/landing-page-templates/real-estate/real-estate-living-room.webp`
- Size: `1200x800`
- Templates: Property listing.
- Alt text: `Bright staged living room.`
- Prompt: Generate a bright staged living room with sofa, coffee table, natural light, and neutral decor. Professional real estate interior photography, uncluttered and realistic. No personal photos, no brand labels, no readable text, no watermark.

#### `real-estate-kitchen`

- Location: `public/assets/landing-page-templates/real-estate/real-estate-kitchen.webp`
- Size: `1200x800`
- Templates: Property listing.
- Alt text: `Clean modern kitchen.`
- Prompt: Generate a clean modern kitchen with island, cabinets, natural light, and premium but generic finishes. Real estate listing photography style. No appliance logos, no personal objects, no readable labels, no watermark.

#### `real-estate-bedroom`

- Location: `public/assets/landing-page-templates/real-estate/real-estate-bedroom.webp`
- Size: `1200x800`
- Templates: Property listing.
- Alt text: `Staged bedroom for property listing.`
- Prompt: Generate a staged bedroom for a property listing with made bed, side tables, soft daylight, and neutral decor. Calm, polished, realistic. No personal photos, no brand labels, no readable text, no watermark.

#### `real-estate-agent-portrait-placeholder`

- Location: `public/assets/landing-page-templates/real-estate/real-estate-agent-portrait-placeholder.png`
- Size: `512x512`
- Templates: Agent profile.
- Alt text: `Real estate agent portrait placeholder.`
- Prompt: Generate a square professional real estate agent portrait placeholder with a synthetic adult professional in business attire, soft studio lighting, neutral background with sky-blue accent. No real person, no agency badge, no readable text, no logos, no watermark.

#### `real-estate-open-house`

- Location: `public/assets/landing-page-templates/real-estate/real-estate-open-house.webp`
- Size: `1600x900`
- Templates: Inspection event.
- Alt text: `Open-house viewing setup.`
- Prompt: Generate an open-house viewing setup outside a modern home with a small welcome table, blank sign shape, and visitors at non-identifying distance. Bright and professional. No agency branding, no readable sign text, no logos, no watermark.

### Retail And Product

#### `retail-product-packaging`

- Location: `public/assets/landing-page-templates/retail/retail-product-packaging.webp`
- Size: `1600x900`
- Templates: Product warranty, Product info.
- Alt text: `Generic product packaging on a studio surface.`
- Prompt: Generate generic product packaging on a clean studio surface, premium ecommerce photography, simple boxes and containers with blank labels, sky-blue accent prop. No brand names, no readable labels, no trademarked shapes, no logos, no watermark.

#### `retail-product-shelf-display`

- Location: `public/assets/landing-page-templates/retail/retail-product-shelf-display.webp`
- Size: `1600x900`
- Templates: Store links, Product catalog.
- Alt text: `Retail product shelf display.`
- Prompt: Generate a retail shelf display with generic boxed and bottled products, clean merchandising, bright store lighting, and no recognizable brands. Use blank labels and simple packaging. No readable text, no logos, no watermark.

#### `retail-warranty-card`

- Location: `public/assets/landing-page-templates/retail/retail-warranty-card.webp`
- Size: `800x500`
- Templates: Product warranty.
- Alt text: `Generic warranty card placeholder.`
- Prompt: Generate a clean warranty card placeholder on a desk next to neutral product packaging. Use abstract lines and layout blocks only, with a small sky-blue accent. No readable text, no serial numbers, no brand marks, no logos, no watermark.

#### `retail-catalog-spread`

- Location: `public/assets/landing-page-templates/retail/retail-catalog-spread.webp`
- Size: `1600x900`
- Templates: Product catalog.
- Alt text: `Generic product catalog spread.`
- Prompt: Generate an open product catalog spread on a clean table with abstract product grids, image placeholders, and layout blocks. Professional retail catalog look. No readable product names, no prices, no brand logos, no watermark.

#### `retail-promo-product-image`

- Location: `public/assets/landing-page-templates/retail/retail-promo-product-image.webp`
- Size: `1600x900`
- Templates: Promo coupon.
- Alt text: `Generic promotional product display.`
- Prompt: Generate a polished promotional product display with generic packages, small discount-card shape left blank, bright studio lighting, and negative space for coupon UI. No readable text, no brand names, no trademarked products, no logos, no watermark.

### Media

#### `media-video-cover-placeholder`

- Location: `public/assets/landing-page-templates/media/media-video-cover-placeholder.webp`
- Size: `1600x900`
- Templates: Video link.
- Alt text: `Generic video cover placeholder.`
- Prompt: Generate a modern video cover placeholder with abstract play-button geometry, soft sky-blue and slate shapes, and clean editorial composition. It should feel like a professional media landing-page cover. No platform logos, no readable text, no watermark.

#### `media-audio-cover-placeholder`

- Location: `public/assets/landing-page-templates/media/media-audio-cover-placeholder.webp`
- Size: `1600x900`
- Templates: Audio link.
- Alt text: `Generic audio cover placeholder.`
- Prompt: Generate a modern audio cover placeholder with abstract waveform shapes, soft gradients, subtle speaker or microphone-inspired geometry, sky-blue accent, and premium media feel. No music platform logos, no readable text, no watermark.

#### `media-podcast-cover-placeholder`

- Location: `public/assets/landing-page-templates/media/media-podcast-cover-placeholder.webp`
- Size: `1600x900`
- Templates: Audio link, Creator link hub.
- Alt text: `Generic podcast cover placeholder.`
- Prompt: Generate a professional podcast cover placeholder with abstract microphone-inspired shapes, clean studio background, slate and sky-blue palette, and strong centered composition. No podcast platform marks, no readable title text, no logos, no watermark.

#### `media-gallery-placeholder`

- Location: `public/assets/landing-page-templates/media/media-gallery-placeholder.webp`
- Size: `1200x800`
- Templates: Image gallery.
- Alt text: `Generic image gallery placeholder.`
- Prompt: Generate a generic image gallery placeholder showing a clean grid of abstract photo cards on a light surface, with subtle sky-blue accents and polished SaaS template styling. No real copyrighted photos, no readable text, no logos, no watermark.

## Template Thumbnail Prompt Pattern

Use this pattern after the full preset list is finalized. Template thumbnails are `800x500` and should use the closest pack image as the visual source.

```text
Generate an 800x500 first-party template thumbnail for Decode's {template name} landing-page preset. Use a clean professional composition based on {industry/use case}. Leave safe negative space for UI overlays. Match Decode's light sky-blue, white, and slate design system. No copyrighted brands, no readable text, no logos, no watermark.
```

## Mobile Preview Screenshot Rule

Do not generate mobile preview screenshots with ChatGPT. Capture them from the real implemented templates at `390x844` using Playwright after the template is wired into `/landing-pages`. This keeps screenshots truthful and prevents fake UI states.

## Production Priority

1. Template thumbnails for every shipped preset.
2. School, restaurant, and hotel hero images.
3. Logo placeholders by category.
4. PDF cover placeholders.
5. Mobile preview screenshots captured from real templates.
6. Gallery placeholder packs.
