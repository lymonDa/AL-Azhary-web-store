import mongoose, { Types } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { CouponModel } from '../../src/modules/coupons/models/coupon.model';
import { CouponRedemptionModel } from '../../src/modules/coupons/models/coupon-redemption.model';
import { CouponService } from '../../src/modules/coupons/services/coupon.service';
import { CouponRepository } from '../../src/modules/coupons/repositories/coupon.repository';
import { CouponRedemptionRepository } from '../../src/modules/coupons/repositories/coupon-redemption.repository';
import { ErrorCodes } from '../../src/common/errors/errorCodes';

// Stub audit so we don't need a real connection to auditLogs
const mockAudit = { record: jest.fn().mockResolvedValue(undefined) };

const makeCouponService = () =>
  new CouponService(
    new CouponRepository(),
    new CouponRedemptionRepository(),
    mockAudit as never,
  );

/** Helper to insert a coupon directly */
const createCoupon = async (overrides: Record<string, unknown> = {}) => {
  const defaults = {
    codeNormalized: 'TEST10',
    discountType: 'percentage',
    value: 1000, // 10.00%
    scopeType: 'order',
    scopeIds: [],
    active: true,
    usageCount: 0,
    usageLimit: null,
    minimumOrderMinor: null,
    version: 1,
  };
  const docs = await CouponModel.create([{ ...defaults, ...overrides }]);
  return docs[0];
};

const sampleItems = [
  { productId: new Types.ObjectId(), unitPriceMinor: 5000, quantity: 2, lineTotalMinor: 10000 },
];

describe('CouponService — unit tests', () => {
  let mongod: MongoMemoryServer;
  let service: CouponService;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri(), { dbName: 'test_coupon_service' });
    service = makeCouponService();
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongod.stop();
  });

  beforeEach(async () => {
    await CouponModel.deleteMany({});
    await CouponRedemptionModel.deleteMany({});
    mockAudit.record.mockClear();
  });

  // ─── normalizeCouponCode ───────────────────────────────────────────────────

  it('normalizes coupon code: trims and uppercases', () => {
    expect(service.normalizeCouponCode('  hello10  ')).toBe('HELLO10');
    expect(service.normalizeCouponCode('sale50')).toBe('SALE50');
    expect(service.normalizeCouponCode('')).toBe('');
  });

  // ─── validateCoupon — active / inactive ───────────────────────────────────

  it('throws COUPON_NOT_FOUND for unknown code', async () => {
    await expect(
      service.validateCoupon({ code: 'NOPE', items: sampleItems }),
    ).rejects.toMatchObject({ code: ErrorCodes.COUPON_NOT_FOUND });
  });

  it('throws COUPON_INACTIVE for inactive coupon', async () => {
    await createCoupon({ codeNormalized: 'INACTIVE', active: false });
    await expect(
      service.validateCoupon({ code: 'INACTIVE', items: sampleItems }),
    ).rejects.toMatchObject({ code: ErrorCodes.COUPON_INACTIVE });
  });

  // ─── date window ──────────────────────────────────────────────────────────

  it('throws COUPON_NOT_STARTED when coupon has not started yet', async () => {
    const future = new Date(Date.now() + 86400 * 1000);
    await createCoupon({ codeNormalized: 'FUTURE', startsAt: future });
    await expect(
      service.validateCoupon({ code: 'FUTURE', items: sampleItems }),
    ).rejects.toMatchObject({ code: ErrorCodes.COUPON_NOT_STARTED });
  });

  it('throws COUPON_EXPIRED when coupon is past its endsAt', async () => {
    const past = new Date(Date.now() - 86400 * 1000);
    await createCoupon({ codeNormalized: 'EXPIRED', endsAt: past });
    await expect(
      service.validateCoupon({ code: 'EXPIRED', items: sampleItems }),
    ).rejects.toMatchObject({ code: ErrorCodes.COUPON_EXPIRED });
  });

  // ─── minimum order ────────────────────────────────────────────────────────

  it('throws COUPON_MINIMUM_NOT_MET when subtotal is below configured minimum', async () => {
    await createCoupon({ codeNormalized: 'MIN100', minimumOrderMinor: 20000 }); // 200 EGP
    await expect(
      service.validateCoupon({ code: 'MIN100', items: sampleItems, subtotalMinor: 10000 }),
    ).rejects.toMatchObject({ code: ErrorCodes.COUPON_MINIMUM_NOT_MET });
  });

  it('succeeds when subtotal meets minimum', async () => {
    await createCoupon({ codeNormalized: 'MIN100', minimumOrderMinor: 5000 });
    const result = await service.validateCoupon({
      code: 'MIN100',
      items: sampleItems,
      subtotalMinor: 10000,
    });
    expect(result.valid).toBe(true);
  });

  // ─── percentage discount ──────────────────────────────────────────────────

  it('calculates percentage discount using integer arithmetic', async () => {
    // 10.00% = 1000 basis points
    await createCoupon({ codeNormalized: 'PCT10', discountType: 'percentage', value: 1000 });
    const result = await service.validateCoupon({ code: 'PCT10', items: sampleItems });
    // 10% of 10000 = 1000
    expect(result.discountMinor).toBe(1000);
    expect(Number.isInteger(result.discountMinor)).toBe(true);
  });

  it('discount never exceeds eligible subtotal', async () => {
    // 100% discount on order
    await createCoupon({ codeNormalized: 'PCT100', discountType: 'percentage', value: 10000 });
    const result = await service.validateCoupon({ code: 'PCT100', items: sampleItems });
    expect(result.discountMinor).toBeLessThanOrEqual(10000);
    expect(result.discountMinor).toBeGreaterThanOrEqual(0);
  });

  // ─── fixed discount ───────────────────────────────────────────────────────

  it('applies fixed discount as configured integer minor units', async () => {
    await createCoupon({
      codeNormalized: 'FLAT50',
      discountType: 'fixed',
      value: 2000, // 20 EGP
    });
    const result = await service.validateCoupon({ code: 'FLAT50', items: sampleItems });
    expect(result.discountMinor).toBe(2000);
  });

  it('fixed discount capped at eligible subtotal', async () => {
    await createCoupon({
      codeNormalized: 'FLAT9999',
      discountType: 'fixed',
      value: 99999, // more than subtotal
    });
    const result = await service.validateCoupon({ code: 'FLAT9999', items: sampleItems });
    expect(result.discountMinor).toBe(10000); // capped at subtotal
  });

  // ─── scope: product ───────────────────────────────────────────────────────

  it('discounts only eligible product items (scopeType: product)', async () => {
    const productId = new Types.ObjectId();
    const otherProductId = new Types.ObjectId();

    await createCoupon({
      codeNormalized: 'PROD10',
      discountType: 'percentage',
      value: 1000,
      scopeType: 'product',
      scopeIds: [productId.toString()],
    });

    const items = [
      { productId, unitPriceMinor: 5000, quantity: 1, lineTotalMinor: 5000 },
      { productId: otherProductId, unitPriceMinor: 5000, quantity: 1, lineTotalMinor: 5000 },
    ];

    const result = await service.validateCoupon({ code: 'PROD10', items });
    // Only 5000 is eligible — 10% = 500
    expect(result.discountMinor).toBe(500);
  });

  it('throws COUPON_NOT_APPLICABLE when no items match product scope', async () => {
    const productId = new Types.ObjectId();
    await createCoupon({
      codeNormalized: 'PRODONLY',
      discountType: 'percentage',
      value: 1000,
      scopeType: 'product',
      scopeIds: [productId.toString()],
    });

    const differentItem = [
      {
        productId: new Types.ObjectId(),
        unitPriceMinor: 5000,
        quantity: 1,
        lineTotalMinor: 5000,
      },
    ];

    await expect(
      service.validateCoupon({ code: 'PRODONLY', items: differentItem }),
    ).rejects.toMatchObject({ code: ErrorCodes.COUPON_NOT_APPLICABLE });
  });

  // ─── usage limit ──────────────────────────────────────────────────────────

  it('throws COUPON_USAGE_LIMIT_REACHED when usage count reached limit', async () => {
    await createCoupon({
      codeNormalized: 'LIMIT1',
      usageLimit: 1,
      usageCount: 1, // already at limit
    });
    await expect(
      service.validateCoupon({ code: 'LIMIT1', items: sampleItems }),
    ).rejects.toMatchObject({ code: ErrorCodes.COUPON_USAGE_LIMIT_REACHED });
  });

  it('allows use when usageCount is below limit', async () => {
    await createCoupon({
      codeNormalized: 'LIMIT3',
      usageLimit: 3,
      usageCount: 2,
    });
    const result = await service.validateCoupon({ code: 'LIMIT3', items: sampleItems });
    expect(result.valid).toBe(true);
  });

  it('allows unlimited use when usageLimit is null', async () => {
    await createCoupon({
      codeNormalized: 'UNLIMITED',
      usageLimit: null,
      usageCount: 999,
    });
    const result = await service.validateCoupon({ code: 'UNLIMITED', items: sampleItems });
    expect(result.valid).toBe(true);
  });

  // ─── customer restrictions ────────────────────────────────────────────────

  it('throws COUPON_NOT_APPLICABLE when registeredOnly=true and no customerId', async () => {
    await createCoupon({
      codeNormalized: 'REGONLY',
      customerRestriction: { registeredOnly: true },
    });
    await expect(
      service.validateCoupon({ code: 'REGONLY', customerId: null, items: sampleItems }),
    ).rejects.toMatchObject({ code: ErrorCodes.COUPON_NOT_APPLICABLE });
  });

  it('passes registeredOnly check when customer is authenticated', async () => {
    await createCoupon({
      codeNormalized: 'REGONLY2',
      customerRestriction: { registeredOnly: true },
    });
    const result = await service.validateCoupon({
      code: 'REGONLY2',
      customerId: new Types.ObjectId().toString(),
      items: sampleItems,
    });
    expect(result.valid).toBe(true);
  });

  it('throws COUPON_NOT_APPLICABLE when customer not in customerIds list', async () => {
    const allowedCustomerId = new Types.ObjectId().toString();
    await createCoupon({
      codeNormalized: 'CUSTONLY',
      customerRestriction: { customerIds: [allowedCustomerId] },
    });
    const otherId = new Types.ObjectId().toString();
    await expect(
      service.validateCoupon({ code: 'CUSTONLY', customerId: otherId, items: sampleItems }),
    ).rejects.toMatchObject({ code: ErrorCodes.COUPON_NOT_APPLICABLE });
  });

  // ─── coupon snapshot fields ───────────────────────────────────────────────

  it('returns all required snapshot fields in CouponValidationResult', async () => {
    await createCoupon({ codeNormalized: 'SNAP1', discountType: 'percentage', value: 500 });
    const result = await service.validateCoupon({ code: 'SNAP1', items: sampleItems });
    expect(result).toMatchObject({
      valid: true,
      couponId: expect.any(String),
      code: 'SNAP1',
      discountType: 'percentage',
      value: 500,
      discountMinor: expect.any(Number),
      scopeType: expect.any(String),
      scopeIds: expect.any(Array),
    });
  });
});
