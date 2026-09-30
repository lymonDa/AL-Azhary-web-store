import request from 'supertest';
import { app } from '../../src/app';
import { startTestDb, stopTestDb, clearTestDb } from '../helpers/test-db';
import { UserModel } from '../../src/modules/users/models/user.model';
import { ServiceCategoryModel } from '../../src/modules/services/models/service-category.model';
import { ServiceRequestModel } from '../../src/modules/services/models/service-request.model';
import { PaymentModel } from '../../src/modules/payments/models/payment.model';
import { passwordService } from '../../src/modules/auth/services/password.service';
import { rolesService } from '../../src/modules/users/services/roles.service';
import { ErrorCodes } from '../../src/common/errors/errorCodes';

describe('Phase 11 Quotations API Tests (/api/v1/admin/service-requests & /api/v1/service-requests)', () => {
  let customerToken: string;
  let otherCustomerToken: string;
  let adminToken: string;
  let staffToken: string;

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

    // Customer 1
    await UserModel.create({
      name: 'Customer One',
      email: 'customer1@example.com',
      phone: '+201011112222',
      passwordHash,
      role: 'customer',
      status: 'active',
      emailVerifiedAt: new Date(),
      refreshTokenVersion: 0,
    });

    // Customer 2
    await UserModel.create({
      name: 'Customer Two',
      email: 'customer2@example.com',
      phone: '+201033334444',
      passwordHash,
      role: 'customer',
      status: 'active',
      emailVerifiedAt: new Date(),
      refreshTokenVersion: 0,
    });

    // Admin (has services.quote)
    await UserModel.create({
      name: 'Admin Quoter',
      email: 'admin@example.com',
      phone: '+201055556666',
      passwordHash,
      role: 'admin',
      status: 'active',
      emailVerifiedAt: new Date(),
      refreshTokenVersion: 0,
    });

    // Customer role lacking services.quote
    await UserModel.create({
      name: 'Plain Customer',
      email: 'customer.noquote@example.com',
      phone: '+201077778888',
      passwordHash,
      role: 'customer',
      status: 'active',
      emailVerifiedAt: new Date(),
      refreshTokenVersion: 0,
    });

    const loginCustomer = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'customer1@example.com', password: 'Password123!' });
    customerToken = loginCustomer.body.data.accessToken;

    const loginOther = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'customer2@example.com', password: 'Password123!' });
    otherCustomerToken = loginOther.body.data.accessToken;

    const loginAdmin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@example.com', password: 'Password123!' });
    adminToken = loginAdmin.body.data.accessToken;

    const loginStaff = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'customer.noquote@example.com', password: 'Password123!' });
    staffToken = loginStaff.body.data.accessToken;

    // Seed test category
    await ServiceCategoryModel.create({
      slug: 'printing',
      name: { ar: 'خدمات الطباعة', en: 'Printing Services' },
      description: { ar: 'طباعة المستندات', en: 'Document printing' },
      kind: 'printing',
      isActive: true,
      formVersion: 1,
      codAllowed: false, // OD-14 pending/false
      fields: [
        {
          key: 'paperCount',
          label: { ar: 'عدد الصفحات', en: 'Page Count' },
          type: 'number',
          required: true,
        },
      ],
    });
  });

  describe('POST /api/v1/admin/service-requests/:reference/quotes', () => {
    it('creates a quotation and transitions service request to quotation_sent', async () => {
      // 1. Customer creates request
      const createRes = await request(app)
        .post('/api/v1/services/printing/requests')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          description: 'Need 10 pages printed',
          submittedFields: { paperCount: 10 },
        });
      expect(createRes.status).toBe(201);
      const reference = createRes.body.data.serviceRequest.reference;

      // 2. Admin creates quote
      const quoteRes = await request(app)
        .post(`/api/v1/admin/service-requests/${reference}/quotes`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          amountMinor: 5000, // 50.00 EGP
          currency: 'EGP',
          note: 'Includes binding and standard paper',
        });

      expect(quoteRes.status).toBe(201);
      expect(quoteRes.body.success).toBe(true);
      expect(quoteRes.body.data.quotation.amountMinor).toBe(5000);
      expect(quoteRes.body.data.quotation.currency).toBe('EGP');
      expect(quoteRes.body.data.quotation.status).toBe('sent');
      expect(quoteRes.body.data.quotation.version).toBe(1);

      // Verify Service Request updated status and quotationId
      const updatedReq = await ServiceRequestModel.findOne({ reference });
      expect(updatedReq?.status).toBe('quotation_sent');
      expect(updatedReq?.quotationId).toBeDefined();
    });

    it('rejects quote creation if caller lacks services.quote permission', async () => {
      const createRes = await request(app)
        .post('/api/v1/services/printing/requests')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          description: 'Need pages',
          submittedFields: { paperCount: 5 },
        });
      const reference = createRes.body.data.serviceRequest.reference;

      const quoteRes = await request(app)
        .post(`/api/v1/admin/service-requests/${reference}/quotes`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          amountMinor: 2500,
          currency: 'EGP',
        });

      expect(quoteRes.status).toBe(403);
    });

    it('rejects non-integer / negative amounts and unsupported currencies', async () => {
      const createRes = await request(app)
        .post('/api/v1/services/printing/requests')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          description: 'Need pages',
          submittedFields: { paperCount: 5 },
        });
      const reference = createRes.body.data.serviceRequest.reference;

      // Negative amount
      const resNeg = await request(app)
        .post(`/api/v1/admin/service-requests/${reference}/quotes`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          amountMinor: -500,
          currency: 'EGP',
        });
      expect(resNeg.status).toBe(400);

      // Unsupported currency
      const resCurr = await request(app)
        .post(`/api/v1/admin/service-requests/${reference}/quotes`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          amountMinor: 500,
          currency: 'USD',
        });
      expect(resCurr.status).toBe(400);
    });
  });

  describe('POST /api/v1/service-requests/:reference/quotation/accept', () => {
    it('customer accepts quotation, transitions request to awaiting_payment, and creates payment', async () => {
      // 1. Create request
      const createRes = await request(app)
        .post('/api/v1/services/printing/requests')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          description: 'Thesis printing',
          submittedFields: { paperCount: 100 },
        });
      const reference = createRes.body.data.serviceRequest.reference;

      // 2. Admin quotes
      const quoteRes = await request(app)
        .post(`/api/v1/admin/service-requests/${reference}/quotes`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          amountMinor: 15000, // 150.00 EGP
          currency: 'EGP',
        });
      expect(quoteRes.status).toBe(201);

      // 3. Customer accepts quotation
      const acceptRes = await request(app)
        .post(`/api/v1/service-requests/${reference}/quotation/accept`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          expectedVersion: 1,
        });

      expect(acceptRes.status).toBe(200);
      expect(acceptRes.body.success).toBe(true);
      expect(acceptRes.body.data.quotation.status).toBe('accepted');
      expect(acceptRes.body.data.quotation.version).toBe(2);
      expect(acceptRes.body.data.serviceRequest.status).toBe('awaiting_payment');
      expect(acceptRes.body.data.payment).toBeDefined();
      expect(acceptRes.body.data.payment.amountDueMinor).toBe(15000);
      expect(acceptRes.body.data.payment.currency).toBe('EGP');
      expect(acceptRes.body.data.payment.ownerType).toBe('serviceQuotation');

      // Verify Database state
      const dbRequest = await ServiceRequestModel.findOne({ reference });
      expect(dbRequest?.status).toBe('awaiting_payment');
      expect(dbRequest?.paymentId).toBeDefined();

      const dbPayment = await PaymentModel.findById(dbRequest?.paymentId);
      expect(dbPayment?.amountDueMinor).toBe(15000);
      expect(dbPayment?.status).toBe('not_submitted');
    });

    it('denies another customer from accepting the quotation', async () => {
      // Customer 1 request
      const createRes = await request(app)
        .post('/api/v1/services/printing/requests')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          description: 'Thesis',
          submittedFields: { paperCount: 50 },
        });
      const reference = createRes.body.data.serviceRequest.reference;

      // Admin quotes
      await request(app)
        .post(`/api/v1/admin/service-requests/${reference}/quotes`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          amountMinor: 8000,
          currency: 'EGP',
        });

      // Customer 2 tries to accept
      const acceptRes = await request(app)
        .post(`/api/v1/service-requests/${reference}/quotation/accept`)
        .set('Authorization', `Bearer ${otherCustomerToken}`)
        .send({
          expectedVersion: 1,
        });

      expect(acceptRes.status).toBe(403);
      expect(acceptRes.body.error.code).toBe(ErrorCodes.QUOTATION_OWNERSHIP_DENIED);
    });

    it('rejects acceptance if quotation version does not match expectedVersion (QUOTE_STATE_CONFLICT)', async () => {
      const createRes = await request(app)
        .post('/api/v1/services/printing/requests')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          description: 'Thesis',
          submittedFields: { paperCount: 50 },
        });
      const reference = createRes.body.data.serviceRequest.reference;

      await request(app)
        .post(`/api/v1/admin/service-requests/${reference}/quotes`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          amountMinor: 8000,
          currency: 'EGP',
        });

      // Stale expectedVersion: 99
      const acceptRes = await request(app)
        .post(`/api/v1/service-requests/${reference}/quotation/accept`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          expectedVersion: 99,
        });

      expect(acceptRes.status).toBe(409);
      expect(acceptRes.body.error.code).toBe(ErrorCodes.QUOTE_STATE_CONFLICT);
    });

    it('is idempotent on repeated identical accept requests and does not duplicate payments', async () => {
      const createRes = await request(app)
        .post('/api/v1/services/printing/requests')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          description: 'Thesis',
          submittedFields: { paperCount: 50 },
        });
      const reference = createRes.body.data.serviceRequest.reference;

      await request(app)
        .post(`/api/v1/admin/service-requests/${reference}/quotes`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          amountMinor: 8000,
          currency: 'EGP',
        });

      // 1st Accept
      const acceptRes1 = await request(app)
        .post(`/api/v1/service-requests/${reference}/quotation/accept`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({});
      expect(acceptRes1.status).toBe(200);

      // 2nd Accept
      const acceptRes2 = await request(app)
        .post(`/api/v1/service-requests/${reference}/quotation/accept`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({});
      expect(acceptRes2.status).toBe(200);
      expect(acceptRes2.body.data.quotation.status).toBe('accepted');

      // Verify exactly ONE payment document was created
      const payments = await PaymentModel.find({ ownerType: 'serviceQuotation' });
      expect(payments.length).toBe(1);
    });

    it('rejects COD payment method for service requests under OD-14', async () => {
      const createRes = await request(app)
        .post('/api/v1/services/printing/requests')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          description: 'Thesis',
          submittedFields: { paperCount: 50 },
        });
      const reference = createRes.body.data.serviceRequest.reference;

      await request(app)
        .post(`/api/v1/admin/service-requests/${reference}/quotes`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          amountMinor: 8000,
          currency: 'EGP',
        });

      const acceptRes = await request(app)
        .post(`/api/v1/service-requests/${reference}/quotation/accept`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          paymentMethodKey: 'cod',
        });

      expect(acceptRes.status).toBe(422);
      expect(acceptRes.body.error.code).toBe(ErrorCodes.UNSUPPORTED_SERVICE_PAYMENT_METHOD);
    });
  });

  describe('POST /api/v1/service-requests/:reference/quotation/reject', () => {
    it('customer rejects quotation, transitions request to closed_not_proceeding, and creates NO payment', async () => {
      const createRes = await request(app)
        .post('/api/v1/services/printing/requests')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          description: 'Thesis',
          submittedFields: { paperCount: 50 },
        });
      const reference = createRes.body.data.serviceRequest.reference;

      await request(app)
        .post(`/api/v1/admin/service-requests/${reference}/quotes`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          amountMinor: 20000,
          currency: 'EGP',
        });

      const rejectRes = await request(app)
        .post(`/api/v1/service-requests/${reference}/quotation/reject`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          note: 'Price is too high for my budget',
          expectedVersion: 1,
        });

      expect(rejectRes.status).toBe(200);
      expect(rejectRes.body.success).toBe(true);
      expect(rejectRes.body.data.quotation.status).toBe('rejected');
      expect(rejectRes.body.data.serviceRequest.status).toBe('closed_not_proceeding');

      // Database verification
      const dbRequest = await ServiceRequestModel.findOne({ reference });
      expect(dbRequest?.status).toBe('closed_not_proceeding');
      expect(dbRequest?.closedReason).toBe('Price is too high for my budget');
      expect(dbRequest?.paymentId).toBeFalsy();

      const dbPayments = await PaymentModel.find({ ownerType: 'serviceQuotation' });
      expect(dbPayments.length).toBe(0);
    });

    it('rejects attempt to accept an already rejected quotation with QUOTATION_ALREADY_DECIDED', async () => {
      const createRes = await request(app)
        .post('/api/v1/services/printing/requests')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          description: 'Thesis',
          submittedFields: { paperCount: 50 },
        });
      const reference = createRes.body.data.serviceRequest.reference;

      await request(app)
        .post(`/api/v1/admin/service-requests/${reference}/quotes`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          amountMinor: 20000,
          currency: 'EGP',
        });

      // Reject first
      await request(app)
        .post(`/api/v1/service-requests/${reference}/quotation/reject`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({});

      // Try accept
      const acceptRes = await request(app)
        .post(`/api/v1/service-requests/${reference}/quotation/accept`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({});

      expect(acceptRes.status).toBe(409);
      expect(acceptRes.body.error.code).toBe(ErrorCodes.QUOTATION_ALREADY_DECIDED);
    });
  });
});
