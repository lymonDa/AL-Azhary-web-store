import request from 'supertest';
import { app } from '../../src/app';
import { startTestDb, stopTestDb, clearTestDb } from '../helpers/test-db';
import { OrderModel } from '../../src/modules/orders/models/order.model';
import { hashGuestToken } from '../../src/modules/orders/utils/order.utils';
import { rolesService } from '../../src/modules/users/services/roles.service';

describe('Phase 17 — Guest Order Lookup Security & Enumeration Resistance', () => {
  beforeAll(async () => {
    await startTestDb();
  });

  afterAll(async () => {
    await stopTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();
    await rolesService.ensureSystemRoles();
  });

  it('allows guest order lookup with valid reference and matching guest secret token', async () => {
    const rawSecret = 'guest_secret_token_1234567890abcdef';
    const guestAccessTokenHash = hashGuestToken(rawSecret);

    const order = await OrderModel.create({
      reference: 'ORD-20260930-112233',
      customerId: null,
      customerSnapshot: {
        name: 'Guest Customer',
        phone: '01012345678',
      },
      paymentMethodKey: 'cash_on_delivery',
      paymentStatus: 'not_submitted',
      guestAccessTokenHash,
      status: 'pending_review',
      items: [
        {
          productId: '507f1f77bcf86cd799439011',
          stockItemKey: 'PROD-111',
          availabilityAtSubmission: 'in_stock',
          nameSnapshot: { ar: 'كتاب الفقه' },
          unitPriceMinor: 15000,
          quantity: 1,
          lineTotalMinor: 15000,
        },
      ],
      fulfillment: {
        method: 'delivery',
        costMinor: 3000,
        addressSnapshot: {
          governorate: 'Qena',
          city: 'Qena',
          street: 'Tahrir Street',
          recipientName: 'Guest Customer',
          phone: '01012345678',
        },
      },
      totals: {
        productSubtotalMinor: 15000,
        shippingEstimateMinor: 3000,
        discountMinor: 0,
        totalMinor: 18000,
        currency: 'EGP',
      },
    });

    const res = await request(app)
      .get(`/api/v1/orders/${order.reference}`)
      .set('x-guest-token', rawSecret);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.reference).toBe('ORD-20260930-112233');

    // Security projection checks: sensitive internal fields must NOT be returned
    expect(res.body.data.guestAccessTokenHash).toBeUndefined();
    expect(res.body.data.adminNotes).toBeUndefined();
    expect(res.body.data.__v).toBeUndefined();
  });

  it('rejects guest lookup with wrong or forged secret token with 403 Forbidden', async () => {
    const rawSecret = 'valid_secret_xyz';
    const guestAccessTokenHash = hashGuestToken(rawSecret);

    const order = await OrderModel.create({
      reference: 'ORD-20260930-445566',
      customerId: null,
      customerSnapshot: {
        name: 'Guest',
        phone: '01000000000',
      },
      paymentMethodKey: 'cash_on_delivery',
      paymentStatus: 'not_submitted',
      guestAccessTokenHash,
      status: 'pending_review',
      items: [
        {
          productId: '507f1f77bcf86cd799439011',
          stockItemKey: 'PROD-222',
          availabilityAtSubmission: 'in_stock',
          nameSnapshot: { ar: 'كتاب' },
          unitPriceMinor: 1000,
          quantity: 1,
          lineTotalMinor: 1000,
        },
      ],
      fulfillment: {
        method: 'pickup',
        costMinor: 0,
        addressSnapshot: {
          governorate: 'Qena',
          city: 'Qena',
          street: 'Store Pickup',
          recipientName: 'Guest',
          phone: '01000000000',
        },
      },
      totals: {
        productSubtotalMinor: 1000,
        shippingEstimateMinor: 0,
        discountMinor: 0,
        totalMinor: 1000,
        currency: 'EGP',
      },
    });

    const res = await request(app)
      .get(`/api/v1/orders/${order.reference}`)
      .set('x-guest-token', 'wrong_guess_token');

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('rejects guest lookup without any authorization header or token', async () => {
    const order = await OrderModel.create({
      reference: 'ORD-20260930-778899',
      customerId: null,
      customerSnapshot: {
        name: 'Guest',
        phone: '01000000000',
      },
      paymentMethodKey: 'cash_on_delivery',
      paymentStatus: 'not_submitted',
      guestAccessTokenHash: hashGuestToken('some_secret'),
      status: 'pending_review',
      items: [
        {
          productId: '507f1f77bcf86cd799439011',
          stockItemKey: 'PROD-333',
          availabilityAtSubmission: 'in_stock',
          nameSnapshot: { ar: 'كتاب' },
          unitPriceMinor: 1000,
          quantity: 1,
          lineTotalMinor: 1000,
        },
      ],
      fulfillment: {
        method: 'pickup',
        costMinor: 0,
        addressSnapshot: {
          governorate: 'Qena',
          city: 'Qena',
          street: 'Store Pickup',
          recipientName: 'Guest',
          phone: '01000000000',
        },
      },
      totals: {
        productSubtotalMinor: 1000,
        shippingEstimateMinor: 0,
        discountMinor: 0,
        totalMinor: 1000,
        currency: 'EGP',
      },
    });

    const res = await request(app).get(`/api/v1/orders/${order.reference}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });
});
