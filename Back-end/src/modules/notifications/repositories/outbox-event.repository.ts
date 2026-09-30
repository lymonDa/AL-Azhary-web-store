import { ClientSession, Types } from 'mongoose';
import {
  OutboxEventModel,
  IOutboxEvent,
  IOutboxEventDocument,
} from '../models/outbox-event.model';

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
}

export const outboxEventRepository = new OutboxEventRepository();
