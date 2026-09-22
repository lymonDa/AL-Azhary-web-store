# AL-AZHARI LIBRARY — Design System

**مكتبة الأزهري**

Production design-system specification for the AL-AZHARI LIBRARY online store, student-service request platform, customer account, and Admin operating interface.

> **Status:** Design recommendation baseline for stakeholder review  
> **Prepared:** 22 September 2026  
> **Primary direction:** Modern Islamic Editorial  
> **Functional authority:** Product Requirements Document v1.0  
> **Business/context authority:** Master Product Brief v2.0  
> **Architecture reference:** Information Architecture & Sitemap baseline  
> **Implementation target:** Angular + Tailwind CSS  
> **Locale priority:** Arabic-first, RTL-first; English LTR supported

---

## 1. Document Control

### 1.1 Purpose

This document defines the visual language, tokens, component behavior, responsive rules, accessibility baseline, and implementation guidance for AL-AZHARI LIBRARY. It is intended to be used by:

- UX and UI designers creating storefront, account, service, checkout, and Admin experiences.
- Angular developers implementing shared components and page shells.
- QA validating visual, interaction, RTL, responsive, and state behavior.
- Future contributors extending the product without introducing conflicting patterns.

This is a design specification, not a replacement for the Product Requirements Document or Information Architecture. It does not create new business rules, payment gateways, service workflows, catalog categories, or routes.

### 1.2 Source status vocabulary

| Label | Meaning | How this document uses it |
|---|---|---|
| **Confirmed** | Explicitly stated in the PRD or Master Product Brief. | Must be preserved in design and implementation. |
| **Design recommendation** | A visual or interaction decision made to implement confirmed requirements. | Use unless a better decision is approved; it is not a business rule. |
| **Open decision** | Not settled in the source documents. | Keep configurable or visibly unresolved; do not hard-code a promise. |

### 1.3 Source hierarchy

1. Explicit decisions in the PRD.
2. Master Product Brief.
3. Information Architecture and Sitemap.
4. Existing approved brand identity and logo.
5. Design-system recommendations in this document.

Where the PRD and Master Product Brief differ, the PRD is the functional authority and the discrepancy remains visible as an open decision. The payment-method discrepancy is recorded in [§35 Open Design Decisions](#35-open-design-decisions).

### 1.4 Scope covered

The system covers:

- Public home, catalog, category, search, product detail, cart, and checkout.
- Product variants, availability, pre-order, payment proof, delivery, and pickup.
- Customer authentication, account, order history, service requests, notifications, and returns.
- Student-service catalog, request, quotation, acceptance/rejection, and fulfillment states.
- Admin dashboards, queues, tables, catalog management, content, inventory, shipping, returns/refunds, reports, and RBAC.
- Empty, loading, error, success, confirmation, and notification states.

### 1.5 Explicit non-goals

The design system must not introduce:

- Product reviews or ratings.
- An LMS, course experience, or social network.
- Marketplace or multi-seller behavior.
- Automated payment gateways.
- Google Maps pin entry or phone OTP.
- In-site service-file upload.
- A second checkout for services.
- A permanent season-only catalog.
- Unqualified “best,” “number one,” or equivalent market-leadership claims.

---

## 2. Design System Purpose

The online product extends a real physical library in Qena. Its job is to make the library’s existing strengths—Azhar specialization, product breadth, human support, and local trust—easier to discover and use online.

The system must make these questions easy to answer:

1. **What is this?**
2. **Is it available?**
3. **What does it cost?**
4. **What can I do next?**
5. **When the flow needs a person, how do I reach the library?**

The design system therefore prioritizes information clarity over decoration, books over secondary merchandise, and a visible human support path without making WhatsApp the authoritative order or service record.

### 2.1 Six product jobs

Every future UI decision should support at least one of these jobs:

1. Digital storefront.
2. Searchable product catalog.
3. Structured student-service request channel.
4. Customer relationship and order-status channel.
5. Professional brand presence for social and referral traffic.
6. Revenue-generating sales channel alongside the physical library.

### 2.2 Experience promise

The experience should feel like **the same trusted library, discoverable and purchasable online**. It should be:

- Clear enough for a student or parent to use quickly on a phone.
- Credible enough for an out-of-Qena customer to order.
- Detailed enough to reduce repetitive availability, price, and status questions.
- Human enough that a customer never feels trapped in self-service.

---

## 3. Source of Truth & Design Authority

### 3.1 Product-to-design translation

| Product truth | Design consequence |
|---|---|
| Books are the core business. | Books lead navigation, home discovery, featured placement, and default catalog presentation. |
| Azhar expertise is the differentiator, not the audience boundary. | Show Azhar depth without excluding general-education, university, or parent customers. |
| Services have variable pricing. | Keep Services separate from fixed-price product shopping; use request → review → quotation. |
| WhatsApp is trusted support. | Keep contextual WhatsApp actions visible, but label them as support rather than checkout or order records. |
| Payment proof is manually reviewed. | Design upload, review, rejection, and re-upload states; do not imply automated payment confirmation. |
| Pickup is free. | Show Pickup as a first-class fulfillment option and show its cost as free. |
| Shipping cost is estimated by location and may be adjusted by Admin. | Distinguish estimate from final Admin-confirmed cost; do not invent delivery promises. |
| Seasonal demand is real but temporary. | Use seasonal merchandising modules over a stable catalog and navigation. |
| Product descriptions are incomplete at launch. | Support a useful missing-description state without blocking product publication. |
| Some rules remain open. | Use configurable copy and states instead of inventing policy text, deadlines, or numeric thresholds. |

### 3.2 Authority in a component

When a component displays business behavior, its specification must link to the relevant requirement ID in the PRD or IA. For example:

- `ProductCard` → `CAT-001`, `CAT-006`.
- `PaymentProofUploader` → `CHK-008`, `PAY-002`–`PAY-005`.
- `ServiceQuotation` → `QUOTE-001`–`QUOTE-003`.
- `OrderTimeline` → `ORD-002`, `§8.1`.

Visual polish must never change the allowed states, action ownership, or source-of-truth boundary.

---

## 4. Brand & Product Design Direction

### 4.1 Core direction: Modern Islamic Editorial

The visual system combines:

- **Modern library:** calm surfaces, clear structure, reliable navigation.
- **Islamic heritage:** restrained geometric character and a dark-green/gold relationship.
- **Editorial bookstore:** strong typography, generous whitespace, book-cover prominence.
- **Student-friendly commerce:** direct actions, visible prices, practical states, mobile-first layouts.

The interface should feel premium and composed without becoming distant. The Islamic character belongs in the system’s proportion, geometry, and restrained accents—not in repeated decorative imagery.

### 4.2 Preserve the existing identity

The existing logo and its book, education, pen, green, and gold cues are the foundation. Do not redraw or reinterpret the logo inside product UI. Use the logo in:

- Full lockup where there is enough width.
- Mark or compact lockup in mobile navigation where the approved asset supports it.
- Monochrome or reversed version only when an approved logo asset exists.

Do not place the logo on a busy image, apply arbitrary filters, or recolor it to match a component.

### 4.3 Desired and undesired character

| The system should feel | The system must not feel |
|---|---|
| Trustworthy and expert | Like an unverified marketplace |
| Modern and calm | Old-fashioned or over-ornamented |
| Student-oriented and practical | Childish or casual |
| Islamic in character | Stereotypically religious |
| Warm and human | Coldly corporate |
| Editorial and book-led | Like an LMS or generic dashboard |

### 4.4 Content and tone

Use short, concrete labels. Prefer:

- “متوفر” / “In stock”
- “اطلب مسبقًا” / “Pre-order”
- “استلام من المكتبة — مجانًا” / “Pickup — Free”
- “تحتاج مساعدة؟ تواصل معنا عبر واتساب” / “Need help? Contact us on WhatsApp”

Do not use:

- Unqualified superlatives.
- Urgency or scarcity that the inventory does not support.
- A final service price before Admin quotation.
- Delivery times that have not been approved.

Arabic copy is the default. English is a supported localization, not a reason to design Arabic as an afterthought.

---

## 5. Design Principles

1. **Content before decoration.** The product name, price, availability, and next action receive attention before motifs or effects.
2. **Books are the anchor.** Supplies, gifts, games, and services support the library’s core; they do not compete with it.
3. **Arabic-first, RTL-first.** Composition, line length, hierarchy, and interaction are designed for Arabic before being adapted to English.
4. **Clarity over cleverness.** A customer should not have to interpret whether an item is purchasable, quoted, pending, or unavailable.
5. **Trust over hype.** Show real states and real process. Never replace evidence with marketing language.
6. **Human support remains first-class.** Make WhatsApp available for clarification and edge cases without turning it into the system of record.
7. **Services are not products.** Do not force variable-price services into a fixed-price cart mental model.
8. **Every state is designed.** Loading, error, empty, rejected, unavailable, and waiting states are part of the product.
9. **Seasonal is a layer, not the structure.** Merchandising can change; the permanent information architecture should remain stable.
10. **Mobile is a primary experience.** Existing customer behavior is concentrated in mobile social and messaging channels.
11. **Accessibility is part of quality.** Contrast, focus, labels, touch targets, reduced motion, and screen-reader behavior are acceptance criteria.
12. **Consistency beats novelty.** Extend existing tokens and components before creating a new visual pattern.

---

## 6. Visual Language

### 6.1 Composition

Use editorial rhythm:

- One clear page purpose above the fold.
- A strong heading with a short explanatory line where needed.
- Generous whitespace around content groups.
- Clear separation between discovery, evaluation, and action.
- Book imagery as the visual evidence of the catalog.
- Green for primary brand/action anchors; gold for small accents and emphasis.

### 6.2 Surface hierarchy

The system has four practical layers:

1. **Canvas:** warm ivory background for public pages and light Admin shells.
2. **Surface:** white cards, forms, tables, and elevated sections.
3. **Raised surface:** menus, drawers, popovers, and review panels.
4. **Scrim/modal layer:** overlays requiring focused attention.

Avoid stacking multiple borders, shadows, and tinted backgrounds on the same component.

### 6.3 Islamic geometric motif

Use a single restrained geometric vocabulary:

- Low-contrast line geometry.
- Large-scale partial arcs or grid fragments.
- 4–8% opacity on light surfaces.
- Gold only as a thin rule or small anchor.
- Never behind dense form content or text.

Do not use mosque silhouettes, repeated calligraphy, heavy ornamental frames, or decorative pattern fields that compete with product information.

### 6.4 Image treatment

Product images are catalog evidence. Do not apply brand-color overlays, aggressive crop filters, or hover transformations that hide the book cover. Marketing imagery may use editorial crops, but product images use the [Product Image System](#17-product-image-system).

---

## 7. Color System

### 7.1 Color roles

Green carries brand presence and primary actions. Gold is an accent. Ivory provides warmth without reducing readability. Text is deep charcoal rather than pure black.

### 7.2 Core tokens

| Token | HEX | RGB | Role and usage |
|---|---:|---:|---|
| `--color-brand-green-900` | `#083328` | `8, 51, 40` | Deepest brand tone; dark shell, reversed logo context, high-emphasis text on light backgrounds. |
| `--color-brand-green-800` | `#0B3F31` | `11, 63, 49` | Hover/pressed dark action and strong brand surfaces. |
| `--color-brand-green-700` | `#0F4C3A` | `15, 76, 58` | Primary action, links, headings, active navigation. |
| `--color-brand-green-600` | `#17624C` | `23, 98, 76` | Hover-safe accent and secondary brand emphasis. |
| `--color-brand-green-100` | `#E6F0EC` | `230, 240, 236` | Selected states, soft callouts, success-adjacent brand surfaces. |
| `--color-gold-700` | `#80601D` | `128, 96, 29` | Accessible gold text/icon accent where contrast is required. |
| `--color-gold-600` | `#A47925` | `164, 121, 37` | Accent rule, small highlight, selected indicator. |
| `--color-gold-500` | `#B58B3A` | `181, 139, 58` | Decorative accent only; not body text on white. |
| `--color-gold-100` | `#F5EDD9` | `245, 237, 217` | Notice background and subtle accent surface. |
| `--color-ivory-50` | `#FCFBF8` | `252, 251, 248` | Page canvas. |
| `--color-ivory-100` | `#F6F4EE` | `246, 244, 238` | Soft section surface. |
| `--color-white` | `#FFFFFF` | `255, 255, 255` | Cards, inputs, menus, and high-clarity surfaces. |
| `--color-text-primary` | `#1F2A26` | `31, 42, 38` | Main text and headings. |
| `--color-text-secondary` | `#53615B` | `83, 97, 91` | Supporting text, metadata, helper copy. |
| `--color-text-muted` | `#718078` | `113, 128, 120` | Placeholder and low-priority metadata only. |
| `--color-border` | `#D7DED9` | `215, 222, 217` | Default borders and dividers. |
| `--color-border-strong` | `#AEBBB4` | `174, 187, 180` | Focus-adjacent, table, and stronger separation. |

### 7.3 Semantic tokens

| Token | HEX | Usage |
|---|---:|---|
| `--color-success-700` | `#176B4D` | Completed, confirmed, available, payment verified. |
| `--color-success-100` | `#E5F3EC` | Success backgrounds. |
| `--color-warning-700` | `#8A5A00` | Awaiting action, pending review, pre-order. |
| `--color-warning-100` | `#FFF4D6` | Warning and pending backgrounds. |
| `--color-error-700` | `#B42318` | Validation errors, rejected, failed, destructive action. |
| `--color-error-100` | `#FDE9E7` | Error backgrounds. |
| `--color-info-700` | `#155E75` | Informational and support states. |
| `--color-info-100` | `#E6F4F7` | Informational backgrounds. |

### 7.4 Accessibility rules

- `--color-brand-green-700` on white is the default primary-action combination and must meet at least WCAG AA for normal text.
- `--color-gold-500` is never used as small text on white. Use `--color-gold-700` for text.
- Do not encode status by color alone. Pair color with a label and, where useful, an icon.
- Focus indicators use `--color-brand-green-700` plus a 2px outer ring; never rely on a subtle color shift.
- Disabled content must remain understandable. Reduce contrast through opacity only after preserving readable labels and affordance boundaries.
- Large reversed text on green surfaces must be checked for Arabic and English line-height and contrast separately.

### 7.5 Dark mode

**Design recommendation: do not include dark mode in V1.** The current brand direction, product imagery, administrative workflows, and content workload do not justify a second theme yet. Preserve token naming so a future theme can be added without changing component APIs. Do not expose a dark-mode switch until contrast, image behavior, and brand approval are evaluated.

---

## 8. Typography System

### 8.1 Font choices

**Arabic:** IBM Plex Sans Arabic  
**English and Latin numerals:** Inter  
**Fallbacks:** `system-ui`, `-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, sans-serif

These families are retained as the starting recommendation because they are legible, professional, available for web use, and suitable for mixed Arabic/Latin product metadata. The logo remains an approved brand asset and is not recreated with type.

### 8.2 Typography tokens

Sizes below are desktop defaults. Mobile behavior is listed explicitly rather than assumed.

| Token | Family | Weight | Size / line-height | Letter spacing | Usage |
|---|---|---:|---:|---:|---|
| `display-xl` | Arabic/Inter | 700 | 48px / 1.12 | `-0.02em` | Hero or major editorial statement. Mobile: 36px / 1.18. |
| `display-lg` | Arabic/Inter | 700 | 40px / 1.16 | `-0.015em` | Major storefront section. Mobile: 32px / 1.2. |
| `h1` | Arabic/Inter | 700 | 32px / 1.25 | `-0.01em` | Page title. Mobile: 28px / 1.28. |
| `h2` | Arabic/Inter | 700 | 26px / 1.3 | `-0.005em` | Major section title. Mobile: 22px / 1.34. |
| `h3` | Arabic/Inter | 700 | 22px / 1.35 | `0` | Card group or detail section. Mobile: 20px / 1.4. |
| `h4` | Arabic/Inter | 600 | 18px / 1.4 | `0` | Subsection, panel title. Mobile: 17px / 1.42. |
| `body-lg` | Arabic/Inter | 400 | 18px / 1.7 | `0` | Intro copy, explanatory service text. |
| `body` | Arabic/Inter | 400 | 16px / 1.65 | `0` | Default reading and form copy. |
| `body-sm` | Arabic/Inter | 400 | 14px / 1.55 | `0` | Supporting text, metadata, table cells. |
| `caption` | Arabic/Inter | 400 | 12px / 1.45 | `0.01em` | Timestamps, secondary labels. |
| `label` | Arabic/Inter | 600 | 14px / 1.4 | `0` | Form labels, section labels. |
| `button` | Arabic/Inter | 600 | 15px / 1.2 | `0` | Buttons and compact actions. |
| `price-lg` | Arabic/Inter | 700 | 24px / 1.2 | `-0.01em` | Product price and checkout total. |
| `price` | Arabic/Inter | 700 | 18px / 1.25 | `0` | Card price. |
| `product-title` | Arabic/Inter | 600 | 16px / 1.45 | `0` | Product card title. Mobile unchanged unless wrapping requires clamp. |
| `nav` | Arabic/Inter | 600 | 15px / 1.3 | `0` | Navigation item. |
| `table` | Arabic/Inter | 400 | 14px / 1.5 | `0` | Admin data tables. |
| `form-error` | Arabic/Inter | 500 | 13px / 1.45 | `0` | Inline validation. |
| `helper` | Arabic/Inter | 400 | 13px / 1.45 | `0` | Helper text and constraints. |

### 8.3 Typography rules

- Arabic body copy uses at least 1.55 line-height; dense Arabic UI may use 1.45 only for labels and tables.
- Never use all caps for Arabic. English eyebrow labels may use uppercase only for short decorative metadata.
- Keep product names intact where possible. Use a visible two-line clamp only when cards must align.
- Price numerals use Latin numerals only if the locale specification requires them; otherwise respect the active locale consistently. Do not mix numeral styles inside one amount.
- Use tabular numerals in Admin tables, order totals, and reports where alignment matters.
- Do not use justified Arabic paragraphs.
- Use `font-variant-numeric: tabular-nums` for prices, identifiers, counts, and dates in aligned contexts.

---

## 9. RTL / LTR System

### 9.1 Base direction

Arabic is the default:

```html
<html lang="ar" dir="rtl">
```

English switches the document to `lang="en" dir="ltr"`. Mixed content uses directional isolation rather than manual character spacing.

### 9.2 Layout rules

- Use CSS logical properties: `margin-inline`, `padding-inline`, `inset-inline`, `border-start-start-radius`, and `text-align: start`.
- The main navigation begins at the right in RTL and at the left in LTR.
- Breadcrumbs follow reading direction; the current page remains last in the reading order.
- Product galleries place the main media and thumbnails according to the page composition, but directional controls must indicate actual movement.
- Tables keep numeric values aligned consistently. Do not blindly mirror every column if doing so makes operational comparison harder.
- Order timelines follow chronological reading order. In RTL, the visual line may run right-to-left; the numbered state sequence must remain clear.
- Drawers enter from the inline end for contextual navigation unless the interaction requires a physical-side convention.
- Modal action order follows reading direction while destructive actions remain visually and semantically distinct.

### 9.3 Icons

Do not mirror icons that represent objects:

- Search, cart, book, printer, upload, payment, and WhatsApp icons keep their shape.

Mirror icons that represent direction or progression:

- Back, forward, next, previous, arrow, and breadcrumb separators use the active direction.

Use `dir="ltr"` around phone numbers, email addresses, order references, URLs, ISBNs, and mixed technical strings when needed.

### 9.4 Forms

- Labels and helper text align to the active direction.
- Numeric, email, phone, ISBN, coupon, and reference inputs use an appropriate `inputmode` and may use `dir="ltr"` while keeping the field positioned in the form.
- Placeholder text is not a label.
- Error messages appear in the reading direction below the field and are connected with `aria-describedby`.

### 9.5 Direction QA

Test every shared component in Arabic and English for:

- Text clipping and incorrect glyph fallback.
- Icon direction and tooltip placement.
- Focus order and keyboard progression.
- Long Arabic labels and mixed Arabic/Latin product metadata.
- Tables, order timelines, product gallery controls, drawers, and toasts.

---

## 10. Spacing System

### 10.1 Base scale

Use a 4px base unit:

| Token | Value | Typical use |
|---|---:|---|
| `space-0` | 0 | Reset. |
| `space-1` | 4px | Icon gap, compact label separation. |
| `space-2` | 8px | Inline gap, badge padding basis. |
| `space-3` | 12px | Input internal gap, metadata group. |
| `space-4` | 16px | Default component gap and card padding on mobile. |
| `space-5` | 20px | Compact section spacing. |
| `space-6` | 24px | Card padding and field group spacing. |
| `space-8` | 32px | Component group and mobile section spacing. |
| `space-10` | 40px | Major section spacing. |
| `space-12` | 48px | Desktop component group spacing. |
| `space-16` | 64px | Major section separation. |
| `space-20` | 80px | Editorial hero/section separation. |
| `space-24` | 96px | Large desktop section separation. |
| `space-32` | 128px | Rare page-level breathing room. |

### 10.2 Application rules

- Mobile page padding: 16px; use 20px for spacious storefront sections when the viewport allows.
- Tablet page padding: 24px.
- Desktop page padding: 32px; container edges govern final alignment.
- Card padding: 16px mobile, 20px desktop, 24px only for high-information panels.
- Form fields in one group: 16px vertical gap; related helper/error content: 4–8px.
- Section title to content: 16px–24px.
- Public sections: 48px–80px vertical separation depending on importance.
- Admin dense workflows: 24px–40px; do not use storefront editorial spacing in a queue or table.

Do not use arbitrary one-off values when a token can express the relationship.

---

## 11. Layout & Grid

### 11.1 Containers

| Token | Maximum width | Use |
|---|---:|---|
| `container-reading` | 720px | Policy, service explanation, long-form content. |
| `container-content` | 1120px | Forms, product detail, account content. |
| `container-wide` | 1280px | Storefront grid, checkout, Admin content. |
| `container-maximum` | 1440px | Wide desktop shell; do not stretch text or cards indefinitely. |

All containers use the active direction and center alignment. At 1920px, preserve readable line length rather than expanding every card.

### 11.2 Grid rules

- Base grid uses 12 columns on desktop with 24px gutters.
- Tablet uses 8 columns with 20px gutters.
- Mobile uses 4 columns with 16px gutters, though most content is one column.
- Product cards use CSS grid with a minimum card width rather than hard-coded item counts where possible.
- Public product grid: 2 columns at 375–767px when card content remains readable; 3 at tablet/compact desktop; 4 at wide desktop; 5 only when image and title remain legible and approved by visual QA.
- Admin grids prioritize task width over card count. Dashboard summary cards may be 1 column mobile, 2 tablet, 4 desktop.

### 11.3 Page templates

**Public storefront**

- Header and persistent WhatsApp access.
- Page title or discovery hero.
- Main content container.
- Contextual action area.
- Footer with confirmed business information only.

**Product detail**

- Breadcrumbs.
- Media gallery.
- Product identity and metadata.
- Price and availability.
- Variant selection when applicable.
- Primary purchase/pre-order action.
- Support action.

**Checkout**

- Step indicator.
- Main form column.
- Sticky summary on desktop; bottom summary/action treatment on mobile.
- WhatsApp support without obscuring the primary checkout action.

**Account**

- Compact account navigation.
- Current operational state before secondary settings.
- Stacked mobile section navigation.

**Admin**

- Separate authenticated shell.
- Persistent sidebar on desktop.
- Compact top bar and drawer navigation on mobile.
- Operational queues first, then catalog, services, inventory/shipping, returns, content, reports, and settings.

### 11.4 Checkout split

Desktop checkout uses approximately 2/3 main form and 1/3 order summary. On mobile, the summary becomes a collapsible or sticky bottom treatment with the current total and next action always visible. Do not hide shipping or discount changes inside a collapsed summary after they have changed.

---

## 12. Responsive Breakpoints

These viewport references are required by the project brief. Breakpoints are chosen around actual layout changes, not device names.

| Name | Range | Why it exists |
|---|---|---|
| `xs` | 0–479px | Small phones; one-column content, compact header, bottom actions. Validate at 375px. |
| `sm` | 480–767px | Larger phones and small landscape; two-column product grid when readable. Validate at 480px. |
| `md` | 768–1023px | Tablet; 8-column layout, expanded filters/drawers, two-column detail where viable. Validate at 768px. |
| `lg` | 1024–1279px | Laptop; desktop navigation and checkout split become viable. Validate at 1024px. |
| `xl` | 1280–1439px | Desktop; full container and stable four-column catalog. Validate at 1280px. |
| `2xl` | 1440–1919px | Large desktop; more breathing room without increasing text line length. Validate at 1440px. |
| `3xl` | 1920px+ | Very wide screens; cap container and use balanced whitespace. Validate at 1920px. |

### 12.1 Responsive transformations

| Area | Mobile | Tablet | Desktop |
|---|---|---|---|
| Header | Menu, logo, search, cart; account in menu/header; persistent WhatsApp. | Expanded search and route access as space permits. | Full primary navigation with Shop leading. |
| Search/filter | Full-width input; filters in bottom sheet/drawer. | Filter drawer or two-column filter panel. | Inline filters or sidebar where the result set benefits. |
| Product grid | 1–2 columns based on card width. | 2–3 columns. | 4 columns by default; more only after content QA. |
| Product detail | Stacked gallery → info → action; sticky/bottom primary action. | Media and info may split. | Two-column editorial layout. |
| Checkout | Single column; sticky total/next action. | Single or split based on width. | Form + summary split. |
| Order timeline | Vertical list with clear status labels. | Vertical or compact horizontal only if labels fit. | Horizontal summary may accompany vertical detail. |
| Admin tables | Cards or horizontally scrollable table with preserved headers. | Table with priority columns. | Full table with filters and bulk actions. |
| Modal | Bottom sheet for selection/filter tasks; centered dialog for confirmation. | Bottom sheet or centered based on content. | Centered dialog/drawer according to task. |

Never solve responsive behavior by shrinking desktop UI until labels become unreadable.

---

## 13. Border Radius

Use restrained geometry:

| Token | Value | Use |
|---|---:|---|
| `radius-none` | 0 | Data table cells, full-bleed image edges where needed. |
| `radius-sm` | 6px | Inputs, small controls, compact cards. |
| `radius-md` | 10px | Buttons, standard cards, product image containers. |
| `radius-lg` | 16px | Feature panels, modal panels, service explanation cards. |
| `radius-xl` | 24px | Hero or editorial feature surface only. |
| `radius-pill` | 999px | Badges, status chips, compact filter tokens. |

Use one dominant radius per component. Do not make every surface pill-shaped. Product cards should feel like catalog objects, not social media bubbles.

---

## 14. Elevation & Shadows

The system uses borders and surface contrast before shadow.

| Level | Token | Suggested shadow | Use |
|---|---|---|---|
| 0 | `shadow-none` | none | Page canvas and flat sections. |
| 1 | `shadow-sm` | `0 1px 2px rgba(24, 42, 34, .06)` | Cards, fields, subtle separation. |
| 2 | `shadow-md` | `0 6px 18px rgba(24, 42, 34, .10)` | Menus, popovers, sticky summary. |
| 3 | `shadow-lg` | `0 14px 32px rgba(24, 42, 34, .14)` | Drawers and prominent floating panels. |
| Modal | `shadow-modal` | `0 20px 60px rgba(24, 42, 34, .20)` | Dialogs over a scrim. |
| Floating | `shadow-floating` | `0 8px 20px rgba(24, 42, 34, .16)` | Persistent WhatsApp action when detached. |

Avoid shadows on every card in a grid. Use a border or surface change for most catalog items.

---

## 15. Iconography

### 15.1 Primary icon language

**Use Lucide Icons through the Angular-compatible Lucide package.**

Rationale:

- Consistent open-source outline language.
- Strong coverage for commerce, books, services, orders, forms, and Admin workflows.
- Directional icons can be controlled without forcing every object icon to mirror.
- Stroke-based forms suit the calm editorial visual language.

Do not mix Material Symbols, Font Awesome, and Lucide inside the same product surface.

### 15.2 Icon tokens

| Token | Size | Use |
|---|---:|---|
| `icon-xs` | 12px | Dense metadata, status detail. |
| `icon-sm` | 16px | Inline labels, table actions. |
| `icon-md` | 20px | Default buttons and navigation. |
| `icon-lg` | 24px | Primary actions, empty states. |
| `icon-xl` | 32px | Feature/empty-state illustration. |
| `icon-2xl` | 48px | Large empty or success state. |

Default stroke width is 1.75px; use 2px at 16px or below when the icon loses clarity. Icons inherit semantic text color unless a status token is explicitly applied.

### 15.3 Icon rules

- Every icon-only button needs an accessible name and visible tooltip on desktop where appropriate.
- Do not use icons as the only signal for order status; pair with a text label.
- Use `Search`, `ShoppingCart`, `BookOpen`, `Printer`, `Upload`, `MessageCircle`, `Package`, `Truck`, `MapPin`, `Clock3`, `CheckCircle2`, `AlertCircle`, `XCircle`, `Info`, and `RefreshCw` as the preferred semantic vocabulary.
- Use `ArrowLeft`/`ArrowRight` according to direction and meaning, not as a fixed visual asset.
- Keep icon and label alignment based on inline direction, with 8px gap by default.

---

## 16. Illustration & Imagery

### 16.1 Imagery hierarchy

1. Real product/book images.
2. Approved library and location imagery.
3. Restrained geometric brand accents.
4. Functional line icons.

Do not use generic stock imagery to imply inventory, staff, or service outcomes that have not been verified.

### 16.2 Empty and error illustrations

Use simple Lucide-based compositions or approved geometric shapes. Keep them:

- Low contrast.
- Small enough not to delay the action.
- Clearly secondary to the message and recovery control.

### 16.3 Accessibility

- Every meaningful image has localized alt text.
- Decorative motifs use empty alt text and are hidden from assistive technology.
- Product alt text includes product name, not “image of book.”
- Do not place essential text inside an image.

---

## 17. Product Image System

### 17.1 Default behavior

- Preferred book-cover aspect ratio: 2:3.
- Product image container uses a warm neutral background, not pure black.
- Use `object-fit: contain` for book covers and products where the full object is purchase evidence.
- Preserve the full cover; do not crop title, author, publisher, or edition information.
- Use `object-position: center`.
- Images must be lazy-loaded below the fold and use a low-quality placeholder or neutral skeleton while loading.

### 17.2 Gallery

- Desktop: primary image with thumbnail or secondary image controls only when multiple images exist.
- Mobile: swipeable gallery with visible position indicator and accessible previous/next controls.
- Variant selection updates image only when a variant image exists; otherwise retain the product image and update the selected metadata.
- Hover behavior is limited to a subtle border/surface response. No zoom that hides the complete cover.

### 17.3 Missing and poor-quality images

- Missing image: use a book/product icon with “Image coming soon” or localized equivalent; never show a broken image icon.
- Low-quality image: preserve the image, show a stable container, and avoid artificial sharpening.
- Admin should see image completeness as a content-quality concern, but product publication is not blocked solely by missing description or image unless the product requirement later changes.

### 17.4 Product-card image sizing

Use a consistent image area across a grid. Do not allow one portrait cover to make adjacent cards jump in height. Product title and price remain outside the image for scanability.

---

## 18. Motion System

Motion is feedback, not decoration.

### 18.1 Durations and easing

| Token | Duration | Use |
|---|---:|---|
| `motion-fast` | 120ms | Hover, focus, icon feedback. |
| `motion-normal` | 200ms | Dropdown, button state, inline expansion. |
| `motion-slow` | 320ms | Drawer, modal, page-level panel. |

Use:

- `ease-out` for entering.
- `ease-in` for exiting.
- `cubic-bezier(.2, .8, .2, 1)` for drawer/modal movement.

### 18.2 Interaction guidance

- Button press: color/border response within `motion-fast`; no bounce.
- Dropdown: fade and translate 4px at `motion-normal`.
- Modal: scrim fade and panel scale from 0.98 at `motion-slow`.
- Drawer: translate from the correct physical side at `motion-slow`.
- Toast: enter/exit without displacing the current page unexpectedly.
- Product interaction: border and image container feedback only; avoid autoplay.
- Loading: skeleton shimmer may be used sparingly; use a static placeholder when reduced motion is enabled.
- Order status transition: update label and timeline state; do not animate the entire page.

### 18.3 Reduced motion

Under `prefers-reduced-motion: reduce`:

- Remove transforms, shimmer, scale, and nonessential transitions.
- Keep immediate color/state changes.
- Never delay content or validation feedback for animation.

---

## 19. Accessibility

### 19.1 Target

**Design recommendation:** target WCAG 2.2 AA for the public storefront, checkout, account, services, and Admin interface. The PRD leaves the exact conformance level open; this recommendation provides a practical minimum and must be confirmed by the owner/product authority.

### 19.2 Requirements

- Keyboard access for every action.
- Visible focus indicator with at least 2px ring and sufficient contrast.
- Minimum 44×44px touch target for primary mobile controls; 40×40px minimum for dense Admin icon actions when spacing prevents accidental activation.
- Semantic headings in a logical hierarchy.
- Form labels always visible or programmatically associated.
- Errors announced through `aria-live` where appropriate and linked to the field.
- Dialogs trap focus, restore focus on close, and expose a meaningful title.
- Drawers and bottom sheets have dialog semantics when modal and navigation semantics when not.
- Status labels include text, not color alone.
- Tables include headers, scope, and responsive strategy.
- Skeletons do not announce as completed content.
- Network and real-time failures explain what is and is not saved.
- Repeated WhatsApp actions have distinct accessible names based on context, e.g. “Ask about this book on WhatsApp.”

### 19.3 Arabic and RTL accessibility

- Screen-reader output follows the reading order, not visual decoration.
- Do not add punctuation solely to create visual alignment in Arabic.
- Use localized labels for every icon.
- Isolate order references, prices, phone numbers, and email addresses with directional marks where needed.
- Test focus traversal in both RTL and LTR; visual right-to-left placement must not create a logical keyboard mismatch.

### 19.4 Forms and errors

Error structure:

1. Field remains visibly associated with the error.
2. Error uses icon plus text, not color alone.
3. Message says what is wrong and what to do next.
4. Focus moves only when it helps the user recover; do not steal focus on every blur.
5. Submit-level errors remain visible near the action and at the top summary for long forms.

---

## 20. Component Architecture

### 20.1 Layer model

1. **Foundations:** tokens, typography, color, spacing, icon, direction, motion.
2. **Primitives:** Button, Link, Input, Badge, Divider, Surface, Tooltip, Avatar.
3. **Composites:** Search Input, Product Card, Form Field, Status Badge, Order Summary, Data Table.
4. **Domain components:** Product Gallery, Payment Proof, Order Timeline, Service Quotation, Return Request.
5. **Page patterns:** Product Detail, Checkout, Account Overview, Admin Queue, Service Request.
6. **Shells:** Public Storefront, Customer Account, Admin.

A domain component may compose primitives but must not bypass tokens for its own colors, spacing, or state semantics.

### 20.2 Angular structure recommendation

```text
src/app/
  design-system/
    tokens/
    primitives/
    forms/
    commerce/
    orders/
    services/
    admin/
    feedback/
    layout/
  features/
    storefront/
    checkout/
    account/
    services/
    admin/
```

Recommended component APIs should expose semantic state and content rather than styling flags:

```ts
type Availability = 'in-stock' | 'out-of-stock' | 'pre-order-eligible';
type OrderStatus =
  | 'pending-review'
  | 'accepted'
  | 'awaiting-payment'
  | 'payment-verification'
  | 'awaiting-new-proof'
  | 'payment-confirmed'
  | 'customer-confirmation-required'
  | 'confirmed'
  | 'preparing'
  | 'ready-for-pickup'
  | 'picked-up'
  | 'shipped'
  | 'out-for-delivery'
  | 'delivered'
  | 'completed'
  | 'rejected'
  | 'cancelled'
  | 'returned';
```

### 20.3 State contract

Every interactive component supports, where applicable:

- Default
- Hover
- Focus-visible
- Active/pressed
- Disabled
- Loading
- Error
- Success
- Selected
- Read-only

Components document which states do not apply rather than silently omitting them.

---

## 21. Component Specifications

### 21.1 Foundation components

| Component | Anatomy and rules | Variants/states | Responsive/accessibility |
|---|---|---|---|
| **Button** | Label, optional Lucide icon, clear action. Primary uses green; secondary uses white/border; tertiary is text. | Primary, secondary, tertiary, destructive, loading, disabled. | 44px minimum height on mobile; loading preserves width and accessible label. |
| **Link** | Text link with underline or clear color contrast. | Inline, navigation, quiet. | Never communicate a critical action by color alone. |
| **Icon Button** | Icon only for familiar actions; tooltip and accessible name required. | Default, selected, destructive, disabled. | 44×44px touch target; direction-sensitive icons use active direction. |
| **Badge** | Short label for availability, status, category, or count. | Semantic, neutral, outline, pill. | Do not put paragraphs in badges; text must remain visible at zoom. |
| **Avatar** | Customer/admin identity; initials fallback. | Image, initials, placeholder. | Alt text or `aria-hidden` based on use. |
| **Divider** | Separates groups; never used as the sole hierarchy signal. | Horizontal, vertical. | Hide decorative dividers from assistive technology. |
| **Tooltip** | Explains unfamiliar icon/action without holding required information. | Hover/focus. | Keyboard accessible; no tooltip-only critical content. |
| **Surface** | Tokenized canvas/card/panel with optional border. | Flat, card, raised, dark. | Avoid nested surfaces without reason. |

### 21.2 Form components

| Component | Required behavior |
|---|---|
| **Input** | Label, value, optional helper/error, leading/trailing affordance. Supports text, number, email, phone, ISBN, coupon. |
| **Search Input** | Search icon, clear action, submit behavior, query persistence, no-result state. Supports name, author, grade, stage, subject, publisher, ISBN, category. |
| **Select** | Native/select-like accessible control; visible selected value, error, disabled, loading options. |
| **Multi-select** | Selected tokens plus removable actions; mobile uses bottom sheet when the option set is long. |
| **Checkbox** | Independent selections; use for filters and consent only when a real requirement exists. |
| **Radio** | Mutually exclusive choices such as delivery/pickup or payment method. |
| **Switch** | Immediate binary setting in Admin; do not use for a one-time selection. |
| **Textarea** | Service request description, notes, and clarification. Supports character guidance only when a rule exists. |
| **Quantity Selector** | Increment/decrement with manual input where useful; prevents zero/negative quantities. |
| **Date/time control** | Use only where a confirmed workflow requires it. Do not invent delivery or turnaround dates. |
| **File/image upload** | Used for payment proof screenshots only in the current scope. Not available in service request forms. |
| **Form validation** | Inline errors, summary for long forms, server-error recovery, preserved values where safe. |

### 21.3 Commerce components

| Component | Anatomy and rules |
|---|---|
| **Product Card** | Image, title, category/metadata where useful, price, availability, optional variant context, purchase action. Books receive default placement priority. |
| **Product Variant Selector** | Shows only commercially meaningful attributes for the product. Selected variant updates price and availability. Selection is required before add-to-cart when variants exist once the recommendation is approved. |
| **Product Gallery** | 2:3 cover treatment, thumbnails/position, alt text, no reviews or ratings. |
| **Price** | Current price with locale-aware currency formatting. Discount presentation must show original and current amounts clearly. |
| **Discount Price** | Shows discount without implying a business rule about stacking or expiry not yet approved. |
| **Stock Indicator** | In Stock, Out of Stock, Pre-order Eligible. Text and icon accompany color. |
| **Availability Badge** | Compact state chip used consistently across card, detail, cart, and Admin. |
| **Add to Cart** | Disabled/hidden when unavailable; variant selection required when applicable. |
| **Pre-order Action** | Replaces Add to Cart only for out-of-stock items marked pre-order-eligible. Does not promise a date unless Admin provides one. |
| **Cart Item** | Image, name, variant, quantity, unit price, line total, availability warning, remove action. |
| **Cart Summary** | Product total, discounts, shipping estimate where known, and total. No minimum order block. |
| **Coupon Input** | Apply/remove, success/error result, no invented stacking or expiry copy. |
| **Shipping Summary** | Distinguishes delivery estimate from final Admin-adjusted cost; pickup is explicitly free. |
| **Payment Method Selector** | Radio group with approved list from the functional source; keep the OD-20 discrepancy configurable. |
| **Payment Proof** | Instructions, screenshot selection, preview, remove/retry, review status. No transaction ID field. |

### 21.4 Order and payment components

| Component | Anatomy and rules |
|---|---|
| **Order Card** | Reference, date, amount, fulfillment, payment state, current status, next action. |
| **Order Status Badge** | Uses the semantic status map in §27. |
| **Order Timeline** | Chronological state list; current state emphasized; terminal states remain visible. |
| **Order Summary** | Items, quantities, product total, shipping, discount, final total, payment/fulfillment choice. |
| **Payment Proof Review** | Admin-only screenshot review with confirm/reject/request-new-proof actions and audit context. |
| **Payment Status** | Separate from order status; use payment state labels. |
| **Shipping Status** | Provider is selected by Admin; do not let the customer choose a provider. |
| **Pickup Status** | Ready for Pickup, Picked Up, Completed; Pickup is distinct from delivery states. |
| **Return Request** | Starts from completed order; selects eligible item(s), reason, and evidence where appropriate. |
| **Refund Status** | Separate Refund Record from original payment and proof. Shows recorded amount, method, and timestamp when available. |

### 21.5 Service components

| Component | Anatomy and rules |
|---|---|
| **Service Card** | Service name, what it helps with, request-based pricing explanation, CTA. |
| **Service Request** | Service-specific approved fields only; description and WhatsApp/Telegram file-exchange guidance. No in-site file upload. |
| **Quotation** | Request context, final quoted price, validity/policy only when defined, Accept and Reject actions. |
| **Quotation Status** | Submitted, Admin Review, Quotation Sent, Awaiting Payment, Payment Verification, Payment Confirmed, Processing, Completed, or terminal closed state. |
| **Service Timeline** | Same visual language as Order Timeline but with service-specific states. |

### 21.6 Admin components

| Component | Anatomy and rules |
|---|---|
| **Dashboard Card** | One metric or queue signal, period/context, link to the relevant operational module. Do not invent numeric targets. |
| **Data Table** | Column headers, sort/filter only where supported, selection, row actions, empty/loading/error states. |
| **Filters** | Clearly removable active filters; mobile drawer; preserve query context where possible. |
| **Search** | Search scope is visible; do not imply search across private data when it is not supported. |
| **Bulk Actions** | Require selection, summarize impact, confirm destructive actions. |
| **Status Controls** | Show current state, allowed next state, actor permission, and reason where needed. |
| **Admin Form** | Group fields by task; show source/derived fields distinctly; preserve unsaved state warning when relevant. |
| **Activity Timeline** | Audit actor, action, timestamp, and resulting state where required. Do not expose internal audit detail to customers. |
| **Audit Log** | Admin/Owner operational view for payment and order-critical actions. |

### 21.7 Feedback components

| Component | Rules |
|---|---|
| **Toast** | Short confirmation or recoverable notice; never the only place for a critical error or state transition. |
| **Alert** | Persistent contextual message for payment, shipping, availability, policy, or service explanation. |
| **Modal** | Focused decision or confirmation; short title, consequence, primary/secondary actions. |
| **Drawer** | Navigation, filters, contextual details, or mobile form selection. |
| **Confirmation Dialog** | Used before cancel, reject, delete, or irreversible Admin action. |
| **Empty State** | Explain what is absent and provide the next useful route. |
| **Error State** | Say whether data was saved; provide retry or safe navigation. |
| **Loading State** | Skeleton for known structure; spinner for a local action. |
| **Success State** | Confirm the record/reference and next step; do not imply fulfillment is complete when it is only submitted. |

---

## 22. Form System

### 22.1 Field anatomy

```text
Label *
[ input / select / textarea                 ]
Helper text or constraint
Error message, if present
```

Use a **minimum 44px control height** on customer-facing mobile forms and 40px in dense Admin forms, with 16px internal inline padding. Arabic text needs sufficient vertical room.

### 22.2 Validation timing

- Validate format on blur or submit, not aggressively on every keystroke.
- Validate required fields on submit and preserve the user’s input.
- Server-side failures appear near the affected field or at the form summary.
- Payment proof errors identify the missing/rejected screenshot and the next action.
- When availability or price changes at checkout, show a blocking summary before payment rather than silently changing totals.

### 22.3 Checkout fields

Customer information and address fields follow the PRD: recipient name, phone, governorate, city, area, street, building number, floor, apartment, landmark, and notes as applicable. Do not add a map pin. Delivery and pickup are explicit choices.

### 22.4 Service-request fields

The exact required information per service type is an **open decision**. Build the component to accept a service-specific field configuration. Do not invent file limits, document requirements, turnaround times, or pricing fields. The UI must explain that files are exchanged through WhatsApp or Telegram.

### 22.5 Payment proof upload

- Accept one or more screenshots as defined by the PRD.
- Show selected file previews and remove controls.
- Announce upload success and errors.
- Do not request a transaction ID.
- After Admin rejection/request for new proof, show the reason where captured and preserve the path to re-upload.
- Keep proof media restricted to authorized Admin/Owner views.

---

## 23. E-commerce UI Patterns

### 23.1 Home

The home page answers what the library is, what customers can buy, and where to start:

1. Header and persistent WhatsApp access.
2. Hero with books/catalog CTA; no unverified superlative.
3. Books-first discovery.
4. Stable category access: Books, School/Study Products, Other Products.
5. Temporary seasonal merchandising.
6. Services preview with request/quotation explanation.
7. Trust and practical information: clear availability, price, pickup, cash/support options where confirmed.
8. Footer using confirmed contact/location data only.

### 23.2 Catalog and search

Search supports product name, author, grade, stage, subject, publisher, ISBN, and category. Filters support education type, stage, grade, subject, publisher, price range, and availability. A missing field must not make a product undiscoverable through populated fields.

Do not invent sort ranking logic. If sorting is enabled, the available sort options must come from an approved business rule.

### 23.3 Product detail

The first viewport should expose:

- Product identity and category context.
- Image/gallery.
- Price.
- Availability.
- Relevant variants.
- Primary action.
- Support action.

Do not add reviews, ratings, or a “trust score” placeholder.

### 23.4 Cart

Cart supports multiple products/variants and has no minimum order value. Show quantity, line price, availability, discount result, and totals. Cart re-validation at checkout is a product recommendation in the PRD; if implemented, changes must be surfaced before payment.

### 23.5 Checkout

Sequence:

1. Customer information.
2. Address and fulfillment.
3. Payment method.
4. Payment proof when applicable.
5. Order review.
6. Submit to Pending Review.

The order review must show items, quantities, product total, shipping cost/estimate, discounts, and final total. Pickup displays free. Delivery does not display invented delivery-time promises.

### 23.6 Services boundary

Services never appear as ordinary product cards with a fixed price in the main product purchase flow. Service pages use:

```text
Request → Admin Review → Quotation → Accept/Reject → Payment → Fulfillment
```

The customer must be able to reach a person, but the service request record remains authoritative.

---

## 24. Order & Payment UI Patterns

### 24.1 Order submission

After submit, show:

- A human-referenceable order identifier when available.
- “Pending Review” as the initial state.
- Submitted items and costs.
- What happens next.
- A path to order tracking.
- Contextual WhatsApp support.

Do not say “your order is confirmed” when it is only awaiting Admin review.

### 24.2 Payment methods

The PRD functional list includes InstaPay, Vodafone Cash, Orange Cash, Etisalat Cash, WE Pay, and Cash on Delivery. The Master Product Brief confirms COD, cash at library, InstaPay, and Vodafone Cash. Until OD-20 is resolved:

- Keep the payment-method list data-driven.
- Do not design copy that claims the final list is settled.
- Keep cash at the library available as a potential option without treating it as final if the product authority has not approved it.
- Do not add automated gateway UI.

### 24.3 Manual proof review

The customer transfers outside the platform, uploads screenshot proof, and waits for Admin review. The interface must distinguish:

- Proof not submitted.
- Proof uploaded.
- Under review.
- Payment confirmed.
- Proof rejected.
- New proof requested.

### 24.4 Shipping and pickup

The customer chooses Delivery or Pickup. The library chooses the delivery provider. The UI shows:

- Delivery estimate based on governorate/location.
- Pickup as free.
- Final Admin-adjusted shipping cost only when the operational state provides it.
- No hard-coded invented governorate pricing, excluded-area promises, or delivery SLA.

### 24.5 Order editing/cancellation

Customer editing and cancellation are available only while the order is Pending Review, subject to the source behavior. After acceptance/payment, the UI must not expose controls that change the financial total.

---

## 25. Service UI Patterns

### 25.1 Service discovery

Services have their own entry point and explain why they differ from product shopping. Confirmed categories include printing, photocopying, binding, applications, transfers, and research/formatting help.

### 25.2 Request page

The request page should:

- Name the service.
- Explain that final pricing follows Admin review.
- Collect only approved fields for that service.
- Provide a description area where applicable.
- Explain how to exchange files through WhatsApp or Telegram.
- Show support access.

It must not contain an in-site file-upload control.

### 25.3 Quotation

Quotation review is a decision page, not a product checkout shortcut. It shows the final quoted price, request context, and Accept/Reject actions. Payment is unavailable until the quotation is accepted.

### 25.4 Service states

Use the same state hierarchy and semantic treatment as orders, but do not reuse order-specific wording:

- Submitted
- Admin Review
- Quotation Sent
- Awaiting Payment
- Payment Verification
- Payment Confirmed
- Processing
- Completed
- Closed — Not Proceeding
- Closed — Declined

---

## 26. Admin UI Patterns

### 26.1 Admin shell

Admin is a separate authenticated shell, not a public navigation branch. Desktop sidebar groups:

1. Operations: Dashboard, Orders, Payments.
2. Catalog: Products, Categories, Inventory.
3. Services.
4. Pre-orders.
5. Shipping.
6. Returns and Refunds.
7. Customers.
8. Content.
9. Coupons.
10. Reports.
11. Settings/RBAC.

Mobile uses a drawer and a compact top bar with current role, notifications, and relevant WhatsApp actions.

### 26.2 Queue design

Each queue provides:

- Clear scope and current count where available.
- Search/filter controls.
- Primary status and next action.
- Timestamp and responsible context.
- Empty, loading, error, and permission states.

Do not show a number as a target if it is only a current count. Do not invent KPI thresholds.

### 26.3 Tables

- Keep identifiers, status, customer/product, amount, and next action visible.
- Use horizontal scroll or priority-card transformation on mobile; do not hide the only action in a hover state.
- Use tabular numerals for money and counts.
- Selection checkboxes require a clear bulk-action scope.
- Destructive bulk actions require confirmation and a summary.

### 26.4 Auditability

Payment and order-critical actions show actor, action, timestamp, and resulting state to authorized Admin/Owner users. Customers see only the transparency necessary for their own record.

### 26.5 RBAC

At minimum, support Owner and Admin. Keep action visibility and disabled/forbidden states distinct:

- Hidden: user should not know the capability exists in that context.
- Disabled with explanation: capability exists but current record/state blocks it.
- Forbidden: role lacks permission; provide safe navigation.

Future specialized roles should fit the same permission model without redesigning the shell.

---

## 27. Status & Semantic Color System

Color is paired with label and icon. Status labels are customer-readable; internal state names may appear only in Admin contexts when useful.

### 27.1 Order statuses

| Status | Meaning | Color | Icon |
|---|---|---|---|
| Pending Review | Submitted and awaiting Admin decision. | Warning | `Clock3` |
| Accepted | Admin approved; next payment/COD action. | Info | `ClipboardCheck` |
| Awaiting Payment | Accepted non-COD order awaiting transfer/proof. | Warning | `WalletCards` |
| Payment Verification | Proof submitted and under review. | Info | `SearchCheck` |
| Awaiting New Proof | Previous proof rejected/requested again. | Error/warning | `Upload` |
| Payment Confirmed | Payment verified. | Success | `BadgeCheck` |
| Customer Confirmation Required | COD accepted, waiting for customer. | Warning | `CircleAlert` |
| Confirmed | COD customer confirmed or equivalent order gate passed. | Success | `CheckCircle2` |
| Preparing | Library is preparing the order. | Info | `PackageOpen` |
| Ready for Pickup | Order ready at the library. | Success | `Store` |
| Picked Up | Customer collected the order. | Success | `HandCoins` |
| Shipped | Handed to selected provider. | Info | `Truck` |
| Out for Delivery | Delivery in progress. | Info | `Route` |
| Delivered | Delivery completed; order can close. | Success | `PackageCheck` |
| Completed | Fulfillment closed. | Success | `CheckCircle2` |
| Rejected | Admin declined; terminal. | Error | `XCircle` |
| Cancelled | Customer cancellation from allowed state; terminal. | Neutral/error | `Ban` |
| Returned | Return approved after completion; linked refund flow. | Warning | `Undo2` |

### 27.2 Payment statuses

| Status | Color | Icon |
|---|---|---|
| Not Submitted | Neutral | `Circle` |
| Proof Uploaded | Info | `Upload` |
| Under Review | Warning | `Clock3` |
| Confirmed | Success | `BadgeCheck` |
| Rejected | Error | `XCircle` |
| New Proof Requested | Warning/error | `RefreshCw` |
| Refund Initiated | Warning | `ArrowDownToLine` |
| Refund Completed | Success | `CircleCheck` |

### 27.3 Service statuses

Use `Info` for Submitted/Admin Review, `Warning` for Quotation Sent/Awaiting Payment, `Success` for Payment Confirmed/Completed, and `Error` or neutral terminal treatment for Closed — Not Proceeding/Closed — Declined.

### 27.4 Inventory and pre-order statuses

- In Stock: success.
- Out of Stock: error/neutral; no purchase action.
- Pre-order Eligible: warning; Pre-order action replaces Add to Cart.
- Reserved: info; visible in Admin inventory, not as a customer purchase promise.

### 27.5 Accessibility

Every status includes:

1. Text label.
2. Semantic color.
3. Icon where it adds meaning.
4. Tooltip or expanded explanation only when the label is not sufficient.

---

## 28. Loading / Empty / Error / Success States

### 28.1 Loading

- Use skeletons matching the final structure for catalog, product detail, order detail, and Admin tables.
- Preserve layout dimensions to prevent unexpected movement.
- Use a local spinner for button actions.
- Never show a successful-looking empty state while data is still loading.

### 28.2 Empty

| Context | Message direction | Primary action |
|---|---|---|
| Empty cart | Explain that no products are selected. | Shop/Categories. |
| No search results | Show query and active filters; suggest clearing/refining. | Clear filters or return to catalog. |
| No orders | Explain that orders will appear here. | Shop. |
| No service requests | Explain the request-based service area. | Service Catalog. |
| No notifications | Confirm there are no current lifecycle notifications. | Account overview. |
| No payment history | Explain that payment records appear after orders. | Orders. |
| Admin queue empty | Say the queue is clear without implying business success beyond the queue. | Related module or dashboard. |

### 28.3 Error

Errors identify:

- What failed.
- Whether the previous action was saved.
- How to retry or safely continue.
- WhatsApp support when human clarification is appropriate.

Do not claim an order was not created solely because real-time delivery failed; reload the authoritative record.

### 28.4 Success

Success is precise:

- Order submitted → “Pending Review,” not “Completed.”
- Payment proof uploaded → “Awaiting payment verification,” not “Paid.”
- Service request submitted → “Admin Review,” not “Accepted.”
- Return submitted → “Return Requested,” not “Refunded.”

---

## 29. Notifications & Feedback

### 29.1 Channels

- In-app: order, payment, service, pre-order, return/refund lifecycle.
- Email: account verification, password reset, and relevant transactional messages.
- WhatsApp: manually initiated support and clarification, not an automated notification bus.
- Real-time events: convenience delivery through Socket.IO; database remains the source of truth.

### 29.2 Notification anatomy

Each notification includes:

- Short localized title.
- Current event/status.
- Context reference.
- Direct action when one exists.
- Timestamp.

### 29.3 Toast usage

Use toast for:

- Cart item added.
- Copy/reference action succeeded.
- Saved profile/address.
- Noncritical preference or filter feedback.

Use an alert, page state, or notification for:

- Payment proof rejected.
- Order rejected.
- Shipping cost changed.
- Service quotation sent.
- Network failure during submit.

---

## 30. Design Tokens

### 30.1 CSS variable example

```css
:root {
  --color-primary: #0f4c3a;
  --color-primary-hover: #0b3f31;
  --color-primary-pressed: #083328;
  --color-secondary: #a47925;
  --color-accent: #b58b3a;
  --color-background: #fcfbf8;
  --color-surface: #ffffff;
  --color-surface-subtle: #f6f4ee;
  --color-text-primary: #1f2a26;
  --color-text-secondary: #53615b;
  --color-text-muted: #718078;
  --color-border: #d7ded9;
  --color-border-strong: #aebbb4;
  --color-success: #176b4d;
  --color-warning: #8a5a00;
  --color-error: #b42318;
  --color-info: #155e75;
  --color-focus-ring: #17624c;

  --font-arabic: "IBM Plex Sans Arabic", system-ui, sans-serif;
  --font-latin: "Inter", system-ui, sans-serif;

  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;
  --space-20: 80px;
  --space-24: 96px;
  --space-32: 128px;

  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 16px;
  --radius-xl: 24px;
  --radius-pill: 999px;

  --shadow-sm: 0 1px 2px rgb(24 42 34 / 6%);
  --shadow-md: 0 6px 18px rgb(24 42 34 / 10%);
  --shadow-lg: 0 14px 32px rgb(24 42 34 / 14%);
  --shadow-modal: 0 20px 60px rgb(24 42 34 / 20%);

  --motion-fast: 120ms;
  --motion-normal: 200ms;
  --motion-slow: 320ms;
  --ease-standard: cubic-bezier(.2, .8, .2, 1);

  --z-base: 0;
  --z-sticky: 20;
  --z-dropdown: 40;
  --z-drawer: 60;
  --z-modal: 80;
  --z-toast: 100;
}
```

### 30.2 Token categories

The implementation must keep these categories separate:

- Color
- Typography
- Spacing
- Radius
- Shadow
- Motion
- Z-index
- Breakpoint
- Container
- Component

Component tokens may refer to foundation tokens but should not invent raw values inside feature styles.

### 30.3 Component token examples

```css
:root {
  --button-height-md: 44px;
  --button-padding-inline: 16px;
  --input-height-md: 44px;
  --input-border-width: 1px;
  --focus-ring-width: 2px;
  --card-padding-mobile: 16px;
  --card-padding-desktop: 20px;
  --product-image-ratio: 2 / 3;
  --page-gutter-mobile: 16px;
  --page-gutter-desktop: 32px;
}
```

---

## 31. Angular + Tailwind Implementation Guidance

### 31.1 Angular

- Keep shared visual components in the design-system library, not duplicated inside features.
- Use typed inputs for semantic states and discriminated unions for status.
- Prefer content projection or templates for domain-specific content while keeping structure accessible.
- Use Angular CDK primitives for overlay, focus management, dialog, and keyboard behavior where appropriate.
- Keep direction and locale at the application shell; allow controlled LTR islands for references and technical values.
- Keep server state and display state separate. A loading animation must not become the source of truth.

### 31.2 Tailwind

Map Tailwind utilities to CSS variables rather than repeating hex values:

```ts
theme: {
  extend: {
    colors: {
      primary: 'rgb(var(--tw-color-primary) / <alpha-value>)',
      surface: 'var(--color-surface)',
      background: 'var(--color-background)',
      text: {
        primary: 'var(--color-text-primary)',
        secondary: 'var(--color-text-secondary)',
      },
    },
    borderRadius: {
      sm: 'var(--radius-sm)',
      md: 'var(--radius-md)',
      lg: 'var(--radius-lg)',
      xl: 'var(--radius-xl)',
    },
    screens: {
      sm: '480px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1440px',
      '3xl': '1920px',
    },
  },
}
```

The exact Tailwind configuration may vary, but the semantic token names must remain stable.

### 31.3 Data and status rendering

Status-to-style mapping belongs in one typed utility, not scattered conditionals:

```ts
const orderStatusPresentation: Record<OrderStatus, {
  labelKey: string;
  tone: 'neutral' | 'info' | 'success' | 'warning' | 'error';
  icon: string;
}> = { /* one entry per documented status */ };
```

The mapping must be shared by customer and Admin surfaces, with different detail levels where appropriate.

### 31.4 Content and localization

- Use translation keys, not literal UI copy inside components.
- Preserve Arabic copy as the primary review language.
- Keep business-policy copy configurable for open decisions.
- Format currency, dates, phone numbers, and numerals through locale-aware services.
- Never concatenate Arabic and Latin strings without testing directionality.

### 31.5 Testing expectations

Component tests must cover:

- All documented interactive states.
- Arabic RTL and English LTR.
- Keyboard navigation and focus restoration.
- 375px, 768px, and 1280px representative layouts at minimum.
- Loading, empty, error, and success paths.
- Status label/icon/color mapping.
- No file-upload control in service requests.
- Payment proof requirement for non-COD methods and absence for COD.

---

## 32. Design QA Checklist

### RTL and localization

- [ ] Default document direction is RTL with Arabic locale.
- [ ] English LTR is supported without broken spacing or icon direction.
- [ ] Directional icons communicate actual movement.
- [ ] Phone, email, ISBN, order references, and URLs remain readable.
- [ ] Arabic headings, labels, tables, and timelines do not clip.

### Typography

- [ ] IBM Plex Sans Arabic and Inter load with safe fallbacks.
- [ ] Body Arabic line-height is readable.
- [ ] Product titles wrap without hiding identity.
- [ ] Prices and references use consistent numerals.
- [ ] No all-caps Arabic or justified Arabic copy.

### Color and visual language

- [ ] Green anchors primary actions and brand presence.
- [ ] Gold is an accent, not a dominant UI fill.
- [ ] Text and controls meet the chosen contrast target.
- [ ] Status does not rely on color alone.
- [ ] Motifs are subtle and never reduce readability.
- [ ] The logo uses only approved assets.

### Accessibility

- [ ] All actions are keyboard accessible.
- [ ] Focus rings are visible in RTL and LTR.
- [ ] Touch targets meet 44px customer-facing minimum.
- [ ] Inputs have labels and connected errors/helper text.
- [ ] Dialogs trap and restore focus.
- [ ] Screen-reader labels exist for icon-only controls.
- [ ] Reduced-motion behavior is implemented.
- [ ] Tables remain understandable on small screens.

### Responsive behavior

- [ ] Tested at 375px, 480px, 768px, 1024px, 1280px, 1440px, and 1920px.
- [ ] Product grids preserve readable card width.
- [ ] Filters become an accessible drawer/bottom sheet.
- [ ] Checkout retains visible total and next step.
- [ ] Admin tables transform or scroll without losing actions.
- [ ] Modals and drawers fit viewport height and support keyboard escape.

### Component consistency

- [ ] Components use design tokens rather than raw one-off values.
- [ ] Interactive states are documented and implemented.
- [ ] Shared status presentation is used across customer and Admin views.
- [ ] No mixed icon systems appear in one surface.
- [ ] Buttons use consistent hierarchy and action language.

### Catalog and product

- [ ] Books lead default merchandising.
- [ ] Stable categories remain visible even during seasonal campaigns.
- [ ] Product images preserve the full book cover.
- [ ] Variant selection updates price and availability.
- [ ] In Stock, Out of Stock, and Pre-order Eligible are unambiguous.
- [ ] Reviews and ratings do not appear.

### Checkout and payment

- [ ] Guest checkout remains available.
- [ ] No map pin or phone OTP is present.
- [ ] Pickup is clearly free.
- [ ] Delivery estimate is visible before submission.
- [ ] Payment proof is required for configured non-COD methods.
- [ ] COD does not require proof.
- [ ] No transaction ID field is requested.
- [ ] Order submits to Pending Review, not Completed.
- [ ] Payment-method discrepancy remains configurable pending OD-20.

### Services

- [ ] Services are separate from product cart/checkout.
- [ ] No final fixed price appears before quotation.
- [ ] Service request forms do not contain file upload.
- [ ] WhatsApp/Telegram file exchange is explained.
- [ ] Payment is unavailable before quotation acceptance.
- [ ] Service states are distinct from order states where wording differs.

### Orders, returns, and fulfillment

- [ ] Cancellation is available only in the permitted state.
- [ ] Ready for Pickup is distinct from shipping states.
- [ ] Shipping provider is not customer-selected.
- [ ] Return access begins from completed orders where eligible.
- [ ] Refund Record is distinct from original payment and proof.
- [ ] Open return periods and SLAs are not invented.

### Admin

- [ ] Admin shell is separate and RBAC-gated.
- [ ] Payment-proof media is restricted to authorized roles.
- [ ] Critical actions show actor, action, timestamp, and resulting state where required.
- [ ] Empty queues and forbidden states are designed.
- [ ] No invented KPI targets appear.
- [ ] Future specialized roles can fit the permission model.

### Motion and resilience

- [ ] Motion is purposeful and restrained.
- [ ] Reduced-motion preference is respected.
- [ ] Real-time failure does not imply data loss.
- [ ] Network errors explain whether the action was saved.
- [ ] Refresh/reload exposes the persisted database state.

---

## 33. Do / Don’t

| Do | Don’t |
|---|---|
| Lead with books and product clarity. | Let gifts, games, or seasonal banners dominate the home page. |
| Use green for primary actions. | Make the interface or every badge gold. |
| Use low-contrast geometric accents. | Fill the UI with mosque imagery, calligraphy, or heavy borders. |
| Show “Pending Review” after order submission. | Tell the customer the order is confirmed before the workflow confirms it. |
| Explain service quotation flow. | Show a made-up fixed service price. |
| Keep WhatsApp one tap away. | Treat chat as the authoritative order record. |
| Show Pickup as free. | Hide pickup as a legacy fallback. |
| Preserve full product images. | Crop away book titles or use decorative filters. |
| Design every state. | Design only the happy-path screenshot. |
| Mark open decisions in configuration and copy. | Turn unresolved delivery, return, coupon, or payment rules into promises. |
| Use logical CSS properties. | Hard-code left/right values and mirror blindly. |
| Use one icon language. | Mix Lucide, Material, and arbitrary icon sets. |

---

## 34. Future Extensibility

### 34.1 Safe extension points

The system is prepared for:

- Future catalog categories such as Tajweed, Qira'at, Quran memorization curricula, nursery curricula, and Qurans.
- Educational/editorial content when a content owner exists.
- Paid social acquisition and better attribution.
- Deeper personalization after real usage data.
- Specialized Admin roles.
- A future dark theme if brand and accessibility evidence supports it.

### 34.2 Extension rules

New features must:

1. Identify the product job they serve.
2. Preserve books-first hierarchy unless the business authority changes it.
3. Reuse semantic tokens and component states.
4. Preserve the product/service domain boundary.
5. Define mobile, RTL, empty, error, loading, and accessibility behavior.
6. Separate confirmed behavior, recommendation, and open decision.
7. Avoid introducing a route or workflow that the IA does not authorize.

### 34.3 Future content

Editorial content may support SEO and discovery, but it must not turn the store into an LMS or a separate media product without an explicit scope decision.

---

## 35. Open Design Decisions

These are not silently resolved by this design system.

| ID | Decision | Design impact |
|---|---|---|
| OD-01 | Final phone numbers and WhatsApp destination. | Contact labels, links, and footer remain configurable. |
| OD-02 | Email-verification gating scope. | Registration success and account-action access remain configurable. |
| OD-03–06 | Shipping-rate source, final-cost binding, delivery ranges, excluded areas. | Show estimate vs final; do not promise a time or hard-code a rate table. |
| OD-07 | COD non-confirmation timeout. | Keep the state indefinite unless policy is approved; do not show an invented expiry. |
| OD-08–09 | Concurrent stock contention and low-stock thresholds. | Do not show fairness or replenishment promises not defined by policy. |
| OD-10–11 | Pre-order price honoring and allocation order. | Capture price-at-request in the record; do not promise which price or allocation rule applies. |
| OD-12–14 | Service fields, documents, turnaround, COD applicability. | Use configurable service forms; no file upload; no invented service SLA. |
| OD-15–16 | Return policies, periods, non-returnables, refund SLA. | Use Admin-configured eligibility and neutral policy copy. |
| OD-17 | Coupon stacking, limits, expiry, minimums, restrictions. | Do not describe unsupported coupon behavior. |
| OD-18 | Numeric KPI targets. | Reports display actual data, not target gauges. |
| OD-19 | Accessibility conformance, performance, availability SLAs. | This document recommends WCAG 2.2 AA; formal target remains to be confirmed. |
| **OD-20** | Final payment list: PRD list vs Master Brief list including cash at library. | Keep methods data-driven and avoid presenting the list as finally settled. |
| OD-21 | Partial acceptance for multi-item orders with insufficient stock. | Do not invent split-order or partial-acceptance UI. |

### 35.1 Low-risk design recommendations awaiting approval

The PRD explicitly labels these as recommendations rather than settled requirements:

- Re-validate price and availability at checkout.
- Require variant selection before Add to Cart.
- Show full order-cost breakdown before submit.
- Close rejected service quotations without payment.
- Reuse the payment/proof model for accepted service quotations, subject to COD applicability.
- Prevent Admin acceptance when reservation would create negative available stock, except for eligible pre-orders.

The visual system supports these recommendations without turning them into hidden business rules.

---

## 36. Final Design-System Summary

AL-AZHARI LIBRARY is represented as a modern, calm, Arabic-first bookstore and service experience with restrained Islamic character. The system is anchored by deep green, uses gold as an accent, gives books the strongest visual and structural priority, and keeps product commerce distinct from variable-price student services.

The implementation baseline is:

- Arabic-first and RTL-first.
- Mobile-first across storefront, checkout, account, services, and Admin.
- Green-led, ivory-backed, editorial, and product-readable.
- Tokenized for Angular and Tailwind.
- Accessible by default with WCAG 2.2 AA as the design recommendation.
- Explicit about loading, empty, error, success, payment, order, service, inventory, and return states.
- Conservative about unresolved business decisions.
- Human-supportive without making WhatsApp the system of record.

The quality bar is not decorative polish alone. A successful implementation lets a customer find the right book, understand its availability and price, order with confidence, request a service without being misled about pricing, and know when the library—not an opaque interface—needs to take the next step.
