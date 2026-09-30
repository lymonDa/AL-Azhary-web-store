import { IOutboxEventDocument } from '../../modules/notifications/models/outbox-event.model';
import { DispatchResult } from '../types';
import { emailService, EmailService } from '../../integrations/email';
import { EmailTemplate } from '../../integrations/email/email.types';
import { realtimeService, RealtimeService, SocketEvents } from '../../realtime';
import { logger } from '../../config/logger';

export class OutboxDispatcher {
  constructor(
    private readonly email: EmailService = emailService,
    private readonly realtime: RealtimeService = realtimeService,
  ) {}

  /**
   * Sanitizes payload so that passwords, tokens, and sensitive proof URLs are not forwarded.
   */
  private sanitizePayload(payload: Record<string, unknown>): Record<string, unknown> {
    const clean: Record<string, unknown> = { ...payload };
    const forbidden = [
      'password',
      'passwordHash',
      'token',
      'accessToken',
      'refreshToken',
      'resetToken',
      'proofUrl',
      'secureUrl',
      'cloudinaryPublicId',
      'cvv',
      'cardNumber',
    ];

    for (const key of Object.keys(clean)) {
      if (forbidden.some((f) => key.toLowerCase().includes(f.toLowerCase()))) {
        delete clean[key];
      }
    }
    return clean;
  }

  /**
   * Extracts clean primitive variables for email templates.
   */
  private extractTemplateVariables(payload: Record<string, unknown>): Record<string, string | number> {
    const variables: Record<string, string | number> = {};
    for (const [key, value] of Object.entries(payload)) {
      if (typeof value === 'string' || typeof value === 'number') {
        variables[key] = value;
      }
    }
    return variables;
  }

  /**
   * Dispatches an outbox event to its designated delivery channels.
   * Tolerant of replay (at-least-once semantics).
   */
  async dispatch(event: IOutboxEventDocument): Promise<DispatchResult> {
    const payload = (event.payload ?? {}) as Record<string, unknown>;
    const sanitizedPayload = this.sanitizePayload(payload);

    let realtimeEmitted = false;
    const emittedRooms: string[] = [];
    let emailSent = false;
    let emailMessageId: string | undefined;

    // ─── 1. Realtime / Socket.IO Channel ──────────────────────────────────────
    const recipientUserId =
      (payload.recipientUserId as string | undefined) ||
      (event.aggregateType === 'user' ? event.aggregateId : undefined);

    if (recipientUserId) {
      const ok = this.realtime.emitToUser(recipientUserId, SocketEvents.NOTIFICATION_CREATED, {
        ...sanitizedPayload,
        eventId: event._id.toString(),
        eventType: event.eventType,
        aggregateType: event.aggregateType,
        aggregateId: event.aggregateId,
      });
      if (ok) {
        realtimeEmitted = true;
        emittedRooms.push(`user:${recipientUserId}`);
      }
    }

    if (event.aggregateType === 'order') {
      const ok = this.realtime.emitToOrder(event.aggregateId, SocketEvents.ORDER_STATUS_CHANGED, {
        orderId: event.aggregateId,
        eventType: event.eventType,
        ...sanitizedPayload,
      });
      if (ok) {
        realtimeEmitted = true;
        emittedRooms.push(`order:${event.aggregateId}`);
      }
    }

    if (event.aggregateType === 'service') {
      const ok = this.realtime.emitToService(event.aggregateId, SocketEvents.SERVICE_REQUEST_CREATED, {
        serviceId: event.aggregateId,
        eventType: event.eventType,
        ...sanitizedPayload,
      });
      if (ok) {
        realtimeEmitted = true;
        emittedRooms.push(`service:${event.aggregateId}`);
      }
    }

    // Operational Admin notifications for high-priority queue changes
    const adminEvents = [
      'order_created',
      'payment_proof_submitted',
      'service_requested',
      'return_requested',
    ];
    if (adminEvents.includes(event.eventType)) {
      const ok = this.realtime.emitToAdmin(SocketEvents.ADMIN_QUEUE_CHANGED, {
        eventType: event.eventType,
        aggregateType: event.aggregateType,
        aggregateId: event.aggregateId,
      });
      if (ok) {
        realtimeEmitted = true;
        emittedRooms.push('admin:operational');
      }
    }

    // ─── 2. Transactional Email Channel ─────────────────────────────────────────
    const recipientEmail =
      (payload.recipientEmail as string | undefined) ||
      (payload.email as string | undefined) ||
      (payload.to as string | undefined);

    const emailTemplate = this.resolveEmailTemplate(event.eventType);

    if (recipientEmail && emailTemplate) {
      const locale = payload.locale === 'en' ? 'en' : 'ar';
      const variables = this.extractTemplateVariables(sanitizedPayload);
      const dedupeKey = `email:${event.dedupeKey ?? event._id.toString()}`;

      try {
        const result = await this.email.send({
          to: recipientEmail,
          template: emailTemplate,
          locale,
          variables,
          dedupeKey,
        });

        emailSent = true;
        emailMessageId = result.providerMessageId;
      } catch (emailErr) {
        logger.warn(
          { err: emailErr, eventId: event._id.toString(), recipientEmail, eventType: event.eventType },
          'Email delivery failed during outbox event dispatch',
        );
        throw emailErr;
      }
    }

    return {
      delivered: true,
      channelResults: {
        email: recipientEmail && emailTemplate ? { sent: emailSent, messageId: emailMessageId } : undefined,
        realtime: { emitted: realtimeEmitted, rooms: emittedRooms },
      },
    };
  }

  /**
   * Resolves the matching email template for authoritative lifecycle events.
   */
  private resolveEmailTemplate(eventType: string): EmailTemplate | null {
    switch (eventType) {
      case 'user_registered':
      case 'verify_email':
        return 'verify_email';
      case 'password_reset':
        return 'password_reset';
      case 'order_created':
      case 'order_confirmed':
      case 'order_accepted':
        return 'order_confirmation';
      case 'payment_proof_submitted':
      case 'payment_verified':
      case 'payment_new_proof_requested':
        return 'payment_update';
      case 'service_requested':
      case 'quotation_sent':
      case 'quotation_decision_recorded':
        return 'service_update';
      default:
        return null;
    }
  }
}

export const outboxDispatcher = new OutboxDispatcher();
