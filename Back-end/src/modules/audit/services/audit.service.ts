import { Types } from 'mongoose';
import { AuditLogModel } from '../models/audit-log.model';
import { CreateAuditLogInput } from '../types/audit.types';
import { logger } from '../../../config/logger';

export class AuditService {
  async record(input: CreateAuditLogInput): Promise<void> {
    try {
      await AuditLogModel.create({
        actorId: input.actorId ? new Types.ObjectId(input.actorId) : null,
        actorRole: input.actorRole ?? 'system',
        action: input.action,
        entityType: input.entityType,
        entityId: String(input.entityId),
        previousState: input.previousState ?? null,
        newState: input.newState ?? null,
        metadata: input.metadata ?? null,
        requestId: input.requestId ?? null,
        ipHash: input.ipHash ?? null,
        createdAt: new Date(),
      });
    } catch (error) {
      logger.error({ err: error, action: input.action, entityId: input.entityId }, 'Failed to write audit log');
    }
  }
}

export const auditService = new AuditService();
