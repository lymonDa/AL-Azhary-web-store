"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.outboxDispatcher = exports.OutboxDispatcher = void 0;
const email_1 = require("../../integrations/email");
const realtime_1 = require("../../realtime");
const logger_1 = require("../../config/logger");
class OutboxDispatcher {
    email;
    realtime;
    constructor(email = email_1.emailService, realtime = realtime_1.realtimeService) {
        this.email = email;
        this.realtime = realtime;
    }
    /**
     * Sanitizes payload so that passwords, tokens, and sensitive proof URLs are not forwarded.
     */
    sanitizePayload(payload) {
        const clean = { ...payload };
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
    extractTemplateVariables(payload) {
        const variables = {};
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
    async dispatch(event) {
        const payload = (event.payload ?? {});
        const sanitizedPayload = this.sanitizePayload(payload);
        let realtimeEmitted = false;
        const emittedRooms = [];
        let emailSent = false;
        let emailMessageId;
        // ─── 1. Realtime / Socket.IO Channel ──────────────────────────────────────
        const recipientUserId = payload.recipientUserId ||
            (event.aggregateType === 'user' ? event.aggregateId : undefined);
        if (recipientUserId) {
            const ok = this.realtime.emitToUser(recipientUserId, realtime_1.SocketEvents.NOTIFICATION_CREATED, {
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
            const ok = this.realtime.emitToOrder(event.aggregateId, realtime_1.SocketEvents.ORDER_STATUS_CHANGED, {
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
            const ok = this.realtime.emitToService(event.aggregateId, realtime_1.SocketEvents.SERVICE_REQUEST_CREATED, {
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
            const ok = this.realtime.emitToAdmin(realtime_1.SocketEvents.ADMIN_QUEUE_CHANGED, {
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
        const recipientEmail = payload.recipientEmail ||
            payload.email ||
            payload.to;
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
            }
            catch (emailErr) {
                logger_1.logger.warn({ err: emailErr, eventId: event._id.toString(), recipientEmail, eventType: event.eventType }, 'Email delivery failed during outbox event dispatch');
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
    resolveEmailTemplate(eventType) {
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
exports.OutboxDispatcher = OutboxDispatcher;
exports.outboxDispatcher = new OutboxDispatcher();
//# sourceMappingURL=outbox-dispatcher.js.map