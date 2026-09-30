import request from 'supertest';
import { app } from '../../src/app';
import { startTestDb, stopTestDb, clearTestDb } from '../helpers/test-db';
import { UserModel } from '../../src/modules/users/models/user.model';
import { ServiceCategoryModel } from '../../src/modules/services/models/service-category.model';
import { ServiceRequestModel } from '../../src/modules/services/models/service-request.model';
import { OutboxEventModel } from '../../src/modules/notifications/models/outbox-event.model';
import { AuditLogModel } from '../../src/modules/audit/models/audit-log.model';
import { passwordService } from '../../src/modules/auth/services/password.service';
import { rolesService } from '../../src/modules/users/services/roles.service';

describe('Phase 11 Services API Tests (/api/v1/services & /api/v1/service-requests)', () => {
  let customerToken: string;
  let customerId: string;
  let otherCustomerToken: string;
  let adminToken: string;

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

    // Primary Customer
    const customer = await UserModel.create({
      name: 'Ahmed Ali',
      email: 'ahmed@example.com',
      phone: '+201012345678',
      passwordHash,
      role: 'customer',
      status: 'active',
      emailVerifiedAt: new Date(),
      refreshTokenVersion: 0,
    });
    customerId = customer._id.toString();

    // Another Customer (for ownership isolation tests)
    await UserModel.create({
      name: 'Fatima Omar',
      email: 'fatima@example.com',
      phone: '+201098765432',
      passwordHash,
      role: 'customer',
      status: 'active',
      emailVerifiedAt: new Date(),
      refreshTokenVersion: 0,
    });

    // Admin
    await UserModel.create({
      name: 'Services Admin',
      email: 'admin@example.com',
      phone: '+201033334444',
      passwordHash,
      role: 'admin',
      status: 'active',
      emailVerifiedAt: new Date(),
      refreshTokenVersion: 0,
    });

    const loginCustomer = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'ahmed@example.com', password: 'Password123!' });
    customerToken = loginCustomer.body.data.accessToken;

    const loginOther = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'fatima@example.com', password: 'Password123!' });
    otherCustomerToken = loginOther.body.data.accessToken;

    const loginAdmin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@example.com', password: 'Password123!' });
    adminToken = loginAdmin.body.data.accessToken;

    // Seed test service categories
    await ServiceCategoryModel.create([
      {
        slug: 'printing',
        name: { ar: 'خدمات الطباعة', en: 'Printing Services' },
        description: { ar: 'طباعة المستندات', en: 'Document printing' },
        kind: 'printing',
        isActive: true,
        formVersion: 1,
        fields: [
          {
            key: 'paperColor',
            label: { ar: 'لون الورق', en: 'Paper Color' },
            type: 'select',
            required: true,
            options: ['white', 'colored'],
            active: true,
          },
          {
            key: 'copies',
            label: { ar: 'عدد النسخ', en: 'Copies' },
            type: 'number',
            required: false,
            active: true,
          },
        ],
        communicationChannels: ['whatsapp', 'telegram'],
        pricingMode: 'quotation',
      },
      {
        slug: 'archived-service',
        name: { ar: 'خدمة معطلة', en: 'Inactive Service' },
        kind: 'other_admin',
        isActive: false,
        formVersion: 1,
        fields: [],
        communicationChannels: ['whatsapp'],
        pricingMode: 'quotation',
      },
    ]);
  });

  describe('GET /api/v1/services (Public catalog)', () => {
    it('returns only active service categories', async () => {
      const res = await request(app).get('/api/v1/services');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.categories)).toBe(true);
      expect(res.body.data.categories.length).toBe(1);
      expect(res.body.data.categories[0].slug).toBe('printing');
    });
  });

  describe('GET /api/v1/services/:slug', () => {
    it('returns service category details and active form configuration', async () => {
      const res = await request(app).get('/api/v1/services/printing');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const cat = res.body.data.category;
      expect(cat.slug).toBe('printing');
      expect(cat.name.ar).toBe('خدمات الطباعة');
      expect(cat.formVersion).toBe(1);
      expect(cat.fields.length).toBe(2);
      expect(cat.fields[0].key).toBe('paperColor');
      expect(cat.fields[0].required).toBe(true);
    });

    it('returns 404 for unknown slug', async () => {
      const res = await request(app).get('/api/v1/services/non-existent-service');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('SERVICE_NOT_FOUND');
    });

    it('returns 404 for inactive service category', async () => {
      const res = await request(app).get('/api/v1/services/archived-service');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('SERVICE_NOT_FOUND');
    });
  });

  describe('POST /api/v1/services/:slug/requests', () => {
    it('guest creates a service request successfully and receives guestAccessToken', async () => {
      const res = await request(app)
        .post('/api/v1/services/printing/requests')
        .send({
          description: 'Need 10 copies printed in white paper',
          contact: {
            name: 'Guest Student',
            phone: '+201099998888',
            email: 'guest@example.com',
          },
          submittedFields: {
            paperColor: 'white',
            copies: 10,
          },
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.serviceRequest).toBeDefined();
      expect(res.body.data.serviceRequest.reference).toMatch(/^SRV-\d{8}-[A-F0-9]{6}$/);
      expect(res.body.data.serviceRequest.status).toBe('admin_review');
      expect(res.body.data.guestAccessToken).toBeDefined();

      // Check database record
      const dbReq = await ServiceRequestModel.findOne({
        reference: res.body.data.serviceRequest.reference,
      });
      expect(dbReq).toBeDefined();
      expect(dbReq!.customerId).toBeNull();
      expect(dbReq!.guestAccessTokenHash).toBeDefined();

      // Outbox side effect persisted
      const outbox = await OutboxEventModel.findOne({
        aggregateId: dbReq!._id.toString(),
        eventType: 'service_request.created',
      });
      expect(outbox).toBeDefined();

      // Audit log side effect persisted
      const audit = await AuditLogModel.findOne({
        entityId: dbReq!.reference,
        action: 'service_request_created',
      });
      expect(audit).toBeDefined();
    });

    it('registered customer creates service request with account snapshot', async () => {
      const res = await request(app)
        .post('/api/v1/services/printing/requests')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          description: 'Lecture notes print request',
          submittedFields: {
            paperColor: 'white',
          },
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.serviceRequest.customer.name).toBe('Ahmed Ali');
      expect(res.body.data.serviceRequest.customer.phone).toBe('+201012345678');

      const dbReq = await ServiceRequestModel.findOne({
        reference: res.body.data.serviceRequest.reference,
      });
      expect(dbReq!.customerId!.toString()).toBe(customerId);
    });

    it('rejects request missing a required configured field', async () => {
      const res = await request(app)
        .post('/api/v1/services/printing/requests')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          description: 'Missing paperColor',
          submittedFields: {},
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_SERVICE_FORM');
    });

    it('rejects unknown submitted fields not in configuration', async () => {
      const res = await request(app)
        .post('/api/v1/services/printing/requests')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          description: 'With invalid field',
          submittedFields: {
            paperColor: 'white',
            inventedField: 'unknown',
          },
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_SERVICE_FORM');
    });

    it('rejects field with invalid data type', async () => {
      const res = await request(app)
        .post('/api/v1/services/printing/requests')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          description: 'Bad type for copies',
          submittedFields: {
            paperColor: 'white',
            copies: 'ten', // should be number
          },
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_SERVICE_FORM');
    });

    // ─── Attachment Prohibition Tests ──────────────────────────────────────

    it('rejects root attachments field with ATTACHMENT_NOT_ALLOWED', async () => {
      const res = await request(app)
        .post('/api/v1/services/printing/requests')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          description: 'Printing with attachments',
          attachments: ['https://example.com/doc.pdf'],
          submittedFields: { paperColor: 'white' },
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('ATTACHMENT_NOT_ALLOWED');
    });

    it('rejects fileUrl field with ATTACHMENT_NOT_ALLOWED', async () => {
      const res = await request(app)
        .post('/api/v1/services/printing/requests')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          description: 'Printing with fileUrl',
          fileUrl: 'https://storage.googleapis.com/doc.pdf',
          submittedFields: { paperColor: 'white' },
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('ATTACHMENT_NOT_ALLOWED');
    });

    it('rejects Cloudinary public ID with ATTACHMENT_NOT_ALLOWED', async () => {
      const res = await request(app)
        .post('/api/v1/services/printing/requests')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          description: 'Printing with Cloudinary ID',
          cloudinaryPublicId: 'services/doc123',
          submittedFields: { paperColor: 'white' },
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('ATTACHMENT_NOT_ALLOWED');
    });

    it('rejects nested file field in submittedFields with ATTACHMENT_NOT_ALLOWED', async () => {
      const res = await request(app)
        .post('/api/v1/services/printing/requests')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          description: 'Printing with nested file',
          submittedFields: {
            paperColor: 'white',
            file: 'lecture.docx',
          },
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('ATTACHMENT_NOT_ALLOWED');
    });

    it('rejects base64 data string with ATTACHMENT_NOT_ALLOWED', async () => {
      const res = await request(app)
        .post('/api/v1/services/printing/requests')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          description: 'Printing with base64 payload',
          submittedFields: {
            paperColor: 'white',
            documentData: 'data:application/pdf;base64,JVBERi0xLjQKJ...',
          },
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('ATTACHMENT_NOT_ALLOWED');
    });

    it('rejects multipart/form-data content-type with ATTACHMENT_NOT_ALLOWED', async () => {
      const res = await request(app)
        .post('/api/v1/services/printing/requests')
        .set('Authorization', `Bearer ${customerToken}`)
        .set('Content-Type', 'multipart/form-data; boundary=----WebKitFormBoundary')
        .send('------WebKitFormBoundary\r\nContent-Disposition: form-data; name="description"\r\n\r\nTest\r\n------WebKitFormBoundary--');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('ATTACHMENT_NOT_ALLOWED');
    });

    it('rejects submission for inactive service category', async () => {
      const res = await request(app)
        .post('/api/v1/services/archived-service/requests')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          description: 'Request for inactive service',
        });

      expect([400, 422]).toContain(res.status);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('SERVICE_INACTIVE');
    });
  });

  describe('GET /api/v1/service-requests/:reference', () => {
    let customerRef: string;
    let guestRef: string;
    let guestToken: string;

    beforeEach(async () => {
      const createCust = await request(app)
        .post('/api/v1/services/printing/requests')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          description: 'Customer print request',
          submittedFields: { paperColor: 'white' },
        });
      customerRef = createCust.body.data.serviceRequest.reference;

      const createGuest = await request(app)
        .post('/api/v1/services/printing/requests')
        .send({
          description: 'Guest print request',
          contact: { name: 'Guest User', phone: '+201011112222' },
          submittedFields: { paperColor: 'white' },
        });
      guestRef = createGuest.body.data.serviceRequest.reference;
      guestToken = createGuest.body.data.guestAccessToken;
    });

    it('customer retrieves their own request successfully', async () => {
      const res = await request(app)
        .get(`/api/v1/service-requests/${customerRef}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.serviceRequest.reference).toBe(customerRef);
      expect(res.body.data.serviceRequest.status).toBe('admin_review');
    });

    it('denies customer from retrieving another customer request', async () => {
      const res = await request(app)
        .get(`/api/v1/service-requests/${customerRef}`)
        .set('Authorization', `Bearer ${otherCustomerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('SERVICE_OWNERSHIP_DENIED');
    });

    it('guest retrieves own request via X-Guest-Token header', async () => {
      const res = await request(app)
        .get(`/api/v1/service-requests/${guestRef}`)
        .set('X-Guest-Token', guestToken);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.serviceRequest.reference).toBe(guestRef);
    });

    it('denies guest request with invalid token', async () => {
      const res = await request(app)
        .get(`/api/v1/service-requests/${guestRef}`)
        .set('X-Guest-Token', 'invalid-token-123');

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('SERVICE_OWNERSHIP_DENIED');
    });

    it('admin can retrieve any service request', async () => {
      const res = await request(app)
        .get(`/api/v1/service-requests/${customerRef}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.serviceRequest.reference).toBe(customerRef);
    });
  });
});
