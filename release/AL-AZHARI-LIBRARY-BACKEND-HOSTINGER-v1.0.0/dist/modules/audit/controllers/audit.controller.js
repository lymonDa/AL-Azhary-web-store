"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditController = exports.AuditController = void 0;
const audit_service_1 = require("../services/audit.service");
const audit_schema_1 = require("../schemas/audit.schema");
const envelope_1 = require("../../../common/http/envelope");
class AuditController {
    service;
    constructor(service = audit_service_1.auditService) {
        this.service = service;
    }
    getAuditLogs = async (req, res, next) => {
        try {
            const parsedQuery = audit_schema_1.listAuditLogsQuerySchema.parse(req.query);
            const filter = {
                entityType: parsedQuery.entityType,
                entityId: parsedQuery.entityId,
                action: parsedQuery.action,
                actorId: parsedQuery.actorId,
                actorRole: parsedQuery.actorRole,
                dateFrom: parsedQuery.dateFrom ? new Date(parsedQuery.dateFrom) : undefined,
                dateTo: parsedQuery.dateTo ? new Date(parsedQuery.dateTo) : undefined,
            };
            const pagination = {
                page: parsedQuery.page,
                limit: parsedQuery.limit,
                skip: (parsedQuery.page - 1) * parsedQuery.limit,
            };
            let sort = { field: 'createdAt', order: -1 };
            if (parsedQuery.sort) {
                if (parsedQuery.sort.startsWith('-')) {
                    sort = {
                        field: parsedQuery.sort.slice(1),
                        order: -1,
                    };
                }
                else {
                    sort = {
                        field: parsedQuery.sort,
                        order: 1,
                    };
                }
            }
            const { logs, pagination: meta } = await this.service.getAuditLogs(filter, pagination, sort);
            (0, envelope_1.sendSuccessResponse)(req, res, logs, 200, meta);
        }
        catch (error) {
            next(error);
        }
    };
}
exports.AuditController = AuditController;
exports.auditController = new AuditController();
//# sourceMappingURL=audit.controller.js.map