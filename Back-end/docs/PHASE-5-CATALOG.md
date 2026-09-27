# AL-AZHARI LIBRARY — Phase 5: Catalog, Categories, Variants & Content

## 1. Executive Summary

Phase 5 delivers the **Catalog, Categories, Variants, Public Search, and Homepage Content Modules** for the AL-AZHARI LIBRARY backend. It implements high-performance public browsing, strict schema integrity, robust admin catalog operations, resilient search normalization (covering Arabic diacritics and Latin terms), non-destructive category deactivation with historical dependency protection, and deterministic homepage content presentation.

All implementations strictly adhere to the authoritative **AL-AZHARI-LIBRARY-BACKEND-IMPLEMENTATION-PLAN**, **AL-AZHARI-LIBRARY-MongoDB-Implementation-Plan**, and **AL-AZHARI-LIBRARY-MASTER-PRODUCT-BRIEF**:
* Public catalog reads are strictly separated from Admin management APIs.
* Internal operational counters (`stockTotal`, `stockReserved`), audit logs, and internal fields are never exposed through public catalog endpoints.
* Money is represented strictly in `priceMinor` (integer Egyptian piastres; `100 EGP = 10000 piastres`). Floating-point currency representations are strictly prohibited.
* Descriptions are nullable (`description === null` is valid and does NOT block publication per PRD CAT-003).
* Category browsing prioritizes Islamic books core categories using deterministic books-first ordering (`isBooksCore: -1, displayOrder: 1, createdAt: 1`).
* Category deletion is non-destructive (deactivation to `isActive: false`), and is prevented with `409 Conflict` if existing products reference the category.
* Public homepage content modules respect active date windows (`startsAt`, `endsAt`, `active`) and automatically filter out any unpublished products or inactive/MVP-disabled categories.
* Minimal audit boundary records critical mutations (price, availability, publication).
* Zero destructive database commands executed against production data.

---

## 2. Architecture Overview

```text
                               PUBLIC CLIENTS
                                     │
      ┌──────────────────┬───────────┴───────────┬──────────────────┐
      │                  │                       │                  │
CATEGORIES           PRODUCTS                 SEARCH             CONTENT
(/categories)       (/products)             (/search)         (/content/home)
      │                  │                       │                  │
  Books-First     Published Only           Normalized Search    Active Window
  MVP-Enabled     Safe Projections         Arabic & Latin       Safe Entities
  Deterministic   Hidden Stock Counters    Bounded Limits       Display Order
                         │
                         │
              ADMIN MUTATIONS (RBAC)
          (requireAuthentication + RBAC)
                         │
     ┌───────────────────┼───────────────────┐
     │                   │                   │
 CATEGORIES ADMIN    PRODUCTS ADMIN     CONTENT ADMIN
 (categories.write)  (products.write)   (content.write)
     │                   │                   │
Non-Destructive     Price/Variant Rules Date Windows
Dependency Protect  Critical Auditing   Ref Validation
```

---

## 3. Categories Module

The `categories` module manages catalog taxomony with support for books-core prioritization, multi-tier nesting, and MVP release filtering.

### 3.1 Data Model (`CategoryModel`)
* **Collection**: `categories`
* **Schema Fields**:
  - `slug`: Stable unique lowercase slug.
  - `name`: Localized text (`{ ar: string, en?: string }`). Arabic is mandatory.
  - `parentId`: Optional reference to parent `Category` (nullable).
  - `kind`: Fixed to `'product'`.
  - `displayOrder`: Non-negative integer for custom sorting.
  - `isActive`: Boolean flag for activation state.
  - `isMvpEnabled`: Boolean flag controlling MVP release visibility.
  - `isBooksCore`: Boolean flag indicating primary books classification.
  - `createdAt` / `updatedAt`: Automatic ISO timestamps.
* **Indexes**:
  - `{ slug: 1 }` (unique)
  - `{ isActive: 1, isMvpEnabled: 1, isBooksCore: -1, displayOrder: 1 }` (compound books-first browsing index)

### 3.2 Category Deletion & Dependency Protection
* Category deletion is non-destructive; it sets `isActive: false`.
* **Historical Dependency Protection**: If any products reference the category (`countProducts > 0`), deletion is rejected with `409 Conflict`.
* **Hierarchy Protection**: If any subcategories reference the category (`countChildren > 0`), deletion is rejected with `409 Conflict`.

### 3.3 Endpoints
* `GET /api/v1/categories`: Public list of active + MVP-enabled categories in books-first order.
* `GET /api/v1/admin/categories`: Admin list of all categories including inactive ones.
* `POST /api/v1/admin/categories`: Create category (`categories.write`).
* `PATCH /api/v1/admin/categories/:id`: Update category (`categories.write`).
* `DELETE /api/v1/admin/categories/:id`: Deactivate category (`categories.write`).

---

## 4. Products Module

The `products` module manages the store's physical book catalog, variant structures, media metadata, publication lifecycle, and normalized search representations.

### 4.1 Data Model (`ProductModel`)
* **Collection**: `products`
* **Schema Fields**:
  - `slug`: Stable unique lowercase string.
  - `name`: Localized text (`{ ar: string, en?: string }`).
  - `description`: Nullable localized text (`{ ar?: string, en?: string } | null`).
  - `categoryId`: ObjectId reference to `categories`.
  - `images`: Array of image metadata objects (`publicId`, `resourceType`, `format`, `bytes`, `width`, `height`, `hash`).
  - `metadata`: Searchable domain attributes (`author`, `grade`, `stage`, `subject`, `publisher`, `isbn`, `educationType`).
  - `hasVariants`: Boolean indicating if product uses embedded variants.
  - `variants`: Array of embedded `IVariant` subdocuments (`_id: false`).
  - `availability`: Enum (`'in_stock' | 'out_of_stock' | 'pre_order_eligible'`).
  - `priceMinor`: Integer price in Egyptian piastres (e.g. 25000 = 250.00 EGP).
  - `currency`: Fixed to `'EGP'`.
  - `preOrderEligible`: Boolean flag.
  - `isPublished`: Boolean publication status.
  - `returnPolicyFlags`: `{ eligibleForReturn: boolean, windowDays: number }`.
  - `displayOrder`: Integer order value.
  - `stockTotal`: Internal total physical inventory counter.
  - `stockReserved`: Internal reserved inventory counter.
  - `searchText`: Precomputed normalized string for resilient text matching.
* **Indexes**:
  - `{ slug: 1 }` (unique)
  - `{ categoryId: 1, isPublished: 1, displayOrder: 1 }`
  - `{ availability: 1, isPublished: 1 }`
  - `{ isPublished: 1, searchText: 1 }`
  - `{ 'metadata.isbn': 1 }` (unique, sparse)

### 4.2 Product Variants
* Embedded directly inside the product document with `_id: false`.
* Requires unique `variantId` within the product.
* Each variant specifies:
  - `variantId`: Stable identifier string.
  - `attributes`: Product-specific key-value pairs (e.g. `{ volume: '1', binding: 'hardcover' }`).
  - `label`: Localized label (`{ ar: string, en?: string }`).
  - `priceMinor`: Non-negative integer in piastres.
  - `currency`: `'EGP'`.
  - `availability`: `'in_stock' | 'out_of_stock' | 'pre_order_eligible'`.
  - `stockTotal` & `stockReserved`: Internal inventory counters (hidden from public API).
  - `sku`: Optional SKU string.
  - `images`: Optional variant image metadata.

### 4.3 Publication & Pricing Rules
* If `hasVariants === false`: Top-level `priceMinor` must be a valid non-negative integer.
* If `hasVariants === true`: Product must contain at least one variant with a valid `priceMinor >= 0`.
* A product cannot be published under an inactive or MVP-disabled category.
* `description === null` is valid and does not prevent publication.

---

## 5. Search Foundation

Implements resilient text search without external dependencies (Atlas Search is deferred per plan):
* **Arabic Normalization**:
  - Strips Arabic tashkeel (diacritics: fatha, damma, kasra, shadda, sukun, tanween).
  - Normalizes Alef variants (`أ`, `إ`, `آ` -> `ا`).
  - Normalizes Teh marbuta (`ة` -> `ه`).
  - Normalizes Alef maksura (`ى` -> `ي`).
  - Removes tatweel/kashida (`ـ`).
* **Latin Normalization**:
  - Lowercasing, trimming, and whitespace collapsing.
* **Security & Injection Defense**:
  - User query input is safely escaped (`escapeRegex`) before executing queries to prevent ReDoS and regex operator injection.
  - Raw MongoDB query operators (`$where`, `$regex`, `$ne`) are strictly forbidden and rejected.
* **Endpoints**:
  - `GET /api/v1/search?q=...`: Bounded search with pagination and category/availability filters.

---

## 6. Content Module (Homepage Merchandising)

The `content` module powers dynamic merchandising for the store's landing page:
* **Collection**: `contentModules`
* **Module Types**: `'hero_banner' | 'featured_products' | 'category_grid' | 'announcement' | 'promo_banner' | 'text_block'`.
* **Date Window Filtering**:
  - Modules are only active if `active: true` and current time falls within `[startsAt, endsAt]`.
* **Public Reference Safety**:
  - If a content module references product IDs, unpublished products or products in inactive categories are automatically filtered out.
  - If a content module references category IDs, inactive or MVP-disabled categories are automatically filtered out.
* **Endpoints**:
  - `GET /api/v1/content/home`: Public endpoint returning active modules in ascending `displayOrder`.
  - `GET /api/v1/admin/content`: Admin listing.
  - `POST /api/v1/admin/content`: Create module (`content.write`).
  - `PATCH /api/v1/admin/content/:id`: Update module (`content.write`).
  - `DELETE /api/v1/admin/content/:id`: Delete module (`content.write`).

---

## 7. Security, Projections & Auditing

* **RBAC Enforcement**:
  - `products.write`: Required for creating/updating products.
  - `categories.write`: Required for creating/updating/deactivating categories.
  - `content.write`: Required for managing content modules.
  - Store `owner` role retains universal access.
* **Safe Public Projections**:
  - Public endpoints (`/products`, `/products/:slug`, `/search`, `/categories`, `/content/home`) NEVER leak `stockTotal`, `stockReserved`, `isPublished`, `searchText`, or audit actor references.
* **Audit Boundary**:
  - Mutations to product prices, availability, or publication status automatically record an audit log in the `auditLogs` collection with old/new states and request IDs.

---

## 8. Database Migrations

* **Migration Script**: `src/database/migrations/scripts/20260927_003_catalog.migration.ts`
* Idempotent, non-destructive creation of indexes on:
  - `categories` (`idx_categories_slug_unique`, `idx_categories_public_browse`)
  - `products` (`idx_products_slug_unique`, `idx_products_category_published_display`, `idx_products_availability_published`, `idx_products_published_search`, `idx_products_isbn_sparse_unique`)
  - `contentModules` (`idx_content_modules_key_unique`, `idx_content_modules_active_display`)
  - `auditLogs` (`idx_audit_logs_entity`, `idx_audit_logs_actor`)

---

## 9. Explicitly Deferred Features

In strict accordance with project boundaries, the following features are NOT implemented in Phase 5:
* **Cart**: Phase 6
* **Inventory Reservations & Deduction Ledger**: Phase 7
* **Checkout**: Phase 8
* **Payments & Payment Proofs**: Phase 9
* **Shipping & Coupons**: Phase 10
* **Pre-orders Workflow**: Later phase
* **Customer Reviews & Ratings**: Later phase
* **Full Reports & Business Intelligence**: Phase 15
