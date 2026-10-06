"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditRepository = exports.AuditRepository = void 0;
const mongoose_1 = require("mongoose");
const audit_log_model_1 = require("../models/audit-log.model");
class AuditRepository {
    async create(doc, options) {
        const session = options?.session ?? undefined;
        if (session) {
            const [created] = await audit_log_model_1.AuditLogModel.create([doc], { session });
            return created;
        }
        return audit_log_model_1.AuditLogModel.create(doc);
    }
    async findByDedupeKey(dedupeKey, options) {
        const query = audit_log_model_1.AuditLogModel.findOne({ dedupeKey });
        if (options?.session) {
            query.session(options.session);
        }
        return query.exec();
    }
    async findWithPagination(filter, pagination, sort = { field: 'createdAt', order: -1 }) {
        const query = this.buildFilterQuery(filter);
        const sortField = sort.field || 'createdAt';
        const sortOrder = sort.order || -1;
        const [logs, total] = await Promise.all([
            audit_log_model_1.AuditLogModel.find(query)
                .sort({ [sortField]: sortOrder })
                .skip(pagination.skip)
                .limit(pagination.limit)
                .lean()
                .exec(),
            audit_log_model_1.AuditLogModel.countDocuments(query).exec(),
        ]);
        return { logs: logs, total };
    }
    buildFilterQuery(filter) {
        const query = {};
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
            if (mongoose_1.Types.ObjectId.isValid(filter.actorId)) {
                query.actorId = new mongoose_1.Types.ObjectId(filter.actorId);
            }
            else {
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
exports.AuditRepository = AuditRepository;
exports.auditRepository = new AuditRepository();
//# sourceMappingURL=audit.repository.js.map