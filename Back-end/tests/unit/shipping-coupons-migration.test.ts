import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { shippingCouponsMigration } from '../../src/database/migrations/scripts/20260928_008_shipping_coupons.migration';

describe('Phase 10 Shipping & Coupons Database Migration (008)', () => {
  let mongod: MongoMemoryServer;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri, { dbName: 'test_shipping_coupons_migration' });
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongod.stop();
  });

  it('should have valid metadata with sequence 20260928_008_shipping_coupons', () => {
    expect(shippingCouponsMigration.id).toBe('20260928_008_shipping_coupons');
    expect(shippingCouponsMigration.description).toBeDefined();
  });

  it('runs up migration to create shippingRules, coupons, couponRedemptions collections and blueprint indexes', async () => {
    await shippingCouponsMigration.up({ connection: mongoose.connection });

    const db = mongoose.connection.db!;

    // shippingRules indexes
    const ruleIndexes = (await db.collection('shippingRules').indexes()).map((idx) => idx.name);
    expect(ruleIndexes).toContain('idx_shipping_rules_active_priority');
    expect(ruleIndexes).toContain('idx_shipping_rules_geo');
    expect(ruleIndexes).toContain('idx_shipping_rules_effective_range');

    // coupons indexes
    const couponIndexes = (await db.collection('coupons').indexes()).map((idx) => idx.name);
    expect(couponIndexes).toContain('idx_coupons_code_unique');
    expect(couponIndexes).toContain('idx_coupons_active_dates');
    expect(couponIndexes).toContain('idx_coupons_scope_type');

    // couponRedemptions indexes
    const redemptionIndexes = (await db.collection('couponRedemptions').indexes()).map(
      (idx) => idx.name,
    );
    expect(redemptionIndexes).toContain('idx_coupon_redemptions_coupon_order_unique');
    expect(redemptionIndexes).toContain('idx_coupon_redemptions_customer_created');
    expect(redemptionIndexes).toContain('idx_coupon_redemptions_coupon_created');

    // Idempotency: running up again must not throw
    await expect(
      shippingCouponsMigration.up({ connection: mongoose.connection }),
    ).resolves.not.toThrow();
  });

  it('runs down migration to drop created indexes without dropping collection data', async () => {
    if (shippingCouponsMigration.down) {
      await shippingCouponsMigration.down({ connection: mongoose.connection });

      const db = mongoose.connection.db!;

      const ruleIndexes = (await db.collection('shippingRules').indexes()).map((idx) => idx.name);
      expect(ruleIndexes).not.toContain('idx_shipping_rules_active_priority');
      expect(ruleIndexes).not.toContain('idx_shipping_rules_geo');

      const couponIndexes = (await db.collection('coupons').indexes()).map((idx) => idx.name);
      expect(couponIndexes).not.toContain('idx_coupons_code_unique');
      expect(couponIndexes).not.toContain('idx_coupons_active_dates');

      const redemptionIndexes = (await db.collection('couponRedemptions').indexes()).map(
        (idx) => idx.name,
      );
      expect(redemptionIndexes).not.toContain('idx_coupon_redemptions_coupon_order_unique');

      // Collections themselves must still exist
      const collections = (await db.listCollections().toArray()).map((c) => c.name);
      expect(collections).toContain('shippingRules');
      expect(collections).toContain('coupons');
      expect(collections).toContain('couponRedemptions');
    }
  });
});
