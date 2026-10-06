import { ClientSession } from 'mongoose';
import { IOutboxEventDocument } from '../models/outbox-event.model';
export interface RecordOutboxEventInput {
    eventType: string;
    aggregateType: string;
    aggregateId: string;
    payload: Record<string, unknown>;
    dedupeKey?: string | null;
}
export declare class OutboxService {
    /**
     * Persists an outbox event atomically within a MongoDB session/transaction.
     */
    record(input: RecordOutboxEventInput, session?: ClientSession): Promise<IOutboxEventDocument>;
}
export declare const outboxService: OutboxService;
