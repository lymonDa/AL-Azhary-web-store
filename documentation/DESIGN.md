# DESIGN.md — مكتبة الأزهري | AL-AZHARI LIBRARY

Visual design and UX source of truth for the online store, student-services request area, customer account, and Admin interface.

| | |
|---|---|
| **Status** | Draft for stakeholder review |
| **Date** | 2 October 2026 |
| **Locale priority** | Arabic-first, RTL-first; English LTR supported |
| **Companion documents** | Master Product Brief v2.0, PRD v1.0, IA & Sitemap, UX/UI Specification v1.0, Design System baseline, MongoDB and Backend plans |

---

## 0. How this document was produced (read first)

**Repository inspection did not happen.** The brief asked for a full inspection of the project repository (structure, components, Tailwind config, tokens, fonts, assets, logo files). No repository or logo file was accessible in this session. Only the seven project documents were available. Therefore:

- Nothing in this document claims to describe existing code, existing screens, or existing components. Where the brief asked to "identify inconsistencies in the current UI," that is **not possible and is listed as an Open Question (Q-01)**.
- Colors, fonts, and spacing are taken from the **Design System baseline** document. They are a **design recommendation**, not values extracted from the logo or code. Section 5 flags this explicitly.
- Business facts come from the Master Product Brief, PRD, and IA. Anything unresolved is marked **Open Decision** or **To Be Confirmed**.

**Labels used throughout**

| Label | Meaning |
|---|---|
| **Confirmed** | Stated by the owner or in the governing documents. Preserve. |
| **Recommendation** | A design decision made to serve confirmed needs. Change only with approval. |
| **Aspiration** | A desired perception or goal, never to be stated as fact in customer copy. |
| **Open Decision / To Be Confirmed** | Unresolved. Keep configurable or visibly pending. |

---

## 1. Design Overview

**Product identity.** AL-AZHARI LIBRARY is a real, operating library and store in Qena, founded in 2023, and the website is its digital extension, not a replacement and not a pivot into an educational platform. The Master Brief describes six jobs for the product: storefront, searchable catalog, student-service request channel, customer relationship channel, brand presence for social and referral traffic, and a revenue-generating sales channel.

**Design philosophy.** *A calm, editorial bookshop that happens to be open online.* Books are the visual and structural anchor. Everything else (supplies, gifts, services) supports the books rather than competing with them. Decoration never outranks information: the customer should always be able to answer "What is this? Is it available? What does it cost? What do I do next? How do I reach a person?"

**Desired emotional impression.** The target reaction from the brief: *"This is a real, respectable library that understands what I need and has everything I'm looking for."* Not: *"This is just a site built to sell products."*

**Experience philosophy.** The owner's principle, which governs every decision: **سهولة الاستخدام + تصميم مريح + ثقة** (ease of use + comfortable design + trust). The brand words are **ثقة، خبرة، احترافية** (trust, expertise, professionalism).

**What makes this different from a generic bookstore**

1. **Azhar depth without exclusion.** Specialization is visible (grade, stage, publisher, education type) but a general-education student or parent never feels they are in the wrong place.
2. **Two product models, honestly separated.** Fixed-price products use cart and checkout. Variable-price services use request → review → quotation. The interface never fakes a fixed service price.
3. **Honest process states.** Orders enter "Pending Review," payments are manually verified, and the interface says so instead of pretending to be an instant gateway.
4. **Human support stays visible.** WhatsApp is a first-class support path throughout, never the system of record.
5. **Physical and digital complement each other.** Free pickup and cash options are shown with the same prominence as delivery.

---

## 2. Brand Identity

| Attribute | Value | Status |
|---|---|---|
| Arabic name | مكتبة الأزهري | Confirmed |
| English name | AL-AZHARI LIBRARY | Confirmed |
| Slogan | "كل ما تحتاجه في مكان واحد" (Everything you need in one place) | Confirmed |
| Founded | 2023 | Confirmed |
| Location | Qena, Omar Effendi area, next to the Azhar District | Confirmed |
| Landmark wording | The Master Brief says "in front of Al-Rahbat School"; the project prompt says "in front of the Sisters' School" | **Open Decision (Q-02)** — confirm exact wording before it appears in the footer or contact page |
| Business hours | Sat–Thu 8:00 AM–11:00 PM; Fri 5:00 PM–11:00 PM | Confirmed (Master Brief) |
| Final phone numbers | Not yet provided | Open Decision (OD-01) |
| Current channels | Facebook, TikTok, WhatsApp, phone | Confirmed |

**Positioning.** The library sits at the intersection of four identities that must be protected together: a *specialized* library, a *modern* library, an *Islamic/Azhar-character* library, and a *student-focused* library. A generic bookstore lacks the third; a religious-supply store rarely has the second.

**Owner's positioning phrase.** "أحسن مكان متخصص في الكتب الأزهرية في قنا" (and the related "best Azhar library in Egypt") is an **Aspiration / desired perception**. It is an internal compass for tone, **never a headline or an unqualified claim** in customer-facing copy.

**Core values (as stated).** Knowledge, trust, honesty, speed, quality, reasonable pricing, student service, experience, professionalism.

**Competitive differentiation.** Depth of Azhar specialization inside a modern, professional, trustworthy presentation. The owner assesses local competitors as not strongly invested digitally; that is the owner's assessment, not a verified market fact. The owner explicitly rejected "everyone else is bad" positioning, so the design competes on clarity and trust, never disparagement.

**Brand personality.** Trustworthy, knowledgeable, professional, warm, calm. Not childish, not corporate-cold, not preachy.

**Visual personality.** Islamic character expressed through proportion, geometry, and the green/gold relationship, not through literal religious imagery. Modern in layout and typography. Calm in density.

**Existing logo.** A logo exists and carries book, education, pen, Islamic/Azhar cues, dark green, and gold. The owner's direction is to **preserve and unify**, not redesign. The logo file was not available to this document, so exact logo colors are **To Be Confirmed (Q-03)**. The logo must never be redrawn, recolored, filtered, or placed on busy imagery.

---

## 3. Design Principles

1. **Answer the five questions first.** Identity, availability, price, next action, and how to reach a person must be visible without effort on every product-related screen.
2. **Books lead.** Navigation, home discovery, category order, and default merchandising put books first. Supplies, gifts, and services sit around them.
3. **Calm Islamic character, not literal religiosity.** One restrained geometric vocabulary and a green/gold palette. No mosque silhouettes, calligraphy fields, or ornamental frames.
4. **Trust through transparency.** Show real states: Pending Review, payment under review, shipping estimate versus final cost. Never use fake urgency, invented scarcity, or unsupported delivery promises.
5. **Services are not products.** Different entry, different language, different lifecycle. No fixed price before the library's quotation.
6. **Human support is part of the design.** WhatsApp is contextual and available, but the website record is authoritative.
7. **Arabic and RTL first.** Layout, rhythm, type scale, and interaction are designed for Arabic, then verified in English.
8. **Mobile is a primary experience.** Customers currently arrive through Facebook, TikTok, and WhatsApp on phones. Every core flow must work comfortably one-handed.
9. **Every state is designed.** Loading, empty, unavailable, rejected, pending, and error states are part of the product, not an afterthought.
10. **Seasonal is a layer, not the structure.** Campaigns change emphasis; navigation and identity stay stable year-round.

---

## 4. Visual Direction

**Overall style: Modern Islamic Editorial** *(Recommendation, from the Design System baseline).* Think of a well-run independent bookshop: warm ivory backgrounds, strong typographic hierarchy, generous whitespace, and book covers as the main visual material.

**Layout philosophy.** One clear purpose per page above the fold. Group content into discovery, evaluation, and action. Use whitespace to separate groups rather than heavy borders.

**Density.** Public storefront: comfortable and spacious. Product grids: readable cards, never cramped. Admin: denser and task-focused, but still legible.

**Visual hierarchy.** Order of attention: page purpose → product cover → title → price and availability → primary action → supporting information → decoration.

| Do | Don't |
|---|---|
| Use green for primary actions and brand anchors | Fill the interface with gold or make badges gold |
| Use low-contrast geometric accents at large scale, outside dense content | Place patterns behind forms, tables, or text |
| Let book covers be the visual evidence of the catalog | Overlay, crop, tint, or filter covers |
| Separate surfaces with whitespace, then borders, then (rarely) shadows | Stack border + shadow + tinted background on one component |
| Keep buttons and cards plain and predictable | Use glassmorphism, heavy gradients, or floating-card effects |
| Use one icon language | Mix icon sets on one screen |
| Use real library and product photography | Use generic stock imagery to imply inventory, staff, or outcomes |

**Patterns.** A single geometric motif: thin line geometry, partial arcs or grid fragments, very low contrast on light surfaces, gold used only as a thin rule or small anchor. Optional on home hero and empty states; absent from transactional screens.

---

## 5. Color System

> **Provenance warning.** These values come from the Design System baseline. They are **a reasoned proposal consistent with "dark green and gold"**, not colors measured from the logo. Verify against the approved logo asset before finalizing (Q-03).

**Principle.** Green carries brand presence and primary actions. Gold is an accent. Ivory provides warmth without hurting readability. Text is deep charcoal, never pure black.

| Role | Token | HEX | Purpose |
|---|---|---|---|
| **Primary** | Brand green 700 | `#0F4C3A` | Primary buttons, links, active navigation, key headings |
| Primary hover / pressed | Green 800 / 900 | `#0B3F31` / `#083328` | Interaction states; deepest tone for dark shells and reversed logo contexts |
| Primary soft | Green 100 | `#E6F0EC` | Selected states, soft callouts |
| **Secondary** | Green 600 | `#17624C` | Secondary emphasis, focus ring color |
| **Accent** | Gold 600 | `#A47925` | Thin rules, small highlights, selected indicators |
| Accent (text-safe) | Gold 700 | `#80601D` | Gold used as text or icon where contrast matters |
| Accent (decorative only) | Gold 500 | `#B58B3A` | Decoration only; never small text on white |
| Accent soft | Gold 100 | `#F5EDD9` | Notice backgrounds |
| **Background** | Ivory 50 | `#FCFBF8` | Page canvas |
| Soft section | Ivory 100 | `#F6F4EE` | Alternate sections |
| **Surface** | White | `#FFFFFF` | Cards, inputs, menus, tables |
| **Text** | Charcoal | `#1F2A26` | Headings and body |
| **Muted text** | Secondary / Muted | `#53615B` / `#718078` | Metadata and helper text / placeholder only |
| **Border** | Default / Strong | `#D7DED9` / `#AEBBB4` | Dividers and fields / table and stronger separation |
| **Success** | 700 / 100 | `#176B4D` / `#E5F3EC` | In stock, confirmed, payment verified, completed |
| **Warning** | 700 / 100 | `#8A5A00` / `#FFF4D6` | Pending review, awaiting action, pre-order |
| **Error** | 700 / 100 | `#B42318` / `#FDE9E7` | Validation errors, rejection, failure |
| **Info** | 700 / 100 | `#155E75` / `#E6F4F7` | Informational and support states |

**Rules**

- Status is never conveyed by color alone: always a text label, and an icon where it adds meaning.
- Gold is never a dominant fill and never small text on white.
- Focus indicator: green plus a visible 2px outer ring.
- **Dark mode: not in V1** *(Recommendation)*. No evidence yet justifies a second theme; product images and Admin workflows would need separate evaluation. Keep token roles semantic so a theme can be added later.

---

## 6. Typography

**Fonts** *(Recommendation, from the Design System baseline)*

- **Arabic:** IBM Plex Sans Arabic
- **Latin and numerals:** Inter
- **Fallbacks:** system sans-serif stack

Reasons: legible at small sizes, professional without being corporate, available for web use, and pairs well for mixed Arabic/Latin product metadata (ISBNs, grades, publisher names). Whether the logo uses a specific typeface is unknown (Q-03); the logo is never recreated in type.

| Role | Weight | Desktop size / line height | Mobile |
|---|---|---|---|
| Display (hero only) | Bold | 48 / 1.12 | 36 / 1.18 |
| H1 page title | Bold | 32 / 1.25 | 28 / 1.28 |
| H2 section | Bold | 26 / 1.3 | 22 / 1.34 |
| H3 group | Bold | 22 / 1.35 | 20 / 1.4 |
| H4 panel | Semibold | 18 / 1.4 | 17 / 1.42 |
| Body | Regular | 16 / 1.65 | same |
| Body large (intro, service explanations) | Regular | 18 / 1.7 | same |
| Small / table | Regular | 14 / 1.55 | same |
| Caption | Regular | 12 / 1.45 | same |
| Label | Semibold | 14 / 1.4 | same |
| Button | Semibold | 15 / 1.2 | same |
| Product title | Semibold | 16 / 1.45 | same |
| Price (card / detail) | Bold | 18 / 24 | same |

**Arabic readability rules**

- Arabic body line height never below about 1.55; dense labels and tables may go to about 1.45.
- Never justify Arabic paragraphs. Never use all caps for Arabic. Do not add tracking to Arabic text.
- Keep product names intact; clamp to two lines only where card alignment requires it.
- Use tabular numerals for prices, counts, references, and dates in aligned contexts.
- Do not mix numeral styles inside one amount. The numeral style (Arabic-Indic vs Latin) for prices is **To Be Confirmed (Q-04)**; choose one and apply consistently.
- Isolate phone numbers, emails, ISBNs, URLs, and order references so they render correctly inside Arabic text.

---

## 7. Spacing & Layout

**Spacing scale.** 4px base unit: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 128. Do not use one-off values when a step expresses the relationship.

| Context | Rule |
|---|---|
| Page margin | 16px mobile (20px for spacious sections), 24px tablet, 32px desktop |
| Card padding | 16px mobile, 20px desktop, 24px only for information-heavy panels |
| Field groups | 16px between fields; 4–8px between a field and its helper or error |
| Section title to content | 16–24px |
| Public section separation | 48–80px depending on importance |
| Admin | 24–40px; do not use storefront editorial spacing in queues or tables |

**Containers.** Reading 720px (policies, service explanations); content 1120px (forms, product detail, account); wide 1280px (catalog, checkout, Admin); maximum 1440px. At 1920px, cap the container and keep line length readable rather than stretching cards.

**Grid.** 12 columns desktop (24px gutters), 8 tablet (20px), 4 mobile (16px).

**Product grid.** Two columns on phones when title, price, and action stay readable; 3 on tablet and compact desktop; 4 on desktop; 5 only if visual QA approves.

---

## 8. Shape Language

Restrained and quiet. Softness is moderate: friendly but not bubbly.

| Element | Radius |
|---|---|
| Inputs, small controls | 6px |
| Buttons, standard cards, product image containers | 10px |
| Feature panels, modals, service explanation cards | 16px |
| Hero or editorial feature surface | 24px (only here) |
| Badges, status chips, filter tokens | Pill |
| Data table cells | 0 |

Use one dominant radius per component. Product cards should read as catalog objects, not social-media bubbles.

---

## 9. Elevation & Shadows

Borders and surface contrast come first; shadow is the exception.

- **None:** page canvas, flat sections, most catalog cards (use border instead).
- **Subtle:** cards or fields needing slight separation.
- **Medium:** menus, popovers, sticky order summary.
- **Large:** drawers and prominent floating panels.
- **Modal level:** dialogs over a scrim.
- **Floating:** the persistent WhatsApp action when it is detached from the page edge.

Do not put shadows on every card in a grid.

---

## 10. Iconography

- **Style:** single outline icon family (Lucide, per the Design System baseline). Do not mix Material, Font Awesome, or others on one surface.
- **Weight:** about 1.75px stroke; 2px at 16px or smaller.
- **Sizes:** 12 (dense metadata), 16 (inline labels, table actions), 20 (default for buttons and navigation), 24 (primary actions, empty states), 32–48 (large empty or success states).
- **Usage:** icons support meaning; icon-only buttons need an accessible name and, on desktop, a tooltip. Never rely on an icon alone to signal order status.
- **Preferred vocabulary:** search, cart, book, printer, upload, messaging (WhatsApp), package, truck, location, clock, success, alert, error, info, refresh.
- **RTL:** do **not** mirror object icons (search, cart, book, printer, upload, payment, WhatsApp). **Do** mirror direction icons (back, forward, next, previous, arrows, breadcrumb separators).
- Icon-to-label gap: 8px, based on reading direction.

---

## 11. Photography & Imagery

**Hierarchy:** (1) real product and book images, (2) approved photography of the library and its location, (3) restrained geometric accents, (4) functional line icons.

- **Product photography.** Most books already have photos (Confirmed). Show the full cover; preferred ratio 2:3; contained, never cropped; neutral warm background, never pure black. Missing images get a calm book icon with "Image coming soon," never a broken image.
- **Library photography.** The physical storefront is a trust asset. Real photos of the shop, shelves, and entrance support the "real physical library" message. Availability of such photos is **To Be Confirmed (Q-05)**. Do not use stock photos of "students" or "staff."
- **Islamic/educational imagery.** Expressed through the geometric motif and restraint, not literal religious scenes.
- **Empty states.** Small, low-contrast, icon-based compositions that never delay the recovery action.
- **Promotional banners.** Editorial crops are allowed for marketing imagery only; keep text live (not baked into the image) and keep seasonal banners from displacing the permanent navigation.
- **Alt text.** Localized and meaningful: product name, not "image of book." Decorative motifs are hidden from assistive technology.

---

## 12. Component Design System

Behavior and appearance only; no implementation detail.

| Component | Visual and UX behavior |
|---|---|
| **Buttons** | Primary = green fill; Secondary = white with border; Tertiary = text; Destructive = error tone. Minimum 44px tall on mobile. Loading keeps width and label. One primary action per view. Labels name the outcome ("أضف إلى السلة", "إرسال الطلب"). |
| **Links** | Clear color plus underline in running text. Never signal a critical action by color alone. |
| **Inputs** | Visible label always (placeholder is not a label); 44px minimum height on customer forms; helper text and error below; validate on blur or submit, not per keystroke; preserve values on error. Phone, email, ISBN, and coupon fields accept left-to-right content while sitting naturally in the form. |
| **Selects** | Clearly shows the selected value; long lists on mobile open as a bottom sheet. |
| **Search** | Prominent, labeled, with clear action and persistent query. Supports the documented fields (name, author, grade, stage, subject, publisher, ISBN, category). |
| **Cards** | Flat, bordered, 10px radius; whitespace over shadow. |
| **Product cards** | See §13. |
| **Category cards** | Books first, then School/Study Products, then Other Products. Calm, text-led, optional restrained motif. |
| **Badges** | Short labels only (availability, status, count); semantic color plus text. |
| **Alerts** | Persistent contextual messages for payment, shipping, availability, and policy. Icon plus text plus semantic tone. |
| **Modals** | Only for focused decisions and confirmations; short title, stated consequence, clear primary and secondary actions; focus trapped and restored. Confirmation required for cancel, reject, delete, and other irreversible actions. |
| **Drawers / sheets** | Filters and navigation; bottom sheet on mobile where reachability matters. |
| **Dropdowns** | Compact menus with keyboard support; no critical information only inside a dropdown. |
| **Tabs** | For switching peers (e.g. order queues, account sections); active tab explicit. |
| **Breadcrumbs** | Follow reading direction; current page last; separators mirror in RTL. |
| **Pagination / load more** | Either is acceptable; choice is an implementation decision. Preserve filters and scroll context. |
| **Quantity controls** | Increment/decrement with optional manual entry; never below 1; pending state during updates. |
| **Price display** | Current price prominent; discounts show original and current amounts; currency formatted consistently (EGP). |
| **Rating / review elements** | **Not applicable.** Reviews and ratings are explicitly out of scope. No placeholder section. |
| **Navigation / Header** | Desktop: logo, Shop, Services, Search, Account, Cart, WhatsApp. Mobile: menu, logo, search, cart; account in the menu or header; persistent WhatsApp that never covers the primary action. |
| **Footer** | Confirmed business information only: location, hours, social links, contact. Phone numbers appear only once OD-01 is resolved. |
| **Cart** | Rows with image, name, variant, quantity, unit and line price, availability warning, remove. Totals visible. No minimum order. |
| **Checkout elements** | Step indicator; summary always shows current total and next step; changes to price, shipping, or discount are never hidden. |
| **Order status indicators** | Text label plus semantic color plus icon; see §21. |

---

## 13. Product Card Design

The most important component in the store.

**Visible without opening the product** (answers the repeated staff questions):

1. **Cover image**, 2:3, full cover visible, consistent image area so rows don't jump in height.
2. **Title** (outside the image), clamped to two lines where necessary.
3. **Key metadata when populated**: author, grade or stage, publisher. Missing fields are simply absent; never "N/A" placeholders.
4. **Price.** If the product has variants with different prices, show the selected or starting price with a clear variant cue.
5. **Availability badge:** In stock / Out of stock / Available for pre-order. Text plus icon plus color.
6. **Primary action** that matches state: Add to cart (in stock), Pre-order (out of stock and eligible), none (out of stock and not eligible).

**Discount.** Show original and current price clearly. Do not imply stacking or expiry rules (not finalized, OD-17).

**Quick actions.** Keep minimal: Add to cart. Products with required variants route to the product page rather than guessing a variant. No wishlist, compare, or quick-view (no documented need; see anti-patterns).

**Hover.** Subtle border or surface response only; no zoom that hides the cover.

**Mobile.** Two columns when readable; otherwise one. Touch targets at least 44px. Title and price never truncated into ambiguity.

**Shadows.** Use a border, not a shadow, on grid cards.

---

## 14. Product Detail Experience

**First viewport exposes:** breadcrumbs, cover/gallery, title, price, availability, variants if any, primary action, and a support action.

Order of information:

1. Breadcrumb and category context.
2. **Imagery.** Full-cover gallery; thumbnails only if multiple images exist; swipeable on mobile with a visible position indicator.
3. **Title, author, category.**
4. **Educational metadata** (when populated): grade, stage, subject, publisher, ISBN, education type.
5. **Variants** (edition, part, language, publisher) only when commercially meaningful. Selecting a variant updates price and availability.
6. **Price and availability**, unambiguous.
7. **Quantity and primary action.** Add to cart, Pre-order, or a clear unavailable message with browsing and WhatsApp options.
8. **Description.** Concise, written by the Admin. **Descriptions are largely unwritten today (Confirmed)**; products without a description must still look complete: show the metadata and a calm, non-apologetic state, never an empty box.
9. **Shipping information.** Show delivery and free pickup as options. Delivery cost is estimated by governorate and may be adjusted by the library (OD-03/04); delivery time ranges are **not shown** until approved (OD-05).
10. **Contextual WhatsApp action:** "اسأل عن المنتج". Support only; it does not create an order.
11. **Related products.** **Open Decision (Q-06).** The IA does not define related-product logic. Do not invent one; if included, restrict to same category and clearly label it.

No reviews, ratings, or "trust score" placeholders.

---

## 15. Navigation Architecture

**Principle.** Few top-level choices. Books first. The catalog can be large, but the structure stays small.

**Main navigation:** Shop (leading) · Services · Search · Account · Cart · WhatsApp.

**Stable shop taxonomy (Confirmed MVP):**

1. **Books** — Azhar books, general-education books, "platform" books (منصات), references, summaries (ملخصات).
2. **School / Study Products** — school supplies, stationery, educational tools.
3. **Other Products** — games, gifts, gift wrapping.

**Services** is a separate top-level area, not a category inside Shop: printing, photocopying, binding, applications and transfers, research and formatting help. Any other administrative services only when approved.

**Where Azhar books live.** Azhar content is expressed through filters (education type, stage, grade, subject, publisher) and featured modules within Books, not by creating a competing top-level taxonomy. Whether "Azhar" should also appear as a labeled sub-entry under Books is **Open Decision (Q-07)**: recommended, because it is the brand's differentiator, but the exact category tree must be approved by the owner.

**Summaries** appear within Books; July merchandising may highlight them (see §28) without moving them.

**Future Islamic education category** (Tajweed, Qira'at, Quran memorization curricula, nursery curricula, Qurans): a **future store expansion, not active in the MVP**. Do not show it in navigation until it is purchasable. When added, it joins the shop taxonomy; it does not create a new identity.

**Customer account navigation:** Overview, Profile, Orders, Addresses, Payment history, Service requests, Pre-orders, Notifications. Current orders and requests appear before settings.

**Admin** is a separate authenticated shell (not part of public navigation), with a persistent sidebar on desktop and a drawer on mobile.

---

## 16. Homepage Experience

**Within the first few seconds the visitor should understand:**

1. Who this is: the Qena library, specialized in Azhar books.
2. What they can buy: books first, plus school supplies and more.
3. That services exist, and that they work differently.
4. How to start: one clear **Shop** action.

**Recommended section hierarchy** (matches the IA):

1. Header with persistent WhatsApp access.
2. Hero: a short, honest proposition and a Shop action. No unqualified "best / number one" claim.
3. Books-first discovery: featured books and entry points by track or stage.
4. Stable categories: Books, School/Study Products, Other Products.
5. Seasonal module (temporary).
6. Services preview explaining request → review → quotation.
7. Trust and practical information: availability and price clarity, free pickup, payment options where confirmed, location and hours.
8. WhatsApp support call to action.
9. Footer.

Do not overfill. If nothing seasonal is active, the page still feels complete. The hero copy is **To Be Confirmed**; the Master Brief's working value proposition is a recommendation, not approved copy.

---

## 17. Search & Discovery

- **Search** supports product name, author, grade, stage, subject, publisher, ISBN, and category. A product with missing fields remains discoverable by populated ones.
- **Filters**: education type, stage, grade, subject, publisher, price range, availability. Active filters are visible and individually removable, with a clear-all. On mobile they open in a sheet, with results context still visible.
- **Sorting.** Only sort options that come from an approved business rule. **Open Decision (Q-08)**; do not invent ranking logic or "best selling" claims.
- **Categories** use the stable taxonomy; Books are visually first.
- **Availability** is always unambiguous: in stock, out of stock, or pre-order eligible.
- **No results** repeats the query and filters, offers clear and refine actions, and offers Shop and WhatsApp as fallbacks.
- **Seasonal discovery** appears as highlighted modules and shortcuts over the same catalog (see §28), not a separate catalog.
- No autocomplete or advanced search behavior is promised unless approved.

---

## 18. Cart & Checkout Experience

**Goal:** fewer mistakes, fewer WhatsApp clarifications, and no surprises.

**Cart.** Multiple products and variants; no minimum order; quantity, line price, availability, discount result, and total visible. If price or availability changed, say so before payment (revalidation is a PRD recommendation pending approval).

**Checkout steps:** Customer information → Address and fulfillment → Payment method → Payment proof (when applicable) → Review → Submit.

- **Guest checkout is always available**; account creation is never forced.
- **Address** fields follow the confirmed list (governorate, city, area, street, building, floor, apartment, landmark, recipient name and phone, notes). **No map pin.**
- **Delivery vs pickup** is an explicit choice. **Pickup shows "استلام من المكتبة — مجانًا"** with the same visual weight as delivery.
- **Shipping.** Show the estimated cost by governorate before submission, clearly labeled as an *estimate*. The library chooses the carrier (Bosta, Egyptian Post, or local delivery); the customer does not. Final-cost binding and re-confirmation are **Open (OD-04)**; show estimate and final cost distinctly and never imply the customer accepted an adjustment merely because it was entered. No delivery time promises (OD-05); no hard-coded excluded-area list (OD-06).
- **Payment method.** The final list is **Open Decision OD-20**. The owner's brief confirms cash on delivery, cash at the library, InstaPay, and Vodafone Cash; the PRD's functional list is COD plus InstaPay, Vodafone Cash, Orange Cash, Etisalat Cash, and WE Pay and omits cash at the library. The design keeps the method list data-driven, does not present either list as final, and treats cash options as first-class, equally visible choices.
- **Payment proof** (non-cash digital methods): show the library's payment details, explain the transfer happens outside the site, accept one or more screenshots with previews and remove, **no transaction-ID field**. After rejection, show the reason when recorded and offer easy re-upload.
- **COD** needs no proof; after the library accepts the order, the customer is asked to confirm. The timeout for non-confirmation is **Open (OD-07)**: no invented expiry.
- **Order review.** Items, quantities, product total, shipping, discount, final total.
- **Mobile.** Single column; a sticky summary keeping the total and next action visible. Do not collapse away shipping or discount changes after they change.
- **Confirmation.** Say "قيد المراجعة" (Pending Review), show the reference, what happens next, and a tracking path. Never say "confirmed" or "paid" when the order is only awaiting review.

---

## 19. Customer Account

- **Sign up:** name, phone, unique email, password. **No phone OTP.** Email verification is required; its gating scope is **Open (OD-02)**.
- **Login:** email or phone, plus password. **Recovery** by email.
- **Overview first:** current orders, service requests, and notifications before profile settings.
- **Profile and saved information:** edit profile; save multiple addresses (no map).
- **Orders:** history and current state at a glance; open detail and tracking. Payment history distinguishes the original payment, the proof, and any refund record.
- **Cancellation:** available only while the order is Pending Review. After acceptance, the interface shows no controls that change the financial total, and explains why in plain words.
- **Returns:** start from a completed order. Eligibility rules, periods, and refund timing are **Open (OD-15/16)**; show neutral, configurable wording. The only confirmed policy case is wrong or damaged item.
- **Empty states** exist for orders, addresses, payments, services, pre-orders, and notifications, each with a next step.

---

## 20. Student Services Experience

**Treated as a first-class area with its own mental model.** The lifecycle is:

**Request → Details → Library Review → Price / Confirmation → Fulfillment**

**Discovery.** A dedicated Services entry (header and homepage). The landing page explains in two or three plain sentences why services differ from products ("the price depends on your request; the library reviews it and sends you a quotation") and lists the confirmed categories: printing, photocopying, binding, applications and transfers, research and formatting help.

**Fixed price vs quoted price.** The brief states variable pricing for services and that exact pricing models per service are **not defined (Open)**. Therefore:

- **No service shows a fixed price** until the library defines one. If the owner later defines genuinely fixed-price services, the design allows a "fixed price" label, but none exist today, and none may be invented.
- All services currently follow the quotation path.

**Request page.** Names the service, explains that the final price comes after review, shows only the fields approved for that service, and offers a description area. **No in-site file upload.** It explains that files are exchanged through WhatsApp or Telegram and gives a clear contact action. Exact required fields and documents per service are **Open (OD-12)**; the interface reserves a configurable field area and, until approved, shows a quiet "fields pending business confirmation" state in design reviews only (never to customers).

**Applications and transfers.** The copy must say the library performs the administrative service on the customer's behalf; it is not a self-service form.

**Quotation.** A decision screen: request summary, quoted final price, Accept and Reject. Payment appears only after acceptance. Rejection closes the request without payment (PRD recommendation). Whether COD applies to services is **Open (OD-14)**. Turnaround times are **Open (OD-13)**; show none.

**Status labels (service):** Submitted → Admin Review → Quotation Sent → Awaiting Payment → Payment Verification → Payment Confirmed → Processing → Completed; terminal: Closed — Not Proceeding, Closed — Declined. Service statuses use their own wording, not order wording.

**Separation.** Services never appear as ordinary product cards, never enter the cart, and never use the product checkout.

---

## 21. Order Status UX

**Customer-readable labels.** The brief asked for six states. The PRD defines a longer lifecycle; the customer view groups them as follows, with plain Arabic-first wording **(label wording To Be Confirmed with the owner)**:

| Simple stage | Underlying PRD states | What the customer sees |
|---|---|---|
| **جديد / New** | Pending Review | "Received. The library is reviewing your order." |
| **مؤكد / Confirmed** | Accepted, Awaiting Payment, Payment Verification, Awaiting New Proof, Payment Confirmed, Customer Confirmation Required, Confirmed | The specific next step: pay and upload proof; proof under review; please upload new proof; please confirm (COD); payment received. |
| **جاري التجهيز / Preparing** | Preparing | "The library is preparing your order." |
| **جاهز للاستلام / Ready for pickup** | Ready for Pickup, then Picked Up | Pickup orders only; distinct from shipping states. |
| **تم الشحن / Shipped** | Shipped, Out for Delivery | Delivery progress, with no delivery time promise. |
| **تم التسليم / Delivered** | Delivered, Completed | Closed order; return access if eligible. |
| **ملغي / Cancelled** | Cancelled, Rejected | Terminal; reason shown when recorded. |

**Rules**

- Show a simple stage as the headline and the precise state as the detail line, so the six-stage overview never hides an action the customer must take.
- Payment status is shown separately from order status.
- Every state has a text label, semantic color, and (where useful) an icon. The next responsible party ("waiting for the library" or "waiting for you") is always named.
- The timeline reads in chronological order in RTL; terminal states stay visible.
- Notifications follow the persisted state; if live delivery fails, reloading shows the truth.

---

## 22. WhatsApp & Communication

WhatsApp is **not secondary**; it stays prominent and contextual, but it is a support channel and **never the order or service record**.

| Where | Action label (direction) | Boundary |
|---|---|---|
| Header / footer / contact page | "تواصل معنا عبر واتساب" | Persistent access |
| Product page | "اسأل عن المنتج" | Does not add to cart or create an order |
| Cart / checkout | "تحتاج مساعدة؟" | The checkout record remains authoritative |
| Order detail / tracking | "تواصل مع المكتبة بخصوص هذا الطلب" | No state change exists only in chat |
| Services | "تواصل لتبادل الملفات" | File exchange here; the request record stays authoritative |
| Admin order / customer / service | Contact the customer | Decisions are recorded in the Admin system |

**Not intrusive:** one persistent action that never covers the primary button or the checkout total; contextual labels instead of repeated identical buttons; distinct accessible names. Deep links carry only safe context such as a product or order reference, never payment proofs or private data. WhatsApp is not an automated notification channel. The destination number is **Open (OD-01)**.

Telegram appears only as an alternative for service file exchange. Social links (Facebook, TikTok) live in the footer and homepage trust area.

---

## 23. Responsive Design

Validated widths: 375, 480, 768, 1024, 1280, 1440, 1920.

| Area | Mobile | Tablet | Desktop |
|---|---|---|---|
| Header | Menu, logo, search, cart; account in menu; persistent WhatsApp | Expanded search, more routes visible | Full navigation with Shop leading |
| Catalog | 1–2 column grid; filters in a bottom sheet | 2–3 columns; filter drawer or panel | 4 columns; inline filters or sidebar |
| Product page | Stacked: gallery → info → action, with a sticky primary action | Media and info may split | Two-column editorial layout |
| Checkout | Single column; sticky total and next step | Single or split | Form plus summary (about two-thirds / one-third) |
| Order timeline | Vertical | Vertical or compact horizontal | Horizontal summary may accompany vertical detail |
| Services | One column, one primary action per screen | Same | Reading-width container |
| Admin | Drawer navigation; stacked cards or scrollable tables with preserved headers | Compact sidebar | Persistent sidebar, dense tables |

**Mobile priorities.** Phones are the main device for many students (inferred from the channel mix; no analytics provided, **Q-09**). Keep one clear action per screen, 44px touch targets, reachable controls, and visible totals. Never shrink desktop layouts until labels become unreadable.

---

## 24. Accessibility

The formal conformance level is **Open (OD-19)**. **Recommendation:** target WCAG 2.2 AA.

- **Contrast.** Primary green on white is the default action pairing. Gold is text-safe only at the darker tone. Check reversed text on green separately for Arabic and English.
- **Font sizes.** Body 16px minimum; secondary text not below 12–13px.
- **Touch targets.** 44×44px for customer-facing primary controls; 40px minimum for dense Admin icon actions with safe spacing.
- **Focus.** Always visible, in both RTL and LTR. Focus order follows logical reading order, not visual decoration.
- **Errors.** Linked to the field, with an icon plus text. Say what is wrong and what to do next. Announce on submit; don't steal focus on every blur.
- **Forms.** Persistent labels, correct input modes, preserved values.
- **Arabic RTL.** Logical (start/end) layout, direction-aware icons, isolated technical strings, localized labels for every icon, no justified text.
- **Keyboard.** All actions, menus, drawers, dialogs, and upload controls usable; dialogs trap and restore focus.
- **Status.** Never color alone.
- **Motion.** Respect reduced-motion preferences.
- **Screen readers.** Distinct names for repeated actions (e.g., "Ask about this book on WhatsApp"); skeletons do not announce as final content.

---

## 25. Motion & Interaction

Motion is feedback, not decoration.

- **Helps:** hover and focus feedback, dropdown reveal, drawer and modal entry, cart-add confirmation, upload progress, order-status updates (label and timeline only).
- **Avoid:** page-wide animation, autoplay, bouncing, parallax, animated hero effects, attention-seeking badges, heavy transitions on product images.
- **Durations:** fast about 120ms (hover/focus), normal about 200ms (dropdowns, buttons), slow about 320ms (drawers, modals). Ease-out to enter, ease-in to exit.
- **Loading.** Skeletons that match final structure for catalog, product, order, and Admin tables; a small spinner for a button action; never a successful-looking empty state while loading. Layout dimensions stay stable.
- **Feedback.** Immediate visual response to every action; success is precise ("Pending Review," not "Done").
- **Reduced motion.** Remove transforms and shimmer; keep immediate color and state changes.

---

## 26. Empty / Loading / Error States

| State | Principle | Next step offered |
|---|---|---|
| **Empty cart** | Plain: no items yet | Shop, categories, WhatsApp |
| **No search results** | Repeat query and filters | Clear or refine, browse catalog, WhatsApp |
| **Out of stock** | Clear unavailable state; no Add to cart | Pre-order if eligible; otherwise browse alternatives or ask on WhatsApp |
| **Pre-order** | Distinct state; no promised date unless the library enters one; price-honoring rule is Open (OD-10) | Request pre-order |
| **Loading** | Structure-matching skeletons | None |
| **Failed request** | Say what failed and whether anything was saved; reload to show the authoritative record | Retry, safe navigation, WhatsApp |
| **Failed payment / proof rejected** | Show the reason when recorded; no blame | Upload new screenshot |
| **Order issue** | Name the state and the responsible party | Contact the library about this order |
| **Not found / forbidden** | No data leakage | Home, Search, login |
| **Admin empty queue** | Say the queue is clear, without implying business success | Related module |

Do not claim an order failed solely because a live update failed; reload the persisted record.

---

## 27. Trust & Credibility

Trust is the owner's third pillar. The design shows it, not claims it.

- **Real physical location.** Address (once the landmark wording is confirmed, Q-02), business hours, and real photos of the library where available. A footer and contact page present them calmly.
- **Established business.** "Since 2023" is a confirmed fact and may be used plainly. Avoid inflated claims.
- **Contact availability.** WhatsApp persistent; phone numbers once OD-01 is resolved.
- **Shipping transparency.** Estimate before submission, the final cost clearly distinguished, the library chooses the carrier, and pickup free. No invented delivery times.
- **Payment clarity.** Cash options and digital options shown evenly; proof process explained in plain steps; "payment under review" is stated honestly.
- **Return and refund clarity.** Neutral, configurable wording; only the confirmed wrong or damaged item case is firm. **Detailed policy is Open (OD-15/16)**; do not publish promises.
- **Product availability.** Visible, current, and unambiguous. Stale availability or price is the greatest trust risk (Master Brief); product data must be kept current by the Admin.
- **Honest language.** No unqualified superlatives, no fake urgency.
- **Account and data safety.** Presented as quiet reassurance, not technical jargon. The brief states security as a trust requirement without defining mechanisms.

---

## 28. Seasonal Design Strategy

**Confirmed seasonal pattern.** July: summaries. August: applications and transfers. September: school supplies. Some stage-specific books appear at the start of their season and gradually disappear. Seasonal offers exist.

**Rule (Confirmed):** the site must represent the full library year-round.

**Design strategy.**

- Seasonal presence is a **temporary layer** on the homepage: a banner or module, a featured shelf, a highlighted services preview (for example, transfers in August).
- The **header, categories, and taxonomy never change** for a season. Seasonal items are surfaced; they do not move or replace permanent categories.
- Seasonal modules use the same components, colors, and typography as the rest of the site. No separate "campaign theme."
- Each module has a clear start and end (managed by the Admin; no taxonomy changes).
- A visitor in February must still see a complete, comprehensive library; the design should be reviewed in an off-season state, not only during peak.
- Offers show real prices and real conditions only; coupon governance is **Open (OD-17)**.

---

## 29. Content & Voice

**Language.** Arabic is primary; the tone is natural Egyptian-friendly, clear, human, and professional. English is a supported localization.

| Do | Don't |
|---|---|
| Short, concrete labels: "متوفر", "اطلب مسبقًا", "استلام من المكتبة — مجانًا" | Corporate jargon or heavy formal Arabic |
| Name the outcome on buttons: "أضف إلى السلة", "إرسال الطلب" | Vague labels like "Submit" or "Go" |
| Explain errors and what to do next | Blame the user or show raw system errors |
| Say exactly what state an order is in and who acts next | Say "confirmed" when it's pending, or "paid" when proof is under review |
| Use WhatsApp copy such as "تحتاج مساعدة؟" | Imply chat completes an order |
| Describe services as request-and-quotation | Show or imply a fixed service price |
| Let specialization show through specifics | Repeat "مكتبة الأزهري" mechanically (SEO stuffing) or use "أفضل مكتبة في مصر" |

**Product descriptions** are concise and sufficient to support a purchase decision, not exhaustive. Authoring is an Admin workload; who owns ongoing content is **Open (Q-10)**.

**SEO.** The brand's phrase must not be stuffed. Content should naturally communicate specialization, location, products, and services.

**Voice summary.** A knowledgeable shopkeeper who respects the customer's time.

---

## 30. Design Anti-Patterns

Avoid:

1. Treating the site as a seasonal store.
2. Letting gifts, games, or banners outrank books.
3. Reviews, ratings, "trust score" placeholders, or fake social proof.
4. Fixed prices for services, or services in the cart.
5. "Best / number one" claims, fake urgency, countdown timers, invented scarcity.
6. Delivery time or return-period promises that are not approved.
7. A map pin in the address form, phone OTP, or a transaction-ID field.
8. An in-site service file upload.
9. Making WhatsApp the checkout or the record, or burying it.
10. Heavy gradients, glassmorphism, large decorative patterns, mosque silhouettes, repeated calligraphy.
11. A government or religious-portal look; a generic Shopify or SaaS look; a childish look.
12. Cropping, tinting, or filtering book covers.
13. Hiding availability, shipping, or total changes.
14. Status communicated by color alone.
15. Mixing icon families, mirroring object icons, or justifying Arabic text.
16. Feature bloat: wishlist, compare, quick-view, chatbots, gamification, or any feature without a stated customer or business need.
17. Positioning the brand as an LMS, academy, or startup.

---

## 31. Design Decisions

| # | Decision | Why | Status |
|---|---|---|---|
| D1 | Direction: Modern Islamic Editorial | Matches "Islamic + educational + modern + trustworthy" and avoids both old-fashioned religious and generic SaaS looks | Recommendation |
| D2 | Green leads, gold accents only | Mirrors the existing logo's green and gold, with gold limited for contrast and calm | Recommendation (exact values To Be Confirmed against logo) |
| D3 | Ivory canvas, white surfaces | Warmth and readability; comfortable on long sessions | Recommendation |
| D4 | Border before shadow | Keeps product grids calm and avoids a floating-card look | Recommendation |
| D5 | Books first in all structure | Owner rule: books are the core | Confirmed |
| D6 | Services in a separate section and lifecycle | Prices depend on the case; avoids false promises | Confirmed |
| D7 | Pickup and cash options shown as first-class | Trust mechanisms in the Egyptian retail context | Confirmed |
| D8 | WhatsApp contextual, never a record | Owner wants it important, and the website remains authoritative | Confirmed |
| D9 | No dark mode in V1 | No evidence of need; adds cost to imagery and Admin | Recommendation |
| D10 | No reviews or ratings | Out of scope by decision | Confirmed |
| D11 | Arabic and RTL designed first | Primary customer language | Confirmed |
| D12 | Simple six-stage order view above detailed states | Customers want clarity; the PRD lifecycle is longer | Recommendation |
| D13 | Estimate vs final shipping cost shown separately | Shipping is estimated and can be adjusted by the library | Confirmed behavior; binding point Open |
| D14 | Geometric motif only at large scale, low contrast, outside dense content | Islamic character without visual noise | Recommendation |
| D15 | One icon family (outline) | Consistency and calm | Recommendation |

---

## 32. Open Questions

**Design-specific**

| ID | Question |
|---|---|
| Q-01 | **Repository audit.** No repository was accessible. Provide it (or screenshots) so existing UI, tokens, components, and inconsistencies can be documented. |
| Q-02 | Exact wording of the location landmark: "Al-Rahbat School" (Master Brief) vs "Sisters' School" (project prompt). |
| Q-03 | Logo file and exact brand colors and typeface; confirm or adjust the proposed palette and fonts. |
| Q-04 | Numeral style for prices and dates (Arabic-Indic vs Latin). |
| Q-05 | Availability of real library and product photography. |
| Q-06 | Whether to show related products and, if so, the rule. |
| Q-07 | Whether Azhar content gets its own labeled entry under Books, and the exact sub-category tree. |
| Q-08 | Which sort options are allowed. |
| Q-09 | Device and traffic analytics (none provided) to validate mobile assumptions. |
| Q-10 | Who owns product descriptions and ongoing content and social media. |
| Q-11 | Customer-facing wording of the simplified order stages. |
| Q-12 | Whether hero and homepage copy follows the Master Brief's working value proposition. |

**Business Open Decisions inherited from the source documents**

OD-01 phone numbers · OD-02 email verification gating · OD-03 to OD-06 shipping rate source, binding, delivery times, excluded areas · OD-07 COD confirmation timeout · OD-08/09 stock contention and thresholds · OD-10/11 pre-order price honoring and allocation · OD-12 to OD-14 service fields, turnaround, COD for services · OD-15/16 return policy and refund timing · OD-17 coupon governance · OD-18 KPI targets · OD-19 accessibility, performance, availability targets · **OD-20 final payment-method list (cash at library vs six-method PRD list)** · OD-21 partial acceptance of multi-item orders. Also open from the Master Brief: exact service pricing models, which products are non-returnable, and paid-advertising strategy.

---

## 33. Design Implementation Notes

High level only; technical details live in the other project documents.

- **Stack context.** Angular with Tailwind CSS is the confirmed frontend baseline. Keep colors, type, spacing, radius, motion, and breakpoints as named semantic tokens so a future theme or palette correction (Q-03) is a single change.
- **Build shared components once**, then compose: primitives → composites (product card, status badge, order summary) → domain components (order timeline, payment-proof uploader, quotation card) → page shells (storefront, account, Admin). Reuse before inventing.
- **One status presentation** (label, tone, icon) shared by customer and Admin views.
- **Everything configurable that is Open:** payment methods, contact numbers, shipping estimate wording, policy copy, service form fields. Do not hard-code unresolved rules in copy.
- **RTL from the start**, using direction-aware layout rather than patching later; keep controlled left-to-right islands for phone numbers, ISBNs, emails, and references.
- **Test at** 375, 480, 768, 1024, 1280, 1440, 1920 in Arabic and English, including long Arabic titles and mixed Arabic/Latin metadata.
- **Content readiness.** Launch with accurate price, availability, and images; baseline descriptions; missing descriptions must still render a complete-looking page.
- **Review in the off-season** to confirm the site still reads as the whole library.
- **Quality bar for sign-off.** Does it feel like Al-Azhari Library rather than a template? Does it work for students and parents? Does it keep services distinct? Are assumptions clearly separated from confirmed facts?

---

*End of DESIGN.md. Treat this as the visual and UX baseline; update it when Open Questions are resolved or the repository audit (Q-01) is completed.*
