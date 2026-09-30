import { ClientSession, Types } from 'mongoose';
import crypto from 'crypto';
import { auditRepository, AuditRepository } from '../repositories/audit.repository';
import {
  AuditLogFilter,
  AuditLogSortOptions,
  CreateAuditLogInput,
  IAuditLog,
} from '../types/audit.types';
import { redactSensitiveData } from '../../../common/security/redact';
import { logger } from '../../../config/logger';
import { createPaginationMeta, PaginationParams } from '../../../common/http/pagination';
import { PaginationMeta } from '../../../common/types/response';

export interface PaginatedAuditLogsResult {
  logs: IAuditLog[];
  pagination: PaginationMeta;
}

export class AuditService {
  constructor(private readonly repo: AuditRepository = auditRepository) {}

  /**
   * Records an audit log entry with strict sanitization/redaction of sensitive fields.
   * If a session is provided, the record participates in the caller's transaction.
   * If a dedupeKey is specified and already exists, duplicate recording is prevented.
   */
  async record(
    input: CreateAuditLogInput,
    options?: { session?: ClientSession | null },
  ): Promise<void> {
    const session = input.session ?? options?.session ?? undefined;

    try {
      // Deduplication check
      if (input.dedupeKey) {
        const existing = await this.repo.findByDedupeKey(input.dedupeKey, { session });
        if (existing) {
          return;
        }
      }

      // Hash raw IP if provided
      let ipHash = input.ipHash ?? null;
      if (!ipHash && input.ip) {
        ipHash = crypto.createHash('sha256').update(input.ip.trim()).digest('hex');
      }

      // Sanitize and redact snapshots and metadata
      const sanitizedPrevious = input.previousState
        ? redactSensitiveData(input.previousState)
        : null;
      const sanitizedNew = input.newState
        ? redactSensitiveData(input.newState)
        : null;
      const sanitizedMetadata = input.metadata
        ? redactSensitiveData(input.metadata)
        : null;

      const entityType = (input.entityType ?? input.targetType ?? 'Unknown').trim();
      const entityId = String(input.entityId ?? input.targetId ?? '').trim();

      await this.repo.create(
        {
          actorId: input.actorId ? new Types.ObjectId(input.actorId) : null,
          actorRole: input.actorRole ?? 'system',
          action: input.action,
          entityType,
          entityId,
          previousState: sanitizedPrevious as Record<string, unknown> | null,
          newState: sanitizedNew as Record<string, unknown> | null,
          reason: input.reason ?? null,
          metadata: sanitizedMetadata as Record<string, unknown> | null,
          requestId: input.requestId ?? null,
          ipHash,
          dedupeKey: input.dedupeKey ?? null,
          createdAt: new Date(),
        },
        { session },
      );
    } catch (error) {
      logger.error(
        { err: error, action: input.action, entityId: input.entityId ?? input.targetId },
        'Failed to write audit log',
      );

      // In transactions, rethrow to guarantee atomic abort
      if (session) {
        throw error;
      }
    }
  }

  /**
   * Retrieves paginated audit logs with safe projections and read-time redaction.
   */
  async getAuditLogs(
    filter: AuditLogFilter,
    pagination: PaginationParams,
    sort?: AuditLogSortOptions,
  ): Promise<PaginatedAuditLogsResult> {
    const { logs, total } = await this.repo.findWithPagination(
      filter,
      { skip: pagination.skip, limit: pagination.limit },
      sort,
    );

    // Deep sanitize on read as defense-in-depth
    const safeLogs: IAuditLog[] = logs.map((log) => {
      const sanitized = redactSensitiveData(log as unknown as Record<string, unknown>);
      return sanitized as unknown as IAuditLog;
    });

    const paginationMeta = createPaginationMeta({
      page: pagination.page,
      limit: pagination.limit,
      total,
    });

    return {
      logs: safeLogs,
      pagination: paginationMeta,
    };
  }
}

export const auditService = new AuditService();
