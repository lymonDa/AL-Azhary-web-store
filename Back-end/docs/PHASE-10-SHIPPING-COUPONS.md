# Phase 10 — Shipping & Coupons

## Overview

Phase 10 adds the full **Shipping Rules Engine** and **Coupon / Promotions** subsystems. Integrates with Phases 5–9 (Catalog, Cart, Inventory, Checkout & Orders, Payments).

---

## Requirements Implemented

### Shipping

| Req | Status | Description |
|-----|--------|-------------|
| SHIP-001 | ✅ | Delivery estimate via ShippingService.estimateShipping() |
| SHIP-002 | ✅ | Hierarchy: area > city > governorate > default |
| SHIP-003 | ✅ | Priority-based rule selection within same scope |
| SHIP-004 | ✅ | serviceable:false rules mark destinations unserviceable |
| SHIP-005 | ✅ | Effective date range (effectiveFrom, effectiveTo) |
| SHIP-006 | ✅ | Cost as integer minor units (piastres) — no floating point |
| SHIP-007 | ✅ | Admin CRUD for shipping rules with audit logging |
| SHIP-008 | ✅ | SHIPPING_CONFIGURATION_UNAVAILABLE when no rule matches |
| SHIP-009 | ✅ | adminUpdateShipping sets final carrier + cost on order |

### Pickup

| Req | Status | Description |
|-----|--------|-------------|
| PICK-001 | ✅ | Pickup estimate returns 0 EGP cost |
| PICK-002 | ✅ | Pickup location (ar/en/address) returned in estimate |
| PICK-003 | ✅ | scope: 'pickup' returned in response |
| PICK-004 | ✅ | Pickup requires no governorate/city — no geographic lookup |

### Coupons

| Req | Status | Description |
|-----|--------|-------------|
| COUP-001 | ✅ | Coupon validated server-side inside MongoDB transaction |
| COUP-002 | ✅ | Discount calculated in integer minor units only |
| COUP-003 | ✅ | Coupon snapshot frozen on order at creation time |
| COUP-004 | ✅ | Atomic redemption with unique (couponId, orderId) DB constraint |
| COUP-005 | ✅ | Idempotent: same key returns same order, no double-redeem |

---

## API Reference

### Customer / Public

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/v1/checkout/shipping-estimate | Pre-checkout shipping cost estimate |
| POST | /api/v1/checkout/validate | Validate coupon code (non-consuming) |
| POST | /api/v1/orders | Create order (accepts couponCode in body) |

### Admin — Shipping

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | /api/v1/admin/shipping/rules | shipping.read | Paginated list |
| POST | /api/v1/admin/shipping/rules | shipping.write | Create rule |
| GET | /api/v1/admin/shipping/rules/:id | shipping.read | Get by ID |
| PATCH | /api/v1/admin/shipping/rules/:id | shipping.write | Update rule |
| DELETE | /api/v1/admin/shipping/rules/:id | shipping.write | Delete rule |

### Admin — Coupons

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| POST | /api/v1/admin/coupons | coupons.write | Create coupon |
| GET | /api/v1/admin/coupons | coupons.read | Paginated list (supports active/scopeType/discountType filters) |
| GET | /api/v1/admin/coupons/:id | coupons.read | Get by ID |
| PATCH | /api/v1/admin/coupons/:id | coupons.write | Update (requires expectedVersion) |
| POST | /api/v1/admin/coupons/:id/activate | coupons.write | Re-activate |
| POST | /api/v1/admin/coupons/:id/deactivate | coupons.write | Soft-deactivate |
| GET | /api/v1/admin/coupons/:id/redemptions | coupons.read | Paginated redemption log |
| POST | /api/v1/admin/orders/:reference/shipping | orders.write | Set final carrier + cost |

---

## Concurrency Guarantees

| Scenario | Guarantee |
|----------|-----------|
| Two checkouts race on a limited coupon | Atomic findOneAndUpdate with $expr guard — exactly one wins |
| Same idempotency key submitted twice | Returns same order, no re-redemption |
| Two admins update same coupon simultaneously | expectedVersion optimistic lock — one wins, other gets COUPON_VERSION_CONFLICT |
| Same (couponId, orderId) inserted twice | Unique compound index rejects duplicate |
| Checkout fails mid-transaction | Full rollback — no partial redemption, no usage count leak |

---

## Open Decisions (NOT Resolved)

The following were NOT implemented because no authoritative business decision exists:

| OD | Topic | Current Behavior |
|----|-------|------------------|
| OD-03 | COD minimum threshold | No minimum enforced |
| OD-04 | Carrier rate sources | finalCostMinor is admin-entered only |
| OD-05 | Coupon stacking | stackable field stored, not enforced |
| OD-06 | Excluded governorates | serviceable:false available but no hard-coded exclusions |
| OD-17 | firstOrderOnly restriction | Field stored, not enforced |

---

## Migration

`20260928_008_shipping_coupons` — creates shippingRules, coupons, couponRedemptions collections and all blueprint indexes. Idempotent. Implements down().

---

## Test Coverage

| File | Type | Coverage |
|------|------|---------|
| tests/unit/shipping-service.test.ts | Unit | Rule hierarchy, priority, pickup, unserviceable |
| tests/unit/coupon-service.test.ts | Unit | All COUP-001–005 validation paths, discount math, scoping |
| tests/unit/shipping-coupons-migration.test.ts | Unit | Migration up/down, indexes, idempotency |
| tests/unit/phase10-concurrency.test.ts | Unit | COUP-RACE-01 (limit enforcement), COUP-RACE-02 (duplicate guard) |
| tests/api/coupon-api.test.ts | Integration | Validate endpoint, admin CRUD, checkout+coupon flow, idempotency |
| tests/api/order-api.test.ts | Integration | Shipping estimate + order lifecycle |
