import { ClientSession, FilterQuery, Types } from 'mongoose';
import { AuditLogModel } from '../models/audit-log.model';
import { AuditLogFilter, AuditLogSortOptions, IAuditLogDocument } from '../types/audit.types';

export class AuditRepository {
  async create(
    doc: Partial<IAuditLogDocument>,
    options?: { session?: ClientSession | null },
  ): Promise<IAuditLogDocument> {
    const session = options?.session ?? undefined;
    if (session) {
      const [created] = await AuditLogModel.create([doc], { session });
      return created;
    }
    return AuditLogModel.create(doc);
  }

  async findByDedupeKey(
    dedupeKey: string,
    options?: { session?: ClientSession | null },
  ): Promise<IAuditLogDocument | null> {
    const query = AuditLogModel.findOne({ dedupeKey });
    if (options?.session) {
      query.session(options.session);
    }
    return query.exec();
  }

  async findWithPagination(
    filter: AuditLogFilter,
    pagination: { skip: number; limit: number },
    sort: AuditLogSortOptions = { field: 'createdAt', order: -1 },
  ): Promise<{ logs: IAuditLogDocument[]; total: number }> {
    const query = this.buildFilterQuery(filter);

    const sortField = sort.field || 'createdAt';
    const sortOrder = sort.order || -1;

    const [logs, total] = await Promise.all([
      AuditLogModel.find(query)
        .sort({ [sortField]: sortOrder })
        .skip(pagination.skip)
        .limit(pagination.limit)
        .lean()
        .exec(),
      AuditLogModel.countDocuments(query).exec(),
    ]);

    return { logs: logs as unknown as IAuditLogDocument[], total };
  }

  private buildFilterQuery(filter: AuditLogFilter): FilterQuery<IAuditLogDocument> {
    const query: FilterQuery<IAuditLogDocument> = {};

    if (filter.entityType) {
      query.entityType = filter.entityType.trim();
    }

    if (filter.entityId) {
      query.entityId = filter.entityId.trim();
    }

    if (filter.action) {
      query.action = filter.action.trim();
    }

    if (filter.actorId) {
      if (Types.ObjectId.isValid(filter.actorId)) {
        query.actorId = new Types.ObjectId(filter.actorId);
      } else {
        query.actorId = null;
      }
    }

    if (filter.actorRole) {
      query.actorRole = filter.actorRole.trim();
    }

    if (filter.dateFrom || filter.dateTo) {
      query.createdAt = {};
      if (filter.dateFrom) {
        query.createdAt.$gte = filter.dateFrom;
      }
      if (filter.dateTo) {
        query.createdAt.$lte = filter.dateTo;
      }
    }

    return query;
  }
}

export const auditRepository = new AuditRepository();
