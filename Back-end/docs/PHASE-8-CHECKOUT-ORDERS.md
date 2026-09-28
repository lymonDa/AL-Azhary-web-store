# Phase 8 — Checkout & Orders Implementation Documentation

## 1. Scope
Phase 8 establishes the authoritative **Checkout & Orders** subsystem for the **AL-AZHARI LIBRARY** backend.
It covers:
- Shipping rule hierarchy and pre-order shipping estimates (`POST /api/v1/checkout/shipping-estimate`).
- Guest and registered customer checkout (`POST /api/v1/orders`).
- Server-side multi-line order calculation, catalog price revalidation, and availability revalidation.
- Atomic multi-document checkout transactions with cart clearing and idempotency protection.
- Public order reference generation (`ORD-YYYYMMDD-XXXX`) and cryptographically secure guest token access (`X-Guest-Token`).
- Explicit order lifecycle state machine separated from payment status and fulfillment status.
- Order retrieval (`GET /api/v1/orders/:reference`), pending order editing (`PATCH /api/v1/orders/:reference`), customer cancellation (`POST /api/v1/orders/:reference/cancel`), and COD confirmation (`POST /api/v1/orders/:reference/confirm-cod`).
- Admin order operations: listing with pagination, order details, acceptance with atomic Phase 7 inventory reservation, rejection with reservation release, operational status transitions with final stock deduction on fulfillment (`delivered` / `picked_up`), and carrier/final cost recording.

---

## 2. Requirement IDs
- **CHK-001**: Support checkout for both Guest and Registered customers.
- **CHK-002**: Collect detailed address (governorate, city, area, street, building, apartment, landmark, recipient name, phone).
- **CHK-003**: No map/location-pin input required.
- **CHK-004**: Customer selection between Delivery and Pickup.
- **CHK-005**: Pickup is free of charge (0 EGP) at library location.
- **CHK-006**: Estimated shipping cost displayed before order confirmation.
- **CHK-007**: Support payment methods: InstaPay, Vodafone Cash, Orange Cash, Etisalat Cash, WE Pay, and Cash on Delivery (COD).
- **CHK-008 & CHK-010**: Non-COD methods require payment proof workflow (Phase 9); COD requires no payment proof.
- **CHK-009**: No transaction ID / reference requested from customer during checkout.
- **CHK-011**: Order summary with complete cost breakdown (product subtotal, shipping estimate, discounts, total).
- **CHK-012**: Valid coupon snapshot & deduction recalculation.
- **ORD-001**: Customer submits order containing one or more eligible products.
- **ORD-002**: Newly submitted orders enter `pending_review` initial status.
- **ORD-003**: Product orders modeled as separate entities with separate lifecycles from student services.
- **ORD-004**: Unique human-referenceable order identifier (`ORD-YYYYMMDD-XXXX`).
- **ORD-005**: Customer views full order detail with immutable snapshots and cost breakdown.
- **ORD-006**: Customer may edit products, quantities, contact, and address only while order is in `pending_review`.
- **ORD-007**: Customer may cancel order only while it is in `pending_review`; cancellation blocked after acceptance.
- **ORD-008**: Post-acceptance financial changes blocked.
- **ORD-009**: Non-financial post-acceptance changes subject to strict RBAC and practical fulfillment boundaries.

---

## 3. Architecture
The order subsystem lives in `src/modules/orders/` and interacts with peer modules through public application interfaces:
- **Cart Domain (`src/modules/carts/`)**: Owns customer cart lines and cart versioning. Cleared atomically on order creation.
- **Catalog Domain (`src/modules/products/`)**: Read-only verification of product availability, variant attributes, and current price.
- **Shipping Domain (`src/modules/shipping/`)**: Owns `shippingRules` collection and hierarchy matching.
- **Inventory Domain (`src/modules/inventory/`)**: Owns stock, reservations, and ledger. Order creation does NOT reserve inventory. Admin acceptance atomically reserves all lines via Phase 7 `reserveOrderStock()`. Fulfillment completion calls `deductOrderReservations()`.
- **Audit Domain (`src/modules/audit/`)**: Records immutable audit entries for order creation, updates, cancellations, admin acceptances, and status updates.

```text
[Client / Browser]
       │
       ▼
[OrderController]
       │
       ▼
[OrderService] ──► [ShippingService] (Shipping Rules Hierarchy)
       │
       ├───► [CartRepository] (Validate & Clear Cart)
       │
       ├───► [ProductRepository] (Price & Availability Revalidation)
       │
       ├───► [OrderRepository] (Authoritative Orders Aggregate)
       │
       ├───► [InventoryService] (Phase 7: Reserve on Accept, Deduct on Delivery)
       │
       └───► [AuditService] (Append-only Audit Trail)
```

---

## 4. Order Data Model & Collections

### 4.1 Collection: `orders`
- `_id`: ObjectId
- `reference`: String (unique, formatted as `ORD-YYYYMMDD-XXXX`)
- `customerId`: ObjectId | null (reference to registered user, null for guests)
- `guestAccessTokenHash`: String | null (SHA-256 hash of 256-bit guest access token)
- `customerSnapshot`: Name, phone, and optional email snapshot.
- `items`: Array of order line snapshots:
  - `productId`: ObjectId
  - `variantId`: String | null
  - `nameSnapshot`: `{ ar: string, en?: string | null }`
  - `imageSnapshot`: String | null (Cloudinary public ID)
  - `categorySnapshot`: String | null
  - `attributesSnapshot`: Map<string, string>
  - `quantity`: Integer (>= 1)
  - `unitPriceMinor`: Integer (>= 0)
  - `lineTotalMinor`: Integer (>= 0)
  - `availabilityAtSubmission`: String
  - `stockItemKey`: String
- `totals`:
  - `productSubtotalMinor`: Integer (>= 0)
  - `shippingEstimateMinor`: Integer (>= 0)
  - `shippingFinalMinor`: Integer | null
  - `discountMinor`: Integer (>= 0)
  - `totalMinor`: Integer (>= 0)
  - `currency`: 'EGP'
- `fulfillment`:
  - `method`: 'delivery' | 'pickup'
  - `addressSnapshot`: Detailed address snapshot | null
  - `provider`: String | null
  - `shippingStatus`: 'pending' | 'preparing' | 'ready_for_pickup' | 'picked_up' | 'shipped' | 'out_for_delivery' | 'delivered' | 'completed'
  - `estimateSource`: String | null
  - `finalCostConfirmedAt`: Date | null
- `paymentMethodKey`: String ('cod', 'instapay', etc.)
- `status`: OrderStatus ('pending_review', 'accepted', 'awaiting_payment', 'customer_confirmation_required', 'confirmed', 'preparing', 'shipped', 'out_for_delivery', 'delivered', 'completed', 'rejected', 'cancelled', 'returned')
- `paymentStatus`: PaymentStatus ('not_submitted', 'proof_uploaded', 'under_review', 'confirmed', 'rejected', 'new_proof_requested')
- `statusHistory`: Array of `{ fromStatus, toStatus, actorId, actorRole, reason, timestamp }`
- `couponSnapshot`: `{ code, discountMinor }` | null
- `submittedAt`: Date
- `acceptedAt`: Date | null
- `completedAt`: Date | null
- `cancelledAt`: Date | null
- `idempotencyKey`: String | null (indexed, unique partial)
- `idempotencyOwner`: String | null (`user:<id>` or `guest:<sessionId>`)
- `idempotencyFingerprint`: String | null (SHA-256 hash of sorted request payload)
- `version`: Integer (>= 1, optimistic concurrency counter)

### 4.2 Collection: `shippingRules`
- `governorate`: String | null
- `city`: String | null
- `area`: String | null
- `costMinor`: Integer (>= 0)
- `priority`: Integer
- `isActive`: Boolean
- `effectiveFrom`: Date | null
- `effectiveTo`: Date | null
- `serviceable`: Boolean
- `label`: `{ ar: string, en?: string | null }`

---

## 5. State Machine & Lifecycle Separation

The system maintains three completely independent state fields:
1. `order.status`
2. `order.paymentStatus`
3. `order.fulfillment.shippingStatus`

### Order Status Transitions:
```text
pending_review
    ├── accepted
    ├── rejected
    └── cancelled (customer)

accepted
    ├── awaiting_payment (digital payments)
    │     └── payment_verification ──► payment_confirmed ──► preparing
    └── customer_confirmation_required (COD)
          └── confirmed ──► preparing

preparing
    ├── ready_for_pickup ──► picked_up ──► completed (pickup fulfillment)
    └── shipped ──► out_for_delivery ──► delivered ──► completed (delivery fulfillment)

completed
    └── returned (approved returns)
```

Terminal states (`rejected`, `cancelled`, `returned`) have no outbound transitions.

---

## 6. Checkout Flow & Price / Availability Revalidation

Inside a managed MongoDB transaction:
1. Acquire/validate owner-scoped idempotency key.
2. Load active cart by owner (`user` or `guest`). Reject if empty (`CART_EMPTY`).
3. Re-read catalog data directly from MongoDB with transaction session.
4. Revalidate product publication status and stock availability. If changed, fail with `AVAILABILITY_CHANGED` and leave cart intact.
5. Revalidate unit price against current catalog. If changed, fail with `PRICE_CHANGED` and leave cart intact.
6. Calculate totals server-side in minor units (`piastres`). Never trust client totals.
7. Validate shipping serviceability via `ShippingService`.
8. Generate secure guest token for guest checkout.
9. Snapshot customer contact, delivery address, order items, and shipping estimates.
10. Insert order in `pending_review` status.
11. Clear cart items and increment cart version.
12. Create audit trail record.
13. Commit transaction and return safe order DTO (including raw guest access token if guest).

**CRITICAL**: Order creation does **NOT** reserve stock.

---

## 7. Guest Access & Security
- Guest checkout requires `x-guest-session-id` header or cookie.
- Generates 256-bit cryptographically secure token (`crypto.randomBytes(32)`).
- The raw token is returned **only once** in the creation response (`guestAccessToken`).
- The database stores **only** the SHA-256 hash (`guestAccessTokenHash`).
- Reading/editing/cancelling a guest order requires `X-Guest-Token` matching the hash.
- Cross-guest access is denied (HTTP 403 Forbidden).
- Plaintext guest tokens never appear in server logs or database records.

---

## 8. Idempotency & Concurrency
- `Idempotency-Key` header / body property is owner-scoped (`user:<id>` or `guest:<sessionId>`).
- Request fingerprint is computed via SHA-256 over deterministic sorted payload keys.
- **Replay**: Same key + same owner + same payload returns the existing order without creating duplicates.
- **Key Reuse Conflict**: Same key with altered payload or different owner throws `IDEMPOTENCY_KEY_REUSED` (HTTP 409).
- **Concurrent Race**: Database-level unique partial index on `idempotencyKey` traps concurrent race conditions (code 11000), gracefully resolving to the created order.

---

## 9. Inventory Integration (Phase 7 Handshake)
- Order submission: 0 stock reservations, 0 stock movements.
- Admin accept (`POST /api/v1/admin/orders/:reference/accept`):
  Calls Phase 7 `inventoryService.reserveOrderStock()` inside the transaction. Atomically verifies available stock (`stockTotal - stockReserved >= quantity`) for all lines. If any line is out of stock, acceptance fails with `INSUFFICIENT_STOCK` and the order stays `pending_review`.
- Admin reject (`POST /api/v1/admin/orders/:reference/reject`):
  Defensively releases any active reservations via `inventoryService.releaseOrderReservations()`.
- Fulfillment completion (`delivered` or `picked_up`):
  Calls `inventoryService.deductOrderReservations()`, decrementing both `stockTotal` and `stockReserved` and appending a `DEDUCTION` ledger row.

---

## 10. Shipping Estimation Architecture
Hierarchy matches specific to general:
1. `area`
2. `city`
3. `governorate`
4. `default` (null locations)

Within the same scope, highest `priority` active rule within `[effectiveFrom, effectiveTo]` wins.
- Pickup always returns 0 EGP and configured library location.
- If no active rule matches, throws `SHIPPING_CONFIGURATION_UNAVAILABLE`.
- If matched rule has `serviceable: false`, checkout halts with unserviceable error.

---

## 11. Database Indexes & Migration
Migration `20260928_006_orders.migration.ts` establishes:
- `orders`:
  - `{ reference: 1 }` (unique)
  - `{ customerId: 1, submittedAt: -1 }`
  - `{ status: 1, submittedAt: 1 }`
  - `{ "fulfillment.addressSnapshot.governorate": 1, submittedAt: -1 }`
  - `{ idempotencyKey: 1 }` (unique, partialFilterExpression: `{ idempotencyKey: { $type: "string" } }`)
  - `{ guestAccessTokenHash: 1 }`
- `shippingRules`:
  - `{ isActive: 1, priority: -1 }`
  - `{ governorate: 1, city: 1, area: 1 }`

Migration is registered in `src/database/migrations/index.ts`, fully idempotent and rollback-safe.

---

## 12. Error Codes Established
- `ORDER_NOT_FOUND` (404)
- `ORDER_VERSION_CONFLICT` (409)
- `PRICE_CHANGED` (409)
- `IDEMPOTENCY_KEY_REUSED` (409)
- `AVAILABILITY_CHANGED` (422)
- `ORDER_STATE_CONFLICT` (422)
- `SHIPPING_CONFIGURATION_UNAVAILABLE` (422)
- `PAYMENT_METHOD_UNAVAILABLE` (422)
- `CART_EMPTY` (422)

---

## 13. Open Decisions & Phase 8 Boundaries
- **Payment Proof Workflow**: Manual payment proof uploads, Cloudinary media signatures, and admin payment proof reviews belong strictly to **Phase 9**.
- **Coupons**: Full coupon administration and stacking rules belong to **Phase 10**. Phase 8 only snapshots and calculates approved coupon deductions.
- **Partial Acceptance**: Disallowed. All order lines must be available for admin acceptance.
- **Customer Shipping Reconfirmation (OD-04)**: When Admin records adjusted final shipping costs, the order stores `shippingFinalMinor` and `finalCostConfirmedAt` without altering customer acceptance bindings.
- **Returns & Refunds**: Belong to **Phase 12**.
