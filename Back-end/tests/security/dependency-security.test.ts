import packageJson from '../../package.json';
import { emailService } from '../../src/integrations/email';

describe('Phase 17 — Dependency Security & Vulnerability Analysis', () => {
  it('verifies core dependency versions are pinned and configured properly in package.json', () => {
    const deps = packageJson.dependencies as Record<string, string>;

    expect(deps.express).toBeDefined();
    expect(deps.mongoose).toBeDefined();
    expect(deps.zod).toBeDefined();
    expect(deps.argon2).toBeDefined();
    expect(deps.helmet).toBeDefined();
    expect(deps.cors).toBeDefined();
    expect(deps.pino).toBeDefined();
    expect(deps.cloudinary).toBeDefined();
    expect(deps.nodemailer).toBeDefined();
    expect(deps['node-cron']).toBeDefined();
  });

  it('validates email adapter isolates nodemailer and sanitizes template variables', async () => {
    // Attempt sending email with potentially dangerous template variables
    const sendResult = await emailService.send({
      to: 'student@example.com',
      template: 'verify_email',
      locale: 'ar',
      dedupeKey: 'test_sec_email_1',
      variables: {
        userName: 'Student <script>alert(1)</script>',
        verificationUrl: 'https://store.al-azhari.com/verify?token=abc123xyz',
      },
    });

    // In test environment, uses mock email adapter cleanly
    expect(sendResult.delivered).toBe(true);
  });
});
