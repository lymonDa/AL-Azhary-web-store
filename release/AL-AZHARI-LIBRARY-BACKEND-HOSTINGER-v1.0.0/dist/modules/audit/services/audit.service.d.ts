import { ClientSession } from 'mongoose';
import { AuditRepository } from '../repositories/audit.repository';
import { AuditLogFilter, AuditLogSortOptions, CreateAuditLogInput, IAuditLog } from '../types/audit.types';
import { PaginationParams } from '../../../common/http/pagination';
import { PaginationMeta } from '../../../common/types/response';
export interface PaginatedAuditLogsResult {
    logs: IAuditLog[];
    pagination: PaginationMeta;
}
export declare class AuditService {
    private readonly repo;
    constructor(repo?: AuditRepository);
    /**
     * Records an audit log entry with strict sanitization/redaction of sensitive fields.
     * If a session is provided, the record participates in the caller's transaction.
     * If a dedupeKey is specified and already exists, duplicate recording is prevented.
     */
    record(input: CreateAuditLogInput, options?: {
        session?: ClientSession | null;
    }): Promise<void>;
    /**
     * Retrieves paginated audit logs with safe projections and read-time redaction.
     */
    getAuditLogs(filter: AuditLogFilter, pagination: PaginationParams, sort?: AuditLogSortOptions): Promise<PaginatedAuditLogsResult>;
}
export declare const auditService: AuditService;
