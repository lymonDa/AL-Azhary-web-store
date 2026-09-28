import mongoose, { Types } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { OrderModel } from '../../src/modules/orders/models/order.model';
import {
  generateOrderReference,
  generateGuestAccessToken,
  hashGuestToken,
  calculateIdempotencyFingerprint,
} from '../../src/modules/orders/utils/order.utils';

describe('Order Model, Schema & Utility Integrity', () => {
  let mongod: MongoMemoryServer;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri, { dbName: 'test_order_schema' });
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongod.stop();
  });

  beforeEach(async () => {
    await OrderModel.deleteMany({});
  });

  it('creates a valid registered customer order with default pending_review status and version 1', async () => {
    const customerId = new Types.ObjectId();
    const productId = new Types.ObjectId();
    const reference = generateOrderReference();

    const order = await OrderModel.create({
      reference,
      customerId,
      customerSnapshot: {
        name: 'أحمد علي',
        phone: '01012345678',
        email: 'ahmed@example.com',
      },
      items: [
        {
          productId,
          variantId: 'hardcover',
          nameSnapshot: { ar: 'صحيح البخاري', en: 'Sahih Al-Bukhari' },
          imageSnapshot: 'images/bukhari.jpg',
          categorySnapshot: 'hadith',
          attributesSnapshot: { cover: 'hardcover' },
          quantity: 2,
          unitPriceMinor: 25000,
          lineTotalMinor: 50000,
          availabilityAtSubmission: 'in_stock',
          stockItemKey: `${productId}:hardcover`,
        },
      ],
      totals: {
        productSubtotalMinor: 50000,
        shippingEstimateMinor: 4500,
        shippingFinalMinor: null,
        discountMinor: 0,
        totalMinor: 54500,
        currency: 'EGP',
      },
      fulfillment: {
        method: 'delivery',
        addressSnapshot: {
          governorate: 'Qena',
          city: 'Qena City',
          street: 'Main St',
        },
        shippingStatus: 'pending',
      },
      paymentMethodKey: 'cod',
      status: 'pending_review',
      paymentStatus: 'not_submitted',
      version: 1,
    });

    expect(order._id).toBeDefined();
    expect(order.reference).toBe(reference);
    expect(order.customerId?.toString()).toBe(customerId.toString());
    expect(order.status).toBe('pending_review');
    expect(order.paymentStatus).toBe('not_submitted');
    expect(order.fulfillment.method).toBe('delivery');
    expect(order.fulfillment.shippingStatus).toBe('pending');
    expect(order.totals.totalMinor).toBe(54500);
    expect(order.totals.currency).toBe('EGP');
    expect(order.items).toHaveLength(1);
    expect(order.version).toBe(1);
  });

  it('rejects an order without items', async () => {
    const reference = generateOrderReference();

    await expect(
      OrderModel.create({
        reference,
        customerSnapshot: { name: 'علي', phone: '01111111111' },
        items: [],
        totals: {
          productSubtotalMinor: 0,
          shippingEstimateMinor: 0,
          discountMinor: 0,
          totalMinor: 0,
          currency: 'EGP',
        },
        fulfillment: {
          method: 'pickup',
          shippingStatus: 'pending',
        },
        paymentMethodKey: 'cod',
      }),
    ).rejects.toThrow();
  });

  it('rejects non-integer monetary values', async () => {
    const reference = generateOrderReference();
    const productId = new Types.ObjectId();

    await expect(
      OrderModel.create({
        reference,
        customerSnapshot: { name: 'علي', phone: '01111111111' },
        items: [
          {
            productId,
            nameSnapshot: { ar: 'كتاب' },
            quantity: 1,
            unitPriceMinor: 100.5, // invalid float
            lineTotalMinor: 100.5,
            availabilityAtSubmission: 'in_stock',
            stockItemKey: productId.toString(),
          },
        ],
        totals: {
          productSubtotalMinor: 100.5,
          shippingEstimateMinor: 0,
          discountMinor: 0,
          totalMinor: 100.5,
          currency: 'EGP',
        },
        fulfillment: {
          method: 'pickup',
          shippingStatus: 'pending',
        },
        paymentMethodKey: 'cod',
      }),
    ).rejects.toThrow();
  });

  it('generates compliant public order references', () => {
    const fixedDate = new Date('2026-09-28T12:00:00Z');
    const ref = generateOrderReference(fixedDate);
    expect(ref).toMatch(/^ORD-20260928-[0-9A-F]{6}$/);
  });

  it('generates secure guest token and verifies SHA-256 hash', () => {
    const { rawToken, tokenHash } = generateGuestAccessToken();
    expect(rawToken).toHaveLength(64); // 32 bytes hex
    expect(tokenHash).toHaveLength(64); // sha256 hex
    expect(hashGuestToken(rawToken)).toBe(tokenHash);
  });

  it('calculates deterministic idempotency fingerprint for payload', () => {
    const payload1 = { a: 1, b: 'test', c: { x: true, y: 123 } };
    const payload2 = { c: { x: true, y: 123 }, b: 'test', a: 1 }; // different key ordering

    const fp1 = calculateIdempotencyFingerprint(payload1);
    const fp2 = calculateIdempotencyFingerprint(payload2);
    expect(fp1).toBe(fp2);

    const payload3 = { a: 2, b: 'test', c: { x: true, y: 123 } };
    const fp3 = calculateIdempotencyFingerprint(payload3);
    expect(fp1).not.toBe(fp3);
  });
});
