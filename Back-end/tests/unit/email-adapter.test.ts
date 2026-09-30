import { emailService } from '../../src/integrations/email/email.service';
import { renderEmailTemplate } from '../../src/integrations/email/email.templates';
import { EmailTemplate } from '../../src/integrations/email/email.types';
import { ErrorCodes } from '../../src/common/errors/errorCodes';

describe('Phase 13 Email Adapter Unit Tests', () => {
  beforeEach(() => {
    emailService.clearSentEmails();
  });

  it('renders all 5 email templates in Arabic and English', () => {
    const templates: EmailTemplate[] = [
      'verify_email',
      'password_reset',
      'order_confirmation',
      'payment_update',
      'service_update',
    ];

    const testVars = {
      name: 'Ahmed',
      verificationUrl: 'https://al-azhari.com/verify?token=123',
      resetUrl: 'https://al-azhari.com/reset?token=abc',
      orderReference: 'ORD-20260930-ABCDEF',
      totalFormatted: '150.00',
      currency: 'EGP',
      status: 'confirmed',
      note: 'Payment verified',
      serviceReference: 'SRV-20260930-123456',
      details: 'Processing started',
    };

    for (const template of templates) {
      const ar = renderEmailTemplate(template, 'ar', testVars);
      expect(ar.subject).toBeTruthy();
      expect(ar.text).toBeTruthy();
      expect(ar.html).toBeTruthy();

      const en = renderEmailTemplate(template, 'en', testVars);
      expect(en.subject).toBeTruthy();
      expect(en.text).toBeTruthy();
      expect(en.html).toBeTruthy();
    }
  });

  it('sends email successfully in test mode and records delivery with dedupe key', async () => {
    const result = await emailService.send({
      to: 'customer@example.com',
      template: 'order_confirmation',
      locale: 'ar',
      variables: {
        orderReference: 'ORD-20260930-999999',
        totalFormatted: '250.00',
        currency: 'EGP',
      },
      dedupeKey: 'order:ORD-20260930-999999:confirmed',
    });

    expect(result.delivered).toBe(true);
    expect(result.providerMessageId).toBeTruthy();

    expect(emailService.sentEmails).toHaveLength(1);
    const sent = emailService.sentEmails[0];
    expect(sent.to).toBe('customer@example.com');
    expect(sent.dedupeKey).toBe('order:ORD-20260930-999999:confirmed');
    expect(sent.template).toBe('order_confirmation');
    expect(sent.subject).toContain('ORD-20260930-999999');
  });

  it('sanitizes sensitive variables such as passwords, tokens, and proof URLs', async () => {
    await emailService.send({
      to: 'customer@example.com',
      template: 'payment_update',
      locale: 'en',
      variables: {
        orderReference: 'ORD-20260930-111111',
        status: 'verified',
        password: 'secret_password_123',
        token: 'jwt_access_token_abc',
        proofUrl: 'https://cloudinary.com/secret_proof.jpg',
      },
      dedupeKey: 'payment:proof:123',
    });

    expect(emailService.sentEmails).toHaveLength(1);
    const sent = emailService.sentEmails[0];
    expect(sent.variables.password).toBeUndefined();
    expect(sent.variables.token).toBeUndefined();
    expect(sent.variables.proofUrl).toBeUndefined();
    expect(sent.variables.orderReference).toBe('ORD-20260930-111111');
  });

  it('rejects invalid recipient email address', async () => {
    await expect(
      emailService.send({
        to: 'invalid-email',
        template: 'verify_email',
        locale: 'en',
        variables: { name: 'Test' },
        dedupeKey: 'verify:user:123',
      }),
    ).rejects.toMatchObject({
      code: ErrorCodes.VALIDATION_ERROR,
    });
  });
});
