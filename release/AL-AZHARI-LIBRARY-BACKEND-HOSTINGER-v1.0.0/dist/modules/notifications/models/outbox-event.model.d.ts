import { Schema, Types, Document } from 'mongoose';
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
    leaseUntil?: Date | null;
    claimedBy?: string | null;
    createdAt: Date;
    updatedAt: Date;
}
export type IOutboxEventDocument = IOutboxEvent & Document<Types.ObjectId>;
export declare const outboxEventSchema: Schema<IOutboxEventDocument, import("mongoose").Model<IOutboxEventDocument, any, any, any, Document<unknown, any, IOutboxEventDocument, any, {}> & IOutboxEvent & Document<Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, IOutboxEventDocument, Document<unknown, {}, import("mongoose").FlatRecord<IOutboxEventDocument>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<IOutboxEventDocument> & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}>;
export declare const OutboxEventModel: import("mongoose").Model<IOutboxEventDocument, {}, {}, {}, Document<unknown, {}, IOutboxEventDocument, {}, {}> & IOutboxEvent & Document<Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, any>;
