import { Migration } from '../types';
/**
 * Phase 10 — Shipping & Coupons migration.
 *
 * Ensures the three Phase 10 collections exist with required indexes:
 *   - shippingRules: active rule lookup, geographic resolution, effective date range
 *   - coupons: unique normalized code, active/expiry lookup, scopeType index
 *   - couponRedemptions: unique (couponId, orderId) constraint, customer history, coupon history
 *
 * Idempotent: createIndex with a named index is a safe no-op if the index exists.
 * Non-destructive: no drop/delete operations.
 *
 * Open decisions (OD-03, OD-04, OD-05, OD-06, OD-17) remain open.
 * No business policy was invented in this migration.
 */
export declare const shippingCouponsMigration: Migration;
