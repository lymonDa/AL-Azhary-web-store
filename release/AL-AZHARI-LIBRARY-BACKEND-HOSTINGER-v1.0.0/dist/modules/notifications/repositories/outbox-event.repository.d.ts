import { ClientSession, Types } from 'mongoose';
import { IOutboxEvent, IOutboxEventDocument } from '../models/outbox-event.model';
export interface BacklogStats {
    pending: number;
    processing: number;
    failed: number;
    sent: number;
    oldestPendingAgeMs: number | null;
}
export declare class OutboxEventRepository {
    create(data: Partial<IOutboxEvent>, session?: ClientSession): Promise<IOutboxEventDocument>;
    findByDedupeKey(dedupeKey: string, session?: ClientSession): Promise<IOutboxEventDocument | null>;
    findById(id: Types.ObjectId | string, session?: ClientSession): Promise<IOutboxEventDocument | null>;
    findPending(limit?: number): Promise<IOutboxEventDocument[]>;
    /**
     * Atomically claims the next eligible outbox event for processing.
     * Matches pending events whose availableAt has arrived OR processing events whose lease has expired.
     */
    claimNext(leaseDurationMs: number, workerId: string, now?: Date): Promise<IOutboxEventDocument | null>;
    /**
     * Atomically claims up to batchSize eligible events.
     */
    claimBatch(batchSize: number, leaseDurationMs: number, workerId: string, now?: Date): Promise<IOutboxEventDocument[]>;
    /**
     * Marks an event as successfully delivered.
     */
    markAsSent(id: Types.ObjectId | string, processedAt?: Date): Promise<IOutboxEventDocument | null>;
    /**
     * Re-schedules an event for retry with exponential backoff timestamp.
     */
    scheduleRetry(id: Types.ObjectId | string, nextAvailableAt: Date, lastError: string): Promise<IOutboxEventDocument | null>;
    /**
     * Transitions an event to terminal failure.
     */
    markAsFailed(id: Types.ObjectId | string, lastError: string, processedAt?: Date): Promise<IOutboxEventDocument | null>;
    /**
     * Periodic recovery of processing events whose lease has expired without completion.
     * Resets them to pending status so they can be reclaimed.
     */
    recoverExpiredLeases(now?: Date): Promise<number>;
    /**
     * Returns operational backlog statistics for worker observability.
     */
    getBacklogStats(): Promise<BacklogStats>;
}
export declare const outboxEventRepository: OutboxEventRepository;
