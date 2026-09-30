import nodemailer, { Transporter } from 'nodemailer';
import { env, logger } from '../../config';
import {
  EmailService,
  SendEmailInput,
  SendEmailResult,
} from './email.types';
import { renderEmailTemplate } from './email.templates';
import { AppError } from '../../common/errors/AppError';
import { ErrorCodes } from '../../common/errors/errorCodes';

export class NodemailerEmailService implements EmailService {
  private transporter: Transporter | null = null;
  public readonly sentEmails: Array<SendEmailInput & { subject: string; sentAt: Date }> = [];

  constructor() {
    this.initTransporter();
  }

  private initTransporter(): void {
    if (env.NODE_ENV === 'test') {
      // In test mode, we record sent emails without opening live SMTP connections
      return;
    }

    if (!env.SMTP_HOST || env.SMTP_HOST === 'smtp.example.com') {
      logger.info('SMTP not fully configured; using development stub for email delivery');
      return;
    }

    try {
      this.transporter = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: env.SMTP_SECURE,
        auth: env.SMTP_USER && env.SMTP_PASSWORD
          ? {
              user: env.SMTP_USER,
              pass: env.SMTP_PASSWORD,
            }
          : undefined,
      });
    } catch (err) {
      logger.error({ err }, 'Failed to initialize Nodemailer transporter');
    }
  }

  /**
   * Sanitizes variables to ensure no secrets or sensitive proof URLs are sent.
   */
  private sanitizeVariables(variables: Record<string, string | number>): Record<string, string | number> {
    const clean: Record<string, string | number> = {};
    const forbidden = ['password', 'passwordHash', 'token', 'secret', 'proofUrl', 'secureUrl'];

    for (const [key, val] of Object.entries(variables)) {
      if (forbidden.some((f) => key.toLowerCase().includes(f.toLowerCase()))) {
        continue;
      }
      clean[key] = val;
    }
    return clean;
  }

  async send(input: SendEmailInput): Promise<SendEmailResult> {
    if (!input.to || !input.to.includes('@')) {
      throw new AppError(
        ErrorCodes.VALIDATION_ERROR,
        'Invalid recipient email address',
        400,
      );
    }

    const cleanVariables = this.sanitizeVariables(input.variables);
    const rendered = renderEmailTemplate(input.template, input.locale, cleanVariables);

    // If running in test mode or unconfigured stub
    if (env.NODE_ENV === 'test' || !this.transporter) {
      this.sentEmails.push({
        ...input,
        variables: cleanVariables,
        subject: rendered.subject,
        sentAt: new Date(),
      });

      logger.debug(
        { to: input.to, template: input.template, dedupeKey: input.dedupeKey },
        'Recorded email delivery (test/stub mode)',
      );

      return {
        providerMessageId: `mock-email-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        delivered: true,
      };
    }

    try {
      const info = await this.transporter.sendMail({
        from: env.EMAIL_FROM,
        to: input.to,
        subject: rendered.subject,
        text: rendered.text,
        html: rendered.html,
        headers: {
          'X-Dedupe-Key': input.dedupeKey,
        },
      });

      logger.info(
        { messageId: info.messageId, to: input.to, template: input.template, dedupeKey: input.dedupeKey },
        'Email sent successfully via SMTP',
      );

      return {
        providerMessageId: info.messageId,
        delivered: true,
      };
    } catch (error) {
      logger.error(
        { err: error, to: input.to, template: input.template, dedupeKey: input.dedupeKey },
        'SMTP email delivery failed',
      );

      throw new AppError(
        ErrorCodes.EMAIL_DELIVERY_FAILED,
        'Email delivery failed',
        502,
        {
          to: input.to,
          template: input.template,
          dedupeKey: input.dedupeKey,
        },
      );
    }
  }

  clearSentEmails(): void {
    this.sentEmails.length = 0;
  }
}

export const emailService = new NodemailerEmailService();
