# Phase 7 — Inventory Implementation Documentation

## 1. Overview & Architecture

Phase 7 implements the authoritative Inventory Domain for the **AL-AZHARI LIBRARY** backend.

### Key Architectural Tenets
1. **Single Source of Truth**:
   MongoDB remains the sole authority. Stock counters (`stockTotal`, `stockReserved`, `inventoryVersion`) reside directly on `ProductModel` (top-level for non-variant products, and on embedded `IVariant` subdocuments for variant products). No separate duplicate product/variant tables exist.
2. **Explicit Stock Invariants**:
   For every physical product or embedded variant:
   ```text
   available = stockTotal - stockReserved
   stockTotal >= stockReserved >= 0
   available >= 0
   ```
   Under no circumstance does the system permit negative stock or `stockReserved > stockTotal`.
3. **Multi-Document Atomic Transactions**:
   All state transitions coordinating stock, reservations, ledger entries, and order hooks strictly utilize MongoDB multi-document transactions via the existing `withTransaction()` infrastructure.
4. **Append-Only Immutable Ledger**:
   All stock movements (reservations, releases, deductions, adjustments) are recorded in `inventoryTransactions`. Ledger entries cannot be modified or deleted via public or admin APIs. Corrections are represented exclusively as new appended rows.

---

## 2. Order & Inventory Boundary Clarifications

As specified in the authoritative documentation:
- **Cart does not reserve stock**: Items in cart only perform availability checks against `available = stockTotal - stockReserved`. No counters are updated.
- **Order submission does not reserve stock**: When a customer submits an order (`POST /api/v1/orders`), the order enters `pending_review`. No inventory reservation or stock movement takes place.
- **Admin acceptance reserves stock**: When an administrator reviews and accepts the order, a multi-document transaction conditionally updates `stockReserved`, writes active reservations, and appends `RESERVATION` ledger rows.
- **Pre-orders do not reserve stock**: Pre-orders do not participate in stock reservation or deduction.
- **Delivered / Picked Up performs final deduction**: Only upon fulfillment completion are `stockTotal` and `stockReserved` decremented and the reservation transitioned to `consumed`.

---

## 3. Collections & Schemas

### 3.1 `inventoryReservations`
Tracks stock reservations for order line items.
- `orderId`: ObjectId (`ref: 'Order'`)
- `orderItemId`: string (line item identifier)
- `productId`: ObjectId (`ref: 'Product'`)
- `variantId`: string | null
- `quantity`: integer (>= 1)
- `status`: `'active' | 'released' | 'consumed'`
- `createdAt`, `updatedAt`: BSON UTC Timestamps

#### Indexes:
- `{ orderItemId: 1 }` with `{ unique: true, partialFilterExpression: { status: 'active' } }` (guarantees exactly one active reservation per order line)
- `{ orderId: 1, createdAt: -1 }` (querying order reservations)
- `{ productId: 1, variantId: 1, status: 1 }` (lookup by product/variant)
- `{ status: 1, createdAt: -1 }` (lifecycle management)

### 3.2 `inventoryTransactions`
Append-only immutable transaction ledger.
- `productId`: ObjectId (`ref: 'Product'`)
- `variantId`: string | null
- `type`: `'RESERVATION' | 'RELEASE' | 'DEDUCTION' | 'ADJUSTMENT'`
- `quantityDelta`: integer
- `stockTotalBefore`, `stockTotalAfter`: integer (>= 0)
- `stockReservedBefore`, `stockReservedAfter`: integer (>= 0)
- `sourceType`: `'order' | 'manual' | 'audit' | 'cancellation' | 'fulfillment'`
- `sourceId`: string
- `actorId`: ObjectId | null
- `actorRole`: string
- `reason`: string (non-empty)
- `createdAt`, `updatedAt`: BSON UTC Timestamps

#### Indexes:
- `{ productId: 1, variantId: 1, createdAt: -1 }`
- `{ sourceType: 1, sourceId: 1, createdAt: -1 }`
- `{ actorId: 1, createdAt: -1 }`

---

## 4. Workflows & Lifecycle Transitions

### 4.1 Conditional Reservation (Accept & Reserve)
- Multi-document all-or-nothing transaction.
- Non-variant products:
  `$expr: { $gte: [{ $subtract: ['$stockTotal', '$stockReserved'] }, quantity] }`
- Variant products:
  Uses top-level `$expr` with `$filter` on array elements to guarantee atomic conditional reservation without over-reserving under concurrency.
- If any line item in an order lacks available stock, the entire transaction aborts cleanly, and all previous reservations in the batch roll back.

### 4.2 Reservation Release (Cancel / Reject)
- Idempotent: Can only release an `'active'` reservation. Repeated calls return the released reservation without decrementing stock a second time.
- Decrements `stockReserved` and marks reservation `'released'`.
- Appends `RELEASE` ledger transaction.

### 4.3 Final Stock Deduction (Fulfillment)
- Triggered when order state reaches `Delivered` or `Picked Up`.
- Decrements both `stockTotal` and `stockReserved` by `reservation.quantity`.
- Transitions reservation to `'consumed'`.
- Appends `DEDUCTION` ledger transaction.
- Idempotent: Does not deduct twice if repeated.

### 4.4 Manual Inventory Adjustment
- Requires `Admin` or `Store Owner` role (`inventory.write` permission).
- Requires mandatory `expectedVersion` for optimistic concurrency protection.
- Requires non-empty `reason`.
- Validates invariants: `stockTotal >= stockReserved >= 0`.
- Atomically updates stock counters, increments `inventoryVersion`, appends an `ADJUSTMENT` ledger row, and creates a system `AuditLog` entry.
- Stale version returns `INVENTORY_VERSION_CONFLICT` (HTTP 409).

---

## 5. Security & RBAC
- Customers cannot read internal inventory counters or mutate inventory.
- Admin access requires authenticated user with `inventory.write` permission.
- Store Owner has unrestricted universal authority.
- Mass assignment protection: Client-injected `actorId`, `version`, `status`, etc., are completely ignored and derived solely from the authenticated session context.
- Immutability hooks on `InventoryTransactionModel` prevent `updateOne`, `updateMany`, `findOneAndUpdate`, `deleteOne`, `deleteMany`, and `findOneAndDelete`.

---

## 6. Testing & Concurrency Verification
The implementation is verified with comprehensive automated tests:
1. `tests/unit/inventory-schema.test.ts`: Schema validations, strict fields, immutability hooks.
2. `tests/unit/inventory-migration.test.ts`: Idempotent up and down index migrations.
3. `tests/unit/inventory-invariants.test.ts`: Invariant boundaries, negative stock rejection, available calculation.
4. `tests/integration/inventory-reservation.test.ts`: Conditional atomic reservations, all-or-nothing rollback across multiple lines.
5. `tests/integration/inventory-concurrency.test.ts`: Last-unit race protection (2 concurrent requests for 1 unit; exactly one succeeds), multiple units race, stale version conflict.
6. `tests/integration/inventory-lifecycle.test.ts`: Reserve -> Release, Reserve -> Deduct, duplicate release idempotency, duplicate deduction idempotency.
7. `tests/api/inventory-admin.test.ts`: RBAC enforcement, GET inventory, GET ledger, POST adjust, version conflicts, mass assignment rejection.
