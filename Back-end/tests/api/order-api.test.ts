import request from 'supertest';
import { app } from '../../src/app';
import { startTestDb, stopTestDb, clearTestDb } from '../helpers/test-db';
import { UserModel } from '../../src/modules/users/models/user.model';
import { CategoryModel } from '../../src/modules/categories/models/category.model';
import { ProductModel } from '../../src/modules/products/models/product.model';
import { CartModel } from '../../src/modules/carts/models/cart.model';
import { ShippingRuleModel } from '../../src/modules/shipping/models/shipping-rule.model';
import { passwordService } from '../../src/modules/auth/services/password.service';
import { rolesService } from '../../src/modules/users/services/roles.service';

describe('Public & Customer Order API (/api/v1/orders & /api/v1/checkout)', () => {
  let customerAToken: string;
  let customerBToken: string;
  let customerAId: string;
  let productId: string;

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

    // Customer A
    const userA = await UserModel.create({
      name: 'Customer A',
      email: 'customera@example.com',
      phone: '+201011112222',
      passwordHash,
      role: 'customer',
      status: 'active',
      emailVerifiedAt: new Date(),
      refreshTokenVersion: 0,
    });
    customerAId = userA._id.toString();

    // Customer B
    await UserModel.create({
      name: 'Customer B',
      email: 'customerb@example.com',
      phone: '+201033334444',
      passwordHash,
      role: 'customer',
      status: 'active',
      emailVerifiedAt: new Date(),
      refreshTokenVersion: 0,
    });

    const loginResA = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'customera@example.com', password: 'Password123!' });
    customerAToken = loginResA.body.data.accessToken;

    const loginResB = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'customerb@example.com', password: 'Password123!' });
    customerBToken = loginResB.body.data.accessToken;

    const cat = await CategoryModel.create({
      slug: 'quran-sciences',
      name: { ar: 'علوم القرآن' },
      isBooksCore: true,
      isActive: true,
      displayOrder: 1,
    });

    const prod = await ProductModel.create({
      slug: 'itqan-fi-ulum-al-quran',
      name: { ar: 'الإتقان في علوم القرآن' },
      categoryId: cat._id,
      availability: 'in_stock',
      priceMinor: 20000,
      hasVariants: false,
      stockTotal: 10,
      stockReserved: 0,
      inventoryVersion: 0,
      isPublished: true,
      displayOrder: 1,
    });
    productId = prod._id.toString();

    await ShippingRuleModel.create({
      governorate: null,
      city: null,
      area: null,
      costMinor: 3500,
      priority: 0,
      isActive: true,
      serviceable: true,
      label: { ar: 'شحن عام' },
    });
  });

  describe('POST /api/v1/checkout/shipping-estimate', () => {
    it('returns pickup estimate (0 EGP) and library location', async () => {
      const res = await request(app)
        .post('/api/v1/checkout/shipping-estimate')
        .send({ method: 'pickup' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.costMinor).toBe(0);
      expect(res.body.data.scope).toBe('pickup');
      expect(res.body.data.pickupLocation).toBeDefined();
    });

    it('returns delivery shipping estimate for valid address', async () => {
      const res = await request(app)
        .post('/api/v1/checkout/shipping-estimate')
        .send({
          method: 'delivery',
          governorate: 'Cairo',
          city: 'Nasr City',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.costMinor).toBe(3500);
      expect(res.body.data.serviceable).toBe(true);
    });
  });

  describe('POST /api/v1/orders & GET /api/v1/orders/:reference', () => {
    it('Guest flow: creates order with guest session, returns guestAccessToken, and enforces token on GET', async () => {
      const guestSessionId = 'guest_api_session_1';

      // Setup guest cart
      await CartModel.create({
        ownerType: 'guest',
        sessionId: guestSessionId,
        items: [{ productId, quantity: 1, unitPriceMinor: 20000, productNameSnapshot: { ar: 'الإتقان' } }],
        version: 1,
      });

      // 1. Create Guest Order
      const createRes = await request(app)
        .post('/api/v1/orders')
        .set('x-guest-session-id', guestSessionId)
        .send({
          contact: { name: 'زائر', phone: '01012345678' },
          fulfillment: { method: 'pickup' },
          paymentMethodKey: 'cod',
          idempotencyKey: 'idem_api_guest_1',
        });

      expect(createRes.status).toBe(201);
      expect(createRes.body.success).toBe(true);
      const orderData = createRes.body.data;
      expect(orderData.reference).toBeDefined();
      expect(orderData.guestAccessToken).toBeDefined();
      const guestToken = orderData.guestAccessToken;

      // Safe DTO check: No raw token hash or DB _id leaked
      expect(orderData.guestAccessTokenHash).toBeUndefined();
      expect(orderData._id).toBeUndefined();

      // 2. GET order WITH valid guest token header -> 200
      const getResWithToken = await request(app)
        .get(`/api/v1/orders/${orderData.reference}`)
        .set('x-guest-token', guestToken);

      expect(getResWithToken.status).toBe(200);
      expect(getResWithToken.body.data.reference).toBe(orderData.reference);

      // 3. GET order WITHOUT guest token -> 403 Forbidden
      const getResNoToken = await request(app).get(`/api/v1/orders/${orderData.reference}`);
      expect(getResNoToken.status).toBe(403);

      // 4. GET order WITH invalid guest token -> 403 Forbidden
      const getResBadToken = await request(app)
        .get(`/api/v1/orders/${orderData.reference}`)
        .set('x-guest-token', 'wrong_token_12345');
      expect(getResBadToken.status).toBe(403);
    });

    it('CRITICAL GUEST SECURITY TEST: cross-guest token access is strictly rejected', async () => {
      const guestSession1 = 'guest_security_sess_1';
      const guestSession2 = 'guest_security_sess_2';

      await CartModel.create({
        ownerType: 'guest',
        sessionId: guestSession1,
        items: [{ productId, quantity: 1, unitPriceMinor: 20000, productNameSnapshot: { ar: 'الإتقان' } }],
        version: 1,
      });

      await CartModel.create({
        ownerType: 'guest',
        sessionId: guestSession2,
        items: [{ productId, quantity: 1, unitPriceMinor: 20000, productNameSnapshot: { ar: 'الإتقان' } }],
        version: 1,
      });

      // 1. Create Guest Order A
      const resA = await request(app)
        .post('/api/v1/orders')
        .set('x-guest-session-id', guestSession1)
        .send({
          contact: { name: 'Guest A', phone: '01011110000' },
          fulfillment: { method: 'pickup' },
          paymentMethodKey: 'cod',
          idempotencyKey: 'idem_sec_guest_a',
        });
      const orderA = resA.body.data;
      const tokenA = orderA.guestAccessToken;

      // 2. Create Guest Order B
      const resB = await request(app)
        .post('/api/v1/orders')
        .set('x-guest-session-id', guestSession2)
        .send({
          contact: { name: 'Guest B', phone: '01022220000' },
          fulfillment: { method: 'pickup' },
          paymentMethodKey: 'cod',
          idempotencyKey: 'idem_sec_guest_b',
        });
      const orderB = resB.body.data;
      const tokenB = orderB.guestAccessToken;

      // Token A can read Order A
      const getA = await request(app)
        .get(`/api/v1/orders/${orderA.reference}`)
        .set('x-guest-token', tokenA);
      expect(getA.status).toBe(200);

      // Token B attempting to read Order A -> 403 Forbidden
      const getAWithTokenB = await request(app)
        .get(`/api/v1/orders/${orderA.reference}`)
        .set('x-guest-token', tokenB);
      expect(getAWithTokenB.status).toBe(403);

      // Token A attempting to read Order B -> 403 Forbidden
      const getBWithTokenA = await request(app)
        .get(`/api/v1/orders/${orderB.reference}`)
        .set('x-guest-token', tokenA);
      expect(getBWithTokenA.status).toBe(403);

      // Request without guest token -> 403 Forbidden
      const getNoToken = await request(app).get(`/api/v1/orders/${orderA.reference}`);
      expect(getNoToken.status).toBe(403);
    });

    it('Registered Customer flow: creates order and enforces customer ownership on GET', async () => {
      await CartModel.create({
        ownerType: 'user',
        userId: customerAId,
        items: [{ productId, quantity: 1, unitPriceMinor: 20000, productNameSnapshot: { ar: 'الإتقان' } }],
        version: 1,
      });

      // 1. Customer A creates order
      const createRes = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${customerAToken}`)
        .send({
          contact: { name: 'Customer A', phone: '01011112222' },
          fulfillment: { method: 'pickup' },
          paymentMethodKey: 'instapay',
          idempotencyKey: 'idem_api_customer_a',
        });

      expect(createRes.status).toBe(201);
      const reference = createRes.body.data.reference;

      // 2. Customer A accesses their own order -> 200
      const getResA = await request(app)
        .get(`/api/v1/orders/${reference}`)
        .set('Authorization', `Bearer ${customerAToken}`);
      expect(getResA.status).toBe(200);
      expect(getResA.body.data.reference).toBe(reference);

      // 3. Customer B attempts to access Customer A's order -> 403 Forbidden
      const getResB = await request(app)
        .get(`/api/v1/orders/${reference}`)
        .set('Authorization', `Bearer ${customerBToken}`);
      expect(getResB.status).toBe(403);
    });
  });

  describe('PATCH & CANCEL /api/v1/orders/:reference', () => {
    it('allows customer to edit pending_review order and cancel it', async () => {
      await CartModel.create({
        ownerType: 'user',
        userId: customerAId,
        items: [{ productId, quantity: 1, unitPriceMinor: 20000, productNameSnapshot: { ar: 'الإتقان' } }],
        version: 1,
      });

      const createRes = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${customerAToken}`)
        .send({
          contact: { name: 'أحمد', phone: '01011112222' },
          fulfillment: { method: 'pickup' },
          paymentMethodKey: 'cod',
          idempotencyKey: 'idem_api_edit_cancel',
        });

      const reference = createRes.body.data.reference;

      // 1. Customer A edits pending order
      const patchRes = await request(app)
        .patch(`/api/v1/orders/${reference}`)
        .set('Authorization', `Bearer ${customerAToken}`)
        .send({
          contact: { name: 'أحمد الجديد', phone: '01099998888' },
          expectedVersion: 1,
        });

      expect(patchRes.status).toBe(200);
      expect(patchRes.body.data.customerSnapshot.name).toBe('أحمد الجديد');
      expect(patchRes.body.data.version).toBe(2);

      // 2. Customer A cancels order
      const cancelRes = await request(app)
        .post(`/api/v1/orders/${reference}/cancel`)
        .set('Authorization', `Bearer ${customerAToken}`)
        .send({
          expectedVersion: 2,
          reason: 'Cancelled by user',
        });

      expect(cancelRes.status).toBe(200);
      expect(cancelRes.body.data.status).toBe('cancelled');
      expect(cancelRes.body.data.version).toBe(3);
    });
  });
});
