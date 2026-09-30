import { Migration, MigrationContext } from '../types';
import { registerMigration } from '../registry';

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
export const shippingCouponsMigration: Migration = {
  id: '20260928_008_shipping_coupons',
  description:
    'Ensure shippingRules, coupons, and couponRedemptions collections with Phase 10 blueprint indexes',
  up: async (context: MigrationContext): Promise<void> => {
    const db = context.connection.db;
    if (!db) return;

    // ─── shippingRules ────────────────────────────────────────────────────────

    const rulesExists = await db.listCollections({ name: 'shippingRules' }).toArray();
    if (rulesExists.length === 0) {
      await db.createCollection('shippingRules');
    }
    const rulesCol = db.collection('shippingRules');

    // Active rule query index (used by estimateShipping)
    await rulesCol.createIndex(
      { isActive: 1, priority: -1 },
      { name: 'idx_shipping_rules_active_priority', background: true },
    );

    // Geographic resolution index (area > city > governorate > default hierarchy)
    try {
      await rulesCol.createIndex(
        { governorate: 1, city: 1, area: 1 },
        { name: 'idx_shipping_rules_geo', background: true },
      );
    } catch {
      // Ignore if already created with different name by earlier migration
    }

    // Effective date range index
    await rulesCol.createIndex(
      { effectiveFrom: 1, effectiveTo: 1 },
      { name: 'idx_shipping_rules_effective_range', background: true },
    );

    // ─── coupons ──────────────────────────────────────────────────────────────

    const couponsExists = await db.listCollections({ name: 'coupons' }).toArray();
    if (couponsExists.length === 0) {
      await db.createCollection('coupons');
    }
    const couponsCol = db.collection('coupons');

    // Unique normalized coupon code (COUP-001)
    await couponsCol.createIndex(
      { codeNormalized: 1 },
      { unique: true, name: 'idx_coupons_code_unique', background: true },
    );

    // Active/expiry lookup index (used by validateCoupon)
    await couponsCol.createIndex(
      { active: 1, startsAt: 1, endsAt: 1 },
      { name: 'idx_coupons_active_dates', background: true },
    );

    // Scope type index (used for admin listing)
    await couponsCol.createIndex(
      { scopeType: 1 },
      { name: 'idx_coupons_scope_type', background: true },
    );

    // ─── couponRedemptions ────────────────────────────────────────────────────

    const redemptionsExists = await db.listCollections({ name: 'couponRedemptions' }).toArray();
    if (redemptionsExists.length === 0) {
      await db.createCollection('couponRedemptions');
    }
    const redemptionsCol = db.collection('couponRedemptions');

    // Unique compound: one redemption per coupon per order (COUP-004 idempotency)
    await redemptionsCol.createIndex(
      { couponId: 1, orderId: 1 },
      { unique: true, name: 'idx_coupon_redemptions_coupon_order_unique', background: true },
    );

    // Customer redemption history index
    await redemptionsCol.createIndex(
      { customerId: 1, createdAt: -1 },
      { name: 'idx_coupon_redemptions_customer_created', background: true },
    );

    // Coupon usage history index (used by listRedemptions)
    await redemptionsCol.createIndex(
      { couponId: 1, createdAt: -1 },
      { name: 'idx_coupon_redemptions_coupon_created', background: true },
    );
  },

  down: async (context: MigrationContext): Promise<void> => {
    const db = context.connection.db;
    if (!db) return;

    const safeDrop = async (collectionName: string, indexName: string) => {
      try {
        await db.collection(collectionName).dropIndex(indexName);
      } catch {
        // Silently ignore if index does not exist
      }
    };

    await safeDrop('shippingRules', 'idx_shipping_rules_active_priority');
    await safeDrop('shippingRules', 'idx_shipping_rules_geo');
    await safeDrop('shippingRules', 'idx_shipping_rules_effective_range');

    await safeDrop('coupons', 'idx_coupons_code_unique');
    await safeDrop('coupons', 'idx_coupons_active_dates');
    await safeDrop('coupons', 'idx_coupons_scope_type');

    await safeDrop('couponRedemptions', 'idx_coupon_redemptions_coupon_order_unique');
    await safeDrop('couponRedemptions', 'idx_coupon_redemptions_customer_created');
    await safeDrop('couponRedemptions', 'idx_coupon_redemptions_coupon_created');
  },
};

registerMigration(shippingCouponsMigration);
