import { Schema, model, Types, Document } from 'mongoose';
import { defaultSchemaOptions } from '../../../database/options';

export type OutboxEventStatus = 'pending' | 'processing' | 'sent' | 'failed';

export interface IOutboxEvent {
  _id: Types.ObjectId;
  eventType: string;
  aggregateType: string;
  aggregateId: string;
  payload: Record<string, unknown>;
  dedupeKey?: string | null;
  status: OutboxEventStatus;
  attempts: number;
  availableAt: Date;
  processedAt?: Date | null;
  lastError?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type IOutboxEventDocument = IOutboxEvent & Document<Types.ObjectId>;

export const outboxEventSchema = new Schema<IOutboxEventDocument>(
  {
    eventType: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    aggregateType: {
      type: String,
      required: true,
      trim: true,
    },
    aggregateId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    payload: {
      type: Schema.Types.Mixed,
      required: true,
      default: {},
    },
    dedupeKey: {
      type: String,
      trim: true,
      index: {
        unique: true,
        partialFilterExpression: { dedupeKey: { $type: 'string' } },
      },
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'sent', 'failed'],
      default: 'pending',
      required: true,
      index: true,
    },
    attempts: {
      type: Number,
      default: 0,
      min: 0,
    },
    availableAt: {
      type: Date,
      default: Date.now,
      required: true,
      index: true,
    },
    processedAt: {
      type: Date,
      default: null,
    },
    lastError: {
      type: String,
      default: null,
    },
  },
  {
    ...defaultSchemaOptions,
    collection: 'outboxEvents',
  },
);

outboxEventSchema.index({ status: 1, availableAt: 1 });

export const OutboxEventModel = model<IOutboxEventDocument>('OutboxEvent', outboxEventSchema);
