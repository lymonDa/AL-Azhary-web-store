import { Request, Response, NextFunction } from 'express';
import { auditService, AuditService } from '../services/audit.service';
import { listAuditLogsQuerySchema } from '../schemas/audit.schema';
import { sendSuccessResponse } from '../../../common/http/envelope';
import { AuditLogFilter, AuditLogSortOptions } from '../types/audit.types';
import { PaginationParams } from '../../../common/http/pagination';

export class AuditController {
  constructor(private readonly service: AuditService = auditService) {}

  getAuditLogs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsedQuery = listAuditLogsQuerySchema.parse(req.query);

      const filter: AuditLogFilter = {
        entityType: parsedQuery.entityType,
        entityId: parsedQuery.entityId,
        action: parsedQuery.action,
        actorId: parsedQuery.actorId,
        actorRole: parsedQuery.actorRole,
        dateFrom: parsedQuery.dateFrom ? new Date(parsedQuery.dateFrom) : undefined,
        dateTo: parsedQuery.dateTo ? new Date(parsedQuery.dateTo) : undefined,
      };

      const pagination: PaginationParams = {
        page: parsedQuery.page,
        limit: parsedQuery.limit,
        skip: (parsedQuery.page - 1) * parsedQuery.limit,
      };

      let sort: AuditLogSortOptions = { field: 'createdAt', order: -1 };
      if (parsedQuery.sort) {
        if (parsedQuery.sort.startsWith('-')) {
          sort = {
            field: parsedQuery.sort.slice(1) as 'createdAt' | 'action',
            order: -1,
          };
        } else {
          sort = {
            field: parsedQuery.sort as 'createdAt' | 'action',
            order: 1,
          };
        }
      }

      const { logs, pagination: meta } = await this.service.getAuditLogs(
        filter,
        pagination,
        sort,
      );

      sendSuccessResponse(req, res, logs, 200, meta);
    } catch (error) {
      next(error);
    }
  };
}

export const auditController = new AuditController();
