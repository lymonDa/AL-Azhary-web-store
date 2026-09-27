import { Types, Document } from 'mongoose';

export interface IAuditLog {
  _id: Types.ObjectId;
  actorId?: Types.ObjectId | null;
  actorRole: string;
  action: string;
  entityType: string;
  entityId: string;
  previousState?: Record<string, unknown> | null;
  newState?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
  requestId?: string | null;
  ipHash?: string | null;
  createdAt: Date;
}

export type IAuditLogDocument = IAuditLog & Document<Types.ObjectId>;

export interface CreateAuditLogInput {
  actorId?: string | Types.ObjectId | null;
  actorRole?: string;
  action: string;
  entityType: string;
  entityId: string;
  previousState?: Record<string, unknown> | null;
  newState?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
  requestId?: string | null;
  ipHash?: string | null;
}
