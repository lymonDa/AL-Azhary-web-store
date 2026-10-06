import { IOutboxEventDocument } from '../../modules/notifications/models/outbox-event.model';
import { DispatchResult } from '../types';
import { EmailService } from '../../integrations/email';
import { RealtimeService } from '../../realtime';
export declare class OutboxDispatcher {
    private readonly email;
    private readonly realtime;
    constructor(email?: EmailService, realtime?: RealtimeService);
    /**
     * Sanitizes payload so that passwords, tokens, and sensitive proof URLs are not forwarded.
     */
    private sanitizePayload;
    /**
     * Extracts clean primitive variables for email templates.
     */
    private extractTemplateVariables;
    /**
     * Dispatches an outbox event to its designated delivery channels.
     * Tolerant of replay (at-least-once semantics).
     */
    dispatch(event: IOutboxEventDocument): Promise<DispatchResult>;
    /**
     * Resolves the matching email template for authoritative lifecycle events.
     */
    private resolveEmailTemplate;
}
export declare const outboxDispatcher: OutboxDispatcher;
