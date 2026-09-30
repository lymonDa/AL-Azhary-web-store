import { ClientSession, Types } from 'mongoose';
import {
  OutboxEventModel,
  IOutboxEvent,
  IOutboxEventDocument,
} from '../models/outbox-event.model';

export interface BacklogStats {
  pending: number;
  processing: number;
  failed: number;
  sent: number;
  oldestPendingAgeMs: number | null;
}

export class OutboxEventRepository {
  async create(
    data: Partial<IOutboxEvent>,
    session?: ClientSession,
  ): Promise<IOutboxEventDocument> {
    const docs = await OutboxEventModel.create([data], { session });
    return docs[0];
  }

  async findByDedupeKey(
    dedupeKey: string,
    session?: ClientSession,
  ): Promise<IOutboxEventDocument | null> {
    return OutboxEventModel.findOne({ dedupeKey }).session(session ?? null);
  }

  async findById(
    id: Types.ObjectId | string,
    session?: ClientSession,
  ): Promise<IOutboxEventDocument | null> {
    return OutboxEventModel.findById(id).session(session ?? null);
  }

  async findPending(limit = 50): Promise<IOutboxEventDocument[]> {
    return OutboxEventModel.find({
      status: 'pending',
      availableAt: { $lte: new Date() },
    })
      .sort({ availableAt: 1 })
      .limit(limit)
      .exec();
  }

  /**
   * Atomically claims the next eligible outbox event for processing.
   * Matches pending events whose availableAt has arrived OR processing events whose lease has expired.
   */
  async claimNext(
    leaseDurationMs: number,
    workerId: string,
    now: Date = new Date(),
  ): Promise<IOutboxEventDocument | null> {
    const leaseUntil = new Date(now.getTime() + leaseDurationMs);

    return OutboxEventModel.findOneAndUpdate(
      {
        $or: [
          { status: 'pending', availableAt: { $lte: now } },
          { status: 'processing', leaseUntil: { $lt: now } },
        ],
      },
      {
        $set: {
          status: 'processing',
          leaseUntil,
          claimedBy: workerId,
        },
        $inc: { attempts: 1 },
      },
      {
        sort: { availableAt: 1 },
        new: true,
      },
    ).exec();
  }

  /**
   * Atomically claims up to batchSize eligible events.
   */
  async claimBatch(
    batchSize: number,
    leaseDurationMs: number,
    workerId: string,
    now: Date = new Date(),
  ): Promise<IOutboxEventDocument[]> {
    const claimed: IOutboxEventDocument[] = [];
    for (let i = 0; i < batchSize; i++) {
      const event = await this.claimNext(leaseDurationMs, workerId, now);
      if (!event) break;
      claimed.push(event);
    }
    return claimed;
  }

  /**
   * Marks an event as successfully delivered.
   */
  async markAsSent(
    id: Types.ObjectId | string,
    processedAt: Date = new Date(),
  ): Promise<IOutboxEventDocument | null> {
    return OutboxEventModel.findByIdAndUpdate(
      id,
      {
        $set: {
          status: 'sent',
          processedAt,
          leaseUntil: null,
          claimedBy: null,
        },
      },
      { new: true },
    ).exec();
  }

  /**
   * Re-schedules an event for retry with exponential backoff timestamp.
   */
  async scheduleRetry(
    id: Types.ObjectId | string,
    nextAvailableAt: Date,
    lastError: string,
  ): Promise<IOutboxEventDocument | null> {
    return OutboxEventModel.findByIdAndUpdate(
      id,
      {
        $set: {
          status: 'pending',
          availableAt: nextAvailableAt,
          lastError,
          leaseUntil: null,
          claimedBy: null,
        },
      },
      { new: true },
    ).exec();
  }

  /**
   * Transitions an event to terminal failure.
   */
  async markAsFailed(
    id: Types.ObjectId | string,
    lastError: string,
    processedAt: Date = new Date(),
  ): Promise<IOutboxEventDocument | null> {
    return OutboxEventModel.findByIdAndUpdate(
      id,
      {
        $set: {
          status: 'failed',
          processedAt,
          lastError,
          leaseUntil: null,
          claimedBy: null,
        },
      },
      { new: true },
    ).exec();
  }

  /**
   * Periodic recovery of processing events whose lease has expired without completion.
   * Resets them to pending status so they can be reclaimed.
   */
  async recoverExpiredLeases(now: Date = new Date()): Promise<number> {
    const result = await OutboxEventModel.updateMany(
      {
        status: 'processing',
        leaseUntil: { $lt: now },
      },
      {
        $set: {
          status: 'pending',
          leaseUntil: null,
          claimedBy: null,
          availableAt: new Date(Math.min(now.getTime(), Date.now())),
        },
      },
    ).exec();
    return result.modifiedCount;
  }

  /**
   * Returns operational backlog statistics for worker observability.
   */
  async getBacklogStats(): Promise<BacklogStats> {
    const [counts, oldestPending] = await Promise.all([
      OutboxEventModel.aggregate<{ _id: string; count: number }>([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      OutboxEventModel.findOne({ status: 'pending' })
        .sort({ availableAt: 1 })
        .select({ availableAt: 1 })
        .lean(),
    ]);

    const stats: BacklogStats = {
      pending: 0,
      processing: 0,
      failed: 0,
      sent: 0,
      oldestPendingAgeMs: oldestPending
        ? Math.max(0, Date.now() - new Date(oldestPending.availableAt).getTime())
        : null,
    };

    for (const c of counts) {
      if (c._id in stats) {
        (stats as unknown as Record<string, number | null>)[c._id] = c.count;
      }
    }

    return stats;
  }
}

export const outboxEventRepository = new OutboxEventRepository();
