import request from 'supertest';
import { app } from '../../src/app';
import { startTestDb, stopTestDb, clearTestDb } from '../helpers/test-db';
import { ServiceCategoryModel } from '../../src/modules/services/models/service-category.model';
import { cloudinaryService } from '../../src/integrations/cloudinary';
import { rolesService } from '../../src/modules/users/services/roles.service';

describe('Phase 17 — Media Security & Service Attachment Protection', () => {
  beforeAll(async () => {
    await startTestDb();
  });

  afterAll(async () => {
    await stopTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();
    await rolesService.ensureSystemRoles();

    await ServiceCategoryModel.create({
      name: { ar: 'تنسيق أبحاث', en: 'Research Formatting' },
      slug: 'research-formatting',
      description: { ar: 'خدمة تنسيق الأبحاث والرسائل' },
      kind: 'research_formatting',
      formVersion: 1,
      fields: [],
      isActive: true,
    });
  });

  it('strictly rejects service requests containing file attachments (ATTACHMENT_NOT_ALLOWED)', async () => {
    // Attempt 1: fileUrl field
    const resFileUrl = await request(app)
      .post('/api/v1/services/research-formatting/requests')
      .send({
        description: 'Thesis formatting',
        contact: { name: 'Student', phone: '01011112222' },
        fileUrl: 'https://attacker.com/malicious.pdf',
      });

    expect(resFileUrl.status).toBe(400);
    expect(resFileUrl.body.error.code).toBe('ATTACHMENT_NOT_ALLOWED');

    // Attempt 2: cloudinaryPublicId in submittedFields
    const resCloudinary = await request(app)
      .post('/api/v1/services/research-formatting/requests')
      .send({
        description: 'Thesis formatting',
        contact: { name: 'Student', phone: '01011112222' },
        submittedFields: {
          cloudinaryPublicId: 'al-azhari/services/thesis_123',
        },
      });

    expect(resCloudinary.status).toBe(400);
    expect(resCloudinary.body.error.code).toBe('ATTACHMENT_NOT_ALLOWED');

    // Attempt 3: Base64 file payload
    const resBase64 = await request(app)
      .post('/api/v1/services/research-formatting/requests')
      .send({
        description: 'Thesis formatting',
        contact: { name: 'Student', phone: '01011112222' },
        submittedFields: {
          data: 'data:application/pdf;base64,JVBERi0xLjQKJ...',
        },
      });

    expect(resBase64.status).toBe(400);
    expect(resBase64.body.error.code).toBe('ATTACHMENT_NOT_ALLOWED');
  });

  it('validates payment proof file metadata and rejects invalid types, formats, or oversized files', () => {
    // 1. Rejects wrong folder
    expect(() => {
      cloudinaryService.validatePaymentProofFile({
        cloudinaryPublicId: 'wrong-folder/proof_123',
        resourceType: 'image',
        format: 'png',
        bytes: 1024,
      });
    }).toThrow('Payment proof file must be uploaded to the dedicated folder');

    // 2. Rejects non-image resource types (e.g. raw, video)
    expect(() => {
      cloudinaryService.validatePaymentProofFile({
        cloudinaryPublicId: 'al-azhari/payment-proofs/proof_123',
        resourceType: 'raw',
        format: 'pdf',
        bytes: 1024,
      });
    }).toThrow('Only image resource types are permitted');

    // 3. Rejects executable or disallowed format
    expect(() => {
      cloudinaryService.validatePaymentProofFile({
        cloudinaryPublicId: 'al-azhari/payment-proofs/proof_123',
        resourceType: 'image',
        format: 'exe',
        bytes: 1024,
      });
    }).toThrow('Unsupported image format');

    // 4. Rejects file exceeding 10MB
    expect(() => {
      cloudinaryService.validatePaymentProofFile({
        cloudinaryPublicId: 'al-azhari/payment-proofs/proof_123',
        resourceType: 'image',
        format: 'png',
        bytes: 11 * 1024 * 1024,
      });
    }).toThrow('File size must be positive and not exceed 10MB');
  });

  it('generates short-lived signed URLs for proof review and never leaks API secrets', () => {
    const config = cloudinaryService.generatePaymentProofUploadConfig({
      orderReference: 'ORD-20260930-A1B2C3',
    });

    expect(config.signature).toBeDefined();
    expect(config.folder).toBe('al-azhari/payment-proofs');
    // Secret must NOT be returned in upload config
    expect(((config as unknown) as Record<string, unknown>).apiSecret).toBeUndefined();

    const signedUrlData = cloudinaryService.generatePrivateDownloadUrl(
      'al-azhari/payment-proofs/proof_abc',
      'png',
      300,
    );
    expect(signedUrlData.signedUrl).toBeDefined();
    expect(signedUrlData.expiresAt.getTime()).toBeGreaterThan(Date.now());
  });
});
