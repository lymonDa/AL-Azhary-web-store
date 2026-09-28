import { ClientSession } from 'mongoose';
import { OutboxEventModel, IOutboxEventDocument } from '../models/outbox-event.model';

export interface RecordOutboxEventInput {
  eventType: string;
  aggregateType: string;
  aggregateId: string;
  payload: Record<string, unknown>;
  dedupeKey?: string | null;
}

export class OutboxService {
  /**
   * Persists an outbox event atomically within a MongoDB session/transaction.
   */
  async record(
    input: RecordOutboxEventInput,
    session?: ClientSession,
  ): Promise<IOutboxEventDocument> {
    const docs = await OutboxEventModel.create(
      [
        {
          eventType: input.eventType,
          aggregateType: input.aggregateType,
          aggregateId: input.aggregateId,
          payload: input.payload,
          dedupeKey: input.dedupeKey ?? null,
          status: 'pending',
          attempts: 0,
          availableAt: new Date(),
        },
      ],
      { session },
    );
    return docs[0];
  }
}

export const outboxService = new OutboxService();
