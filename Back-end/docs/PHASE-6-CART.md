# AL-AZHARI LIBRARY — Phase 6: Cart (Guest & User Persistence, Optimistic Versioning & Merge)

## 1. Executive Summary

Phase 6 implements the **Cart Domain** for the AL-AZHARI LIBRARY backend. It provides robust persistence for unauthenticated visitors (guest carts) and registered customers (user carts), strict catalog validation, server-side display price snapshots, optimistic concurrency control via cart versioning, deterministic guest-to-user cart merge, and structured conflict reporting that guarantees customer data is never silently dropped or financial expectations rewritten.

All implementations strictly adhere to the authoritative specifications:
* **AL-AZHARI-LIBRARY-BACKEND-IMPLEMENTATION-PLAN** (Sections 20, 48.3, 62, 63)
* **AL-AZHARI-LIBRARY-MongoDB-Implementation-Plan** (Sections 5.6, 32.3, 34)
* **AL-AZHARI-LIBRARY-PRD** (CART-001 through CART-005)

### Foundational Principles
* **Display Snapshot Only**: The price stored in the cart (`unitPriceMinor`) is strictly a display snapshot. It is NOT authoritative financial data. Cart is NOT an order.
* **No Inventory Reservation**: Cart operations never touch inventory counters (`stockTotal`, `stockReserved`) or reservation ledgers. Inventory reservations belong exclusively to Phase 7.
* **No Services**: Services are non-fixed-price custom workflows and are strictly rejected at the cart boundary.
* **Never Silently Discard Conflicts**: Incompatible or price-changed items during cart merge are returned as explicit structured conflicts for customer review.
* **Strict Optimistic Versioning**: Stale mutations fail immediately with HTTP 409 `CART_VERSION_CONFLICT`.

---

## 2. Cart Architecture & Ownership Model

The system implements two distinct cart ownership states:

```text
                      INCOMING REQUEST
                             │
                  optionalAuthentication()
                             │
                 resolveCartOwner() Middleware
                             │
               ┌─────────────┴─────────────┐
               ▼                           ▼
      AUTHENTICATED USER              GUEST VISITOR
    (req.user.userId present)    (No credentials present)
               │                           │
         ownerType: "user"           ownerType: "guest"
        userId: ObjectId(user)       userId: null
        sessionId: null              sessionId: unpredictable UUID
        expiresAt: null              expiresAt: UTC Date (+30 days)
               │                           │
               └─────────────┬─────────────┘
                             ▼
                   CART OPERATIONS & DB
```

### 2.1 Guest Cart
* **Identity**: Keyed by an unpredictable, high-entropy session identifier (`sessionId`).
* **Transmission**: Sent via HTTP-only cookie (`al_azhari_guest_session`) and `x-guest-session-id` header.
* **Security & Privacy**:
  - Contains no personal user information.
  - Never logged in plaintext.
  - Redacted from error logs and structured logs.
  - Excluded from notification bodies and URLs.
* **Lifecycle & Expiration**:
  - Bound to MongoDB TTL index on `expiresAt` (30 days from creation/mutation).
  - Evaluated at application boundary: expired carts are treated as empty, preventing reliance on MongoDB's asynchronous TTL sweeper.

### 2.2 Registered User Cart
* **Identity**: Keyed by the authenticated customer principal (`userId`).
* **Persistence**: Persists across browser sessions, devices, and logins.
* **Expiration**: Permanent (`expiresAt: null`).
* **Uniqueness**: Enforced by MongoDB partial unique index (`{ userId: 1 }, { unique: true, partialFilterExpression: { ownerType: 'user' } }`).

---

## 3. Data Models & Schemas

### 3.1 Collection: `carts`

```typescript
interface ICart {
  _id: Types.ObjectId;
  ownerType: 'guest' | 'user';
  userId: Types.ObjectId | null;
  sessionId: string | null;
  items: ICartItem[];
  currency: 'EGP';
  expiresAt: Date | null;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}
```

### 3.2 Subdocument: `items[]`

```typescript
interface ICartItem {
  _id: Types.ObjectId;
  productId: Types.ObjectId;
  variantId: string | null;
  quantity: number;
  unitPriceMinor: number;
  productNameSnapshot: {
    ar: string;
    en?: string | null;
  };
  imageSnapshot: string | null;
  addedAt: Date;
}
```

### 3.3 Item Identity & Combination Rules
* Logical identity is uniquely determined by `productId + (variantId || null)`.
* **Same Product + Same Variant**: Increases existing line quantity (`existing.quantity += quantity`), recalculates display snapshot.
* **Same Product + Different Variant**: Appends a separate line item.
* **Product without Variants**: `variantId` is `null`.

---

## 4. API Endpoints Contract

All endpoints are mounted under `/api/v1/cart`:

| Method | Endpoint | Auth | Body / Params | Success | Errors | Description |
|---|---|---|---|---|---|---|
| `GET` | `/api/v1/cart` | Guest or Customer | None | `200 OK` | `500` | Read-only cart retrieval with calculated totals. Returns empty cart if none exists. |
| `POST` | `/api/v1/cart/items` | Guest or Customer | `{ productId, variantId?, quantity, expectedVersion? }` | `200 OK` | `400, 404, 409, 422` | Adds or merges an item into the cart. Validates catalog state. |
| `PATCH` | `/api/v1/cart/items/:itemId` | Cart Owner | `{ quantity, expectedVersion }` | `200 OK` | `400, 404, 409, 422` | Updates quantity of an existing item. Requires `expectedVersion`. |
| `DELETE` | `/api/v1/cart/items/:itemId` | Cart Owner | Query/Body `{ expectedVersion? }` | `204 No Content` | `404, 409` | Idempotently removes an item from the cart. |
| `POST` | `/api/v1/cart/merge` | Customer Only | `{ sessionId?, expectedUserCartVersion? }` | `200 OK` | `401, 409` | Merges guest cart into authenticated customer account. |

### 4.1 Safe Public Response Projection

```json
{
  "success": true,
  "data": {
    "id": "66f000000000000000000030",
    "ownerType": "guest",
    "items": [
      {
        "id": "66f000000000000000000031",
        "productId": "66f000000000000000000010",
        "variantId": "edition-2026",
        "quantity": 2,
        "unitPriceMinor": 18500,
        "productNameSnapshot": {
          "ar": "فقه السنة",
          "en": "Fiqh us-Sunnah"
        },
        "imageSnapshot": "books/fiqh-1",
        "addedAt": "2026-09-28T11:00:00.000Z"
      }
    ],
    "itemsCount": 1,
    "totalQuantity": 2,
    "subtotalMinor": 37000,
    "currency": "EGP",
    "version": 3,
    "expiresAt": "2026-10-28T11:00:00.000Z",
    "createdAt": "2026-09-28T11:00:00.000Z",
    "updatedAt": "2026-09-28T11:05:00.000Z"
  },
  "requestId": "req_123456",
  "meta": {
    "requestId": "req_123456",
    "timestamp": "2026-09-28T11:05:00.000Z"
  }
}
```

---

## 5. Catalog Validation Boundary

When adding or updating items, the Cart service re-validates the product against the live Catalog database:

1. **Existence**: Product must exist (`PRODUCT_NOT_FOUND`, HTTP 404).
2. **Publication**: Product must have `isPublished: true` (`PRODUCT_NOT_PURCHASABLE`, HTTP 422).
3. **Category Validity**: Category must exist, have `isActive: true`, and `isMvpEnabled: true` (`PRODUCT_NOT_PURCHASABLE`, HTTP 422).
4. **Service Exclusion**: Category kind must be `'product'`. Service requests cannot enter the cart (`PRODUCT_NOT_PURCHASABLE`, HTTP 422).
5. **Availability**: Product or variant availability must not be `'out_of_stock'` (`PRODUCT_NOT_PURCHASABLE` / `VARIANT_NOT_PURCHASABLE`, HTTP 422).
6. **Variant Selection**:
   - If product has variants: `variantId` is required (`VARIANT_REQUIRED`, HTTP 422) and must exist (`VARIANT_NOT_FOUND`, HTTP 404).
   - If product has no variants: unexpected `variantId` is rejected with `VALIDATION_ERROR` (HTTP 400).

---

## 6. Optimistic Concurrency & Versioning

To safeguard against simultaneous writes across multiple browser tabs, mobile apps, or rapid double clicks:

* Every cart document contains an integer `version` field, starting at `1`.
* Every mutation (`addItem`, `updateItem`, `removeItem`, `mergeCart`) increments `version` by 1.
* Mutating endpoints require or support `expectedVersion`.
* Updates are executed using atomic MongoDB version predicates:
  ```typescript
  CartModel.findOneAndUpdate(
    { _id: cartId, version: expectedVersion },
    { $set: { ... }, $inc: { version: 1 } },
    { new: true }
  );
  ```
* If the version does not match, the operation aborts without mutating state and returns HTTP 409 `CART_VERSION_CONFLICT`.
* Last-write-wins race conditions are mathematically prevented.

---

## 7. Deterministic Guest -> User Cart Merge

When an unauthenticated visitor logs into their registered customer account, their guest cart is reconciled with their user cart:

```text
    GUEST CART                      REGISTERED USER CART
┌──────────────────┐               ┌──────────────────┐
│ Item A (qty: 2)  │               │ Item A (qty: 1)  │
│ Item B (qty: 1)  │               │ Item C (qty: 3)  │
└─────────┬────────┘               └─────────┬────────┘
          │                                  │
          └────────────────┬─────────────────┘
                           │
             CATALOG RE-VALIDATION CHECK
              - Still published?
              - Category active/MVP?
              - Variant available?
              - Price changed?
                           │
        ┌──────────────────┴──────────────────┐
        │                                     │
   NO CONFLICTS                          ANY CONFLICT
        ▼                                     ▼
 ┌───────────────┐                  ┌───────────────────┐
 │ MERGED CART   │                  │ 409 CONFLICT      │
 │ Item A: qty 3 │                  │ CART_MERGE_       │
 │ Item B: qty 1 │                  │ CONFLICT          │
 │ Item C: qty 3 │                  │ Explicit conflict │
 │ (Guest purged)│                  │ list returned.    │
 └───────────────┘                  │ Guest cart intact.│
                                    └───────────────────┘
```

### 7.1 Merge Conflict Matrix

| Scenario | Guest Cart | User Cart | Outcome |
|---|---|---|---|
| Same item in both | Product A (qty 2) | Product A (qty 1) | Merged: Product A (qty 3) |
| Guest-only item | Product B (qty 1) | — | Merged: Product B (qty 1) |
| User-only item | — | Product C (qty 3) | Preserved: Product C (qty 3) |
| Different variants | Variant 1 (qty 1) | Variant 2 (qty 2) | Separate lines preserved |
| Product unavailable | Out of stock | — | `PRODUCT_UNAVAILABLE` conflict |
| Price changed | Snapshot 185 EGP | Catalog 200 EGP | `PRICE_CHANGED` conflict |
| Variant deleted | Variant deleted | — | `VARIANT_NOT_FOUND` conflict |
| Product unpublished | Unpublished book | — | `PRODUCT_UNPUBLISHED` conflict |

### 7.2 Never Silently Drop Policy
If any guest item conflicts with current catalog rules or has drifted in price:
1. No item is deleted or silently replaced.
2. No quantities are silently changed.
3. The guest cart remains intact in MongoDB.
4. HTTP 409 `CART_MERGE_CONFLICT` is returned with the structured list of conflicts for customer review.

---

## 8. Database Indexes & Migrations

### 8.1 Indexes Defined on `carts`
1. `{ userId: 1 }`: Unique partial filter on `{ ownerType: "user" }` (Name: `idx_carts_user_unique`).
2. `{ sessionId: 1 }`: Unique partial filter on `{ ownerType: "guest" }` (Name: `idx_carts_session_unique`).
3. `{ expiresAt: 1 }`: TTL index with `expireAfterSeconds: 0` (Name: `idx_carts_expires_ttl`).

### 8.2 Migration Script
* File: `src/database/migrations/scripts/20260928_004_cart.migration.ts`
* Idempotent: checks collection existence and creates background indexes safely.
* Non-destructive: `down()` drops specific indexes without deleting the `carts` collection or documents.

---

## 9. Security & Tamper Resistance

* **Mass Assignment Protection**: Zod schemas strictly reject extra or unexpected fields (`strict: true`). Attempts to supply `userId`, `ownerType`, `version`, `unitPriceMinor`, or `stockTotal` in client payloads fail with HTTP 400.
* **No Price Trust**: Client-supplied prices are completely ignored. All prices and display snapshots are derived server-side from active catalog records.
* **No Stock Mutation**: Cart mutations do not touch `stockTotal` or `stockReserved`.
* **Guest & Customer Isolation**:
  - Authenticated customers cannot view or modify another customer's cart.
  - Guest sessions cannot view or modify another guest session's cart.
* **Information Leak Prevention**: Responses and log entries redact internal fields, password hashes, and session secrets.

---

## 10. Test Strategy & Verification Results

| Test Suite | Tests | Description |
|---|---|---|
| `tests/unit/cart-schema.test.ts` | 7 | Schema constraints, items, subdocuments, version default, unique partial indexes. |
| `tests/unit/cart-migration.test.ts` | 2 | Idempotent index creation (`up`) and clean index rollback (`down`). |
| `tests/unit/cart-service.test.ts` | 10 | Catalog validation, variants, optimistic versioning, complete merge conflict matrix. |
| `tests/api/cart-guest.test.ts` | 5 | Guest session lifecycle, cookies, headers, quantity updates, deletion, TTL check. |
| `tests/api/cart-user.test.ts` | 2 | Customer persistence, multi-request retention, ownership isolation. |
| `tests/api/cart-concurrency.test.ts` | 1 | Race condition test: competing updates on same version; exactly one succeeds, one fails with 409. |
| `tests/api/cart-merge.test.ts` | 2 | REST API merge execution, combined quantities, structured price change conflict. |
| `tests/api/cart-security.test.ts` | 5 | Mass assignment rejection, invalid ObjectId validation, price tamper resistance, zero inventory mutation. |
| `tests/integration/cart-smoke.test.ts` | 7 | Health probes, Cart lifecycle smoke, catalog regression smoke. |

**Regression Suite Result**:
* **58 Test Suites Passed** (49 previous + 9 new Phase 6 suites)
* **429 Tests Passed** (385 previous + 44 new Phase 6 tests)
* **0 Failures**
* **TypeScript Compilation**: Clean (0 errors)
* **ESLint**: Clean (0 errors, 0 warnings)
* **Production Build**: Clean (`dist/` compiled successfully)

---

## 11. Explicitly Deferred Features

In strict accordance with the project specification boundary:
* **Inventory Reservations & Deductions**: Phase 7
* **Checkout & Final Price Revalidation**: Phase 8
* **Orders & Status Machine**: Phase 8
* **Payments & Payment Proofs**: Phase 9
* **Shipping Calculations & Coupons**: Phase 10
* **Student Services Workflows**: Phase 11
* **Customer Reviews & Ratings**: Phase 12
