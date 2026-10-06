import { ClientSession } from 'mongoose';
import { AuditLogFilter, AuditLogSortOptions, IAuditLogDocument } from '../types/audit.types';
export declare class AuditRepository {
    create(doc: Partial<IAuditLogDocument>, options?: {
        session?: ClientSession | null;
    }): Promise<IAuditLogDocument>;
    findByDedupeKey(dedupeKey: string, options?: {
        session?: ClientSession | null;
    }): Promise<IAuditLogDocument | null>;
    findWithPagination(filter: AuditLogFilter, pagination: {
        skip: number;
        limit: number;
    }, sort?: AuditLogSortOptions): Promise<{
        logs: IAuditLogDocument[];
        total: number;
    }>;
    private buildFilterQuery;
}
export declare const auditRepository: AuditRepository;
