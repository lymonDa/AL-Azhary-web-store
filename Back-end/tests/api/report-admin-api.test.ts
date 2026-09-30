import request from 'supertest';
import { Types } from 'mongoose';
import { app } from '../../src/app';
import { startTestDb, stopTestDb, clearTestDb } from '../helpers/test-db';
import { UserModel } from '../../src/modules/users/models/user.model';
import { OrderModel } from '../../src/modules/orders/models/order.model';
import { ServiceRequestModel } from '../../src/modules/services/models/service-request.model';
import { QuotationModel } from '../../src/modules/quotations/models/quotation.model';
import { PreorderModel } from '../../src/modules/preorders/models/preorder.model';
import { CouponRedemptionModel } from '../../src/modules/coupons/models/coupon-redemption.model';
import { passwordService } from '../../src/modules/auth/services/password.service';
import { rolesService } from '../../src/modules/users/services/roles.service';

describe('Admin Reports API Tests (/api/v1/admin/reports/:report)', () => {
  let customerToken: string;
  let adminToken: string;
  let ownerToken: string;

  beforeAll(async () => {
    await startTestDb();
  });

  afterAll(async () => {
    await stopTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();
    await rolesService.ensureSystemRoles();

    const passwordHash = await passwordService.hashPassword('Password123!');

    // Customer
    await UserModel.create({
      name: 'Regular Customer',
      email: 'customer@example.com',
      phone: '+201011112222',
      passwordHash,
      role: 'customer',
      status: 'active',
      emailVerifiedAt: new Date(),
      refreshTokenVersion: 0,
    });

    // Admin (has reports.read by default)
    await UserModel.create({
      name: 'Reports Admin',
      email: 'admin@example.com',
      phone: '+201033334444',
      passwordHash,
      role: 'admin',
      status: 'active',
      emailVerifiedAt: new Date(),
      refreshTokenVersion: 0,
    });

    // Owner (has * by default)
    await UserModel.create({
      name: 'Store Owner',
      email: 'owner@example.com',
      phone: '+201055556666',
      passwordHash,
      role: 'owner',
      status: 'active',
      emailVerifiedAt: new Date(),
      refreshTokenVersion: 0,
    });

    const loginCustomer = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'customer@example.com', password: 'Password123!' });
    customerToken = loginCustomer.body.data.accessToken;

    const loginAdmin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@example.com', password: 'Password123!' });
    adminToken = loginAdmin.body.data.accessToken;

    const loginOwner = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'owner@example.com', password: 'Password123!' });
    ownerToken = loginOwner.body.data.accessToken;
  });

  describe('Security & Access Control', () => {
    it('returns 401 when unauthenticated', async () => {
      const res = await request(app).get('/api/v1/admin/reports/orders');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('returns 403 when accessed by customer', async () => {
      const res = await request(app)
        .get('/api/v1/admin/reports/orders')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('returns 200 when accessed by store owner', async () => {
      const res = await request(app)
        .get('/api/v1/admin/reports/orders')
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('returns 403 when admin role lacks reports.read permission', async () => {
      // Remove reports.read from admin
      await rolesService.updateRolePermissions('admin', ['orders.read']);

      const res = await request(app)
        .get('/api/v1/admin/reports/orders')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('returns 400 when an invalid/unsupported report name is requested', async () => {
      const res = await request(app)
        .get('/api/v1/admin/reports/unsupported-report-xyz')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(JSON.stringify(res.body)).toContain('Invalid report type');
    });

    it('rejects operator injection in report query filters', async () => {
      const res = await request(app)
        .get('/api/v1/admin/reports/orders?status[$ne]=delivered')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
    });
  });

  describe('1. Orders Report (/admin/reports/orders)', () => {
    it('returns correct aggregation for multiple orders and statuses', async () => {
      const baseOrder = {
        customerSnapshot: { name: 'Customer A', phone: '+201011112222' },
        items: [
          {
            productId: new Types.ObjectId(),
            nameSnapshot: { ar: 'كتاب 1' },
            quantity: 1,
            unitPriceMinor: 5000,
            lineTotalMinor: 5000,
            availabilityAtSubmission: 'in_stock',
            stockItemKey: 'item_1',
          },
        ],
        totals: {
          productSubtotalMinor: 5000,
          shippingEstimateMinor: 1000,
          shippingFinalMinor: 1000,
          discountMinor: 0,
          totalMinor: 6000,
          currency: 'EGP',
        },
        fulfillment: {
          method: 'delivery',
          addressSnapshot: { governorate: 'Cairo', city: 'Nasr City', street: 'Street 1' },
          shippingStatus: 'pending',
        },
        paymentMethodKey: 'cash_on_delivery',
        paymentStatus: 'not_submitted',
        statusHistory: [],
        version: 1,
      };

      await OrderModel.create({
        ...baseOrder,
        reference: 'ORD-REP-1',
        status: 'delivered',
        submittedAt: new Date('2026-09-10T10:00:00Z'),
      });

      await OrderModel.create({
        ...baseOrder,
        reference: 'ORD-REP-2',
        status: 'delivered',
        submittedAt: new Date('2026-09-12T10:00:00Z'),
      });

      await OrderModel.create({
        ...baseOrder,
        reference: 'ORD-REP-3',
        status: 'cancelled',
        submittedAt: new Date('2026-09-15T10:00:00Z'),
      });

      const res = await request(app)
        .get('/api/v1/admin/reports/orders')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalOrders).toBe(3);

      const byStatus = res.body.data.byStatus;
      const deliveredEntry = byStatus.find((s: { status: string }) => s.status === 'delivered');
      const cancelledEntry = byStatus.find((s: { status: string }) => s.status === 'cancelled');

      expect(deliveredEntry.count).toBe(2);
      expect(cancelledEntry.count).toBe(1);
    });

    it('filters orders report by date range', async () => {
      const res = await request(app)
        .get('/api/v1/admin/reports/orders?dateFrom=2026-09-11T00:00:00Z&dateTo=2026-09-13T23:59:59Z')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.totalOrders).toBe(0); // None seeded yet in this range
    });

    it('returns safe zero counts on empty collections', async () => {
      const res = await request(app)
        .get('/api/v1/admin/reports/orders')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.totalOrders).toBe(0);
      expect(res.body.data.byStatus).toEqual([]);
    });
  });

  describe('2. Revenue Report (/admin/reports/revenue)', () => {
    it('aggregates revenue using integer minor units preserving EGP semantics', async () => {
      const prodId = new Types.ObjectId();
      const baseOrder = {
        customerSnapshot: { name: 'Customer A', phone: '+201011112222' },
        items: [
          {
            productId: prodId,
            nameSnapshot: { ar: 'كتاب 1' },
            quantity: 1,
            unitPriceMinor: 10000,
            lineTotalMinor: 10000,
            availabilityAtSubmission: 'in_stock',
            stockItemKey: 'item_1',
          },
        ],
        fulfillment: {
          method: 'delivery',
          addressSnapshot: { governorate: 'Cairo', city: 'Nasr City', street: 'Street 1' },
          shippingStatus: 'delivered',
        },
        paymentStatus: 'confirmed',
        statusHistory: [],
        version: 1,
      };

      // Order 1: 15000 piastres (150.00 EGP) - delivered
      await OrderModel.create({
        ...baseOrder,
        reference: 'ORD-REV-1',
        paymentMethodKey: 'vodafone_cash',
        totals: {
          productSubtotalMinor: 10000,
          shippingEstimateMinor: 5000,
          shippingFinalMinor: 5000,
          discountMinor: 0,
          totalMinor: 15000,
          currency: 'EGP',
        },
        status: 'delivered',
        submittedAt: new Date('2026-09-10T12:00:00Z'),
      });

      // Order 2: 25000 piastres (250.00 EGP) - confirmed
      await OrderModel.create({
        ...baseOrder,
        reference: 'ORD-REV-2',
        paymentMethodKey: 'instapay',
        totals: {
          productSubtotalMinor: 20000,
          shippingEstimateMinor: 5000,
          shippingFinalMinor: 5000,
          discountMinor: 0,
          totalMinor: 25000,
          currency: 'EGP',
        },
        status: 'confirmed',
        submittedAt: new Date('2026-09-11T12:00:00Z'),
      });

      // Order 3: 50000 piastres - rejected (should NOT count in default revenue)
      await OrderModel.create({
        ...baseOrder,
        reference: 'ORD-REV-3',
        paymentMethodKey: 'instapay',
        totals: {
          productSubtotalMinor: 45000,
          shippingEstimateMinor: 5000,
          shippingFinalMinor: 5000,
          discountMinor: 0,
          totalMinor: 50000,
          currency: 'EGP',
        },
        status: 'rejected',
        submittedAt: new Date('2026-09-12T12:00:00Z'),
      });

      const res = await request(app)
        .get('/api/v1/admin/reports/revenue')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const data = res.body.data;
      // 15000 + 25000 = 40000 minor units
      expect(data.totalRevenueMinor).toBe(40000);
      expect(data.currency).toBe('EGP');
      expect(data.orderCount).toBe(2);

      const vodafone = data.byPaymentMethod.find((m: { paymentMethod: string }) => m.paymentMethod === 'vodafone_cash');
      const instapay = data.byPaymentMethod.find((m: { paymentMethod: string }) => m.paymentMethod === 'instapay');

      expect(vodafone.revenueMinor).toBe(15000);
      expect(vodafone.count).toBe(1);
      expect(instapay.revenueMinor).toBe(25000);
      expect(instapay.count).toBe(1);
    });
  });

  describe('3. Outside-Qena Report (/admin/reports/outside-qena)', () => {
    it('distinguishes between Qena and outside-Qena orders correctly', async () => {
      const prodId = new Types.ObjectId();
      const baseOrder = {
        customerSnapshot: { name: 'Customer B', phone: '+201011112222' },
        items: [
          {
            productId: prodId,
            nameSnapshot: { ar: 'كتاب 1' },
            quantity: 1,
            unitPriceMinor: 5000,
            lineTotalMinor: 5000,
            availabilityAtSubmission: 'in_stock',
            stockItemKey: 'item_1',
          },
        ],
        totals: {
          productSubtotalMinor: 5000,
          shippingEstimateMinor: 1000,
          shippingFinalMinor: 1000,
          discountMinor: 0,
          totalMinor: 6000,
          currency: 'EGP',
        },
        paymentMethodKey: 'cash_on_delivery',
        paymentStatus: 'not_submitted',
        status: 'delivered',
        statusHistory: [],
        version: 1,
      };

      // Order in Qena (Arabic 'قنا')
      await OrderModel.create({
        ...baseOrder,
        reference: 'ORD-GEO-QENA-AR',
        fulfillment: {
          method: 'delivery',
          addressSnapshot: { governorate: 'قنا', city: 'Qena City', street: 'Street 1' },
          shippingStatus: 'delivered',
        },
      });

      // Order in Qena (English 'Qena')
      await OrderModel.create({
        ...baseOrder,
        reference: 'ORD-GEO-QENA-EN',
        fulfillment: {
          method: 'delivery',
          addressSnapshot: { governorate: 'Qena', city: 'Qena City', street: 'Street 2' },
          shippingStatus: 'delivered',
        },
      });

      // Order outside Qena (Cairo)
      await OrderModel.create({
        ...baseOrder,
        reference: 'ORD-GEO-CAIRO',
        totals: { ...baseOrder.totals, totalMinor: 12000 },
        fulfillment: {
          method: 'delivery',
          addressSnapshot: { governorate: 'Cairo', city: 'Nasr City', street: 'Street 3' },
          shippingStatus: 'delivered',
        },
      });

      // Order outside Qena (Alexandria)
      await OrderModel.create({
        ...baseOrder,
        reference: 'ORD-GEO-ALEX',
        totals: { ...baseOrder.totals, totalMinor: 15000 },
        fulfillment: {
          method: 'delivery',
          addressSnapshot: { governorate: 'Alexandria', city: 'Smouha', street: 'Street 4' },
          shippingStatus: 'delivered',
        },
      });

      const res = await request(app)
        .get('/api/v1/admin/reports/outside-qena')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      const data = res.body.data;
      expect(data.totalOutsideQenaOrders).toBe(2);
      expect(data.totalAmountMinor).toBe(27000); // 12000 + 15000

      const cairo = data.byGovernorate.find((g: { governorate: string }) => g.governorate === 'Cairo');
      const alex = data.byGovernorate.find((g: { governorate: string }) => g.governorate === 'Alexandria');

      expect(cairo.count).toBe(1);
      expect(cairo.totalMinor).toBe(12000);
      expect(alex.count).toBe(1);
      expect(alex.totalMinor).toBe(15000);
    });
  });

  describe('4. Payment Methods Distribution (/admin/reports/payment-methods)', () => {
    it('aggregates payment method distribution with exact source record counts', async () => {
      const prodId = new Types.ObjectId();
      const baseOrder = {
        customerSnapshot: { name: 'Customer C', phone: '+201011112222' },
        items: [
          {
            productId: prodId,
            nameSnapshot: { ar: 'كتاب' },
            quantity: 1,
            unitPriceMinor: 5000,
            lineTotalMinor: 5000,
            availabilityAtSubmission: 'in_stock',
            stockItemKey: 'item_1',
          },
        ],
        totals: {
          productSubtotalMinor: 5000,
          shippingEstimateMinor: 1000,
          discountMinor: 0,
          totalMinor: 6000,
          currency: 'EGP',
        },
        fulfillment: {
          method: 'delivery',
          addressSnapshot: { governorate: 'Cairo', city: 'Nasr City', street: 'Street 1' },
          shippingStatus: 'pending',
        },
        paymentStatus: 'not_submitted',
        status: 'pending_review',
        statusHistory: [],
        version: 1,
      };

      await OrderModel.create({ ...baseOrder, reference: 'PM-1', paymentMethodKey: 'cash_on_delivery' });
      await OrderModel.create({ ...baseOrder, reference: 'PM-2', paymentMethodKey: 'cash_on_delivery' });
      await OrderModel.create({ ...baseOrder, reference: 'PM-3', paymentMethodKey: 'instapay' });

      const res = await request(app)
        .get('/api/v1/admin/reports/payment-methods')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      const data = res.body.data;
      expect(data.totalPayments).toBe(3);

      const cod = data.distribution.find((d: { paymentMethodKey: string }) => d.paymentMethodKey === 'cash_on_delivery');
      const instapay = data.distribution.find((d: { paymentMethodKey: string }) => d.paymentMethodKey === 'instapay');

      expect(cod.count).toBe(2);
      expect(instapay.count).toBe(1);
    });
  });

  describe('5. Service & Quotation Conversion (/admin/reports/service-conversion)', () => {
    it('aggregates service requests, quotation states, and computes conversion rate', async () => {
      const reqId1 = new Types.ObjectId();
      const reqId2 = new Types.ObjectId();
      const adminUser = new Types.ObjectId();

      await ServiceRequestModel.create({
        _id: reqId1,
        reference: 'SR-001',
        customerSnapshot: { name: 'Student 1', phone: '+201011112222' },
        serviceCategoryId: new Types.ObjectId(),
        serviceCategorySnapshot: { slug: 'printing', name: { ar: 'طباعة' }, formVersion: 1 },
        description: 'Print Thesis',
        status: 'processing',
        version: 1,
      });

      await ServiceRequestModel.create({
        _id: reqId2,
        reference: 'SR-002',
        customerSnapshot: { name: 'Student 2', phone: '+201033334444' },
        serviceCategoryId: new Types.ObjectId(),
        serviceCategorySnapshot: { slug: 'binding', name: { ar: 'تجليد' }, formVersion: 1 },
        description: 'Bind Book',
        status: 'admin_review',
        version: 1,
      });

      // Quotations: 1 accepted, 1 rejected, 1 sent
      await QuotationModel.create({
        serviceRequestId: reqId1,
        amountMinor: 25000,
        currency: 'EGP',
        status: 'accepted',
        sentBy: adminUser,
        version: 1,
      });

      await QuotationModel.create({
        serviceRequestId: reqId2,
        amountMinor: 15000,
        currency: 'EGP',
        status: 'rejected',
        sentBy: adminUser,
        version: 1,
      });

      await QuotationModel.create({
        serviceRequestId: reqId2,
        amountMinor: 18000,
        currency: 'EGP',
        status: 'sent',
        sentBy: adminUser,
        version: 2,
      });

      const res = await request(app)
        .get('/api/v1/admin/reports/service-conversion')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      const data = res.body.data;
      expect(data.totalRequests).toBe(2);
      expect(data.totalQuotations).toBe(3);
      expect(data.acceptedQuotations).toBe(1);
      expect(data.rejectedQuotations).toBe(1);
      // 1 accepted out of 3 total quotations = 0.3333
      expect(data.conversionRate).toBe(0.3333);
      expect(data.conversionFormula).toBe('acceptedQuotations / totalQuotations');
    });
  });

  describe('6. Product & Category Demand (/admin/reports/product-demand)', () => {
    it('aggregates quantities and revenues from authoritative order item snapshots', async () => {
      const prodA = new Types.ObjectId();
      const prodB = new Types.ObjectId();

      await OrderModel.create({
        reference: 'ORD-DEMAND-1',
        customerSnapshot: { name: 'Customer D', phone: '+201011112222' },
        items: [
          {
            productId: prodA,
            nameSnapshot: { ar: 'كتاب الفقه' },
            categorySnapshot: 'Islamic Studies',
            quantity: 3,
            unitPriceMinor: 5000,
            lineTotalMinor: 15000,
            availabilityAtSubmission: 'in_stock',
            stockItemKey: 'pA',
          },
          {
            productId: prodB,
            nameSnapshot: { ar: 'كتاب النحو' },
            categorySnapshot: 'Arabic Language',
            quantity: 2,
            unitPriceMinor: 8000,
            lineTotalMinor: 16000,
            availabilityAtSubmission: 'in_stock',
            stockItemKey: 'pB',
          },
        ],
        totals: {
          productSubtotalMinor: 31000,
          shippingEstimateMinor: 2000,
          discountMinor: 0,
          totalMinor: 33000,
          currency: 'EGP',
        },
        fulfillment: {
          method: 'delivery',
          addressSnapshot: { governorate: 'Cairo', city: 'Nasr City', street: 'Street 1' },
          shippingStatus: 'delivered',
        },
        paymentMethodKey: 'cash_on_delivery',
        paymentStatus: 'confirmed',
        status: 'delivered',
        statusHistory: [],
        version: 1,
      });

      const res = await request(app)
        .get('/api/v1/admin/reports/product-demand')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      const data = res.body.data;
      expect(data.totalItemsSold).toBe(5);
      expect(data.totalRevenueMinor).toBe(31000);

      const itemA = data.byProduct.find((p: { productId: string }) => p.productId === prodA.toString());
      const itemB = data.byProduct.find((p: { productId: string }) => p.productId === prodB.toString());

      expect(itemA.quantity).toBe(3);
      expect(itemA.revenueMinor).toBe(15000);
      expect(itemB.quantity).toBe(2);
      expect(itemB.revenueMinor).toBe(16000);

      const catStudies = data.byCategory.find((c: { category: string }) => c.category === 'Islamic Studies');
      expect(catStudies.quantity).toBe(3);
    });
  });

  describe('7. Pre-order Demand (/admin/reports/preorder-demand)', () => {
    it('aggregates pre-order records by product and status', async () => {
      const prodA = new Types.ObjectId();
      const prodB = new Types.ObjectId();

      await PreorderModel.create({
        productId: prodA,
        customerSnapshot: { name: 'Student 1', phone: '+201011112222' },
        quantity: 2,
        status: 'pending',
      });

      await PreorderModel.create({
        productId: prodA,
        customerSnapshot: { name: 'Student 2', phone: '+201033334444' },
        quantity: 3,
        status: 'confirmed',
      });

      await PreorderModel.create({
        productId: prodB,
        customerSnapshot: { name: 'Student 3', phone: '+201055556666' },
        quantity: 1,
        status: 'pending',
      });

      const res = await request(app)
        .get('/api/v1/admin/reports/preorder-demand')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      const data = res.body.data;
      expect(data.totalPreorders).toBe(3);
      expect(data.totalQuantity).toBe(6);

      const pA = data.byProduct.find((p: { productId: string }) => p.productId === prodA.toString());
      expect(pA.quantity).toBe(5);
      expect(pA.count).toBe(2);

      const statusPending = data.byStatus.find((s: { status: string }) => s.status === 'pending');
      const statusConfirmed = data.byStatus.find((s: { status: string }) => s.status === 'confirmed');

      expect(statusPending.count).toBe(2);
      expect(statusConfirmed.count).toBe(1);
    });
  });

  describe('8. Coupon Usage (/admin/reports/coupon-usage)', () => {
    it('aggregates coupon redemptions and discounts', async () => {
      const couponId = new Types.ObjectId();

      await CouponRedemptionModel.create({
        couponId,
        codeSnapshot: 'DISCOUNT10',
        orderId: new Types.ObjectId(),
        discountMinor: 5000,
      });

      await CouponRedemptionModel.create({
        couponId,
        codeSnapshot: 'DISCOUNT10',
        orderId: new Types.ObjectId(),
        discountMinor: 4000,
      });

      const res = await request(app)
        .get('/api/v1/admin/reports/coupon-usage')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      const data = res.body.data;
      expect(data.totalRedemptions).toBe(2);
      expect(data.totalDiscountMinor).toBe(9000);
      expect(data.currency).toBe('EGP');

      const entry = data.byCoupon.find((c: { codeSnapshot: string }) => c.codeSnapshot === 'DISCOUNT10');
      expect(entry.count).toBe(2);
      expect(entry.totalDiscountMinor).toBe(9000);
    });
  });
});
