import { Types, Document, ClientSession } from 'mongoose';

export interface IAuditLog {
  _id: Types.ObjectId;
  actorId?: Types.ObjectId | null;
  actorRole: string;
  action: string;
  entityType: string;
  entityId: string;
  previousState?: Record<string, unknown> | null;
  newState?: Record<string, unknown> | null;
  reason?: string | null;
  metadata?: Record<string, unknown> | null;
  requestId?: string | null;
  ipHash?: string | null;
  dedupeKey?: string | null;
  createdAt: Date;
}

export type IAuditLogDocument = IAuditLog & Document<Types.ObjectId>;

export interface CreateAuditLogInput {
  actorId?: string | Types.ObjectId | null;
  actorRole?: string;
  action: string;
  entityType?: string;
  targetType?: string;
  entityId?: string;
  targetId?: string;
  previousState?: Record<string, unknown> | null;
  newState?: Record<string, unknown> | null;
  reason?: string | null;
  metadata?: Record<string, unknown> | null;
  requestId?: string | null;
  ipHash?: string | null;
  ip?: string | null;
  dedupeKey?: string | null;
  session?: ClientSession | null;
}

export interface AuditLogFilter {
  entityType?: string;
  entityId?: string;
  action?: string;
  actorId?: string;
  actorRole?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface AuditLogSortOptions {
  field?: 'createdAt' | 'action' | 'entityType';
  order?: 1 | -1;
}
