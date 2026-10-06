"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditService = exports.AuditService = void 0;
const mongoose_1 = require("mongoose");
const crypto_1 = __importDefault(require("crypto"));
const audit_repository_1 = require("../repositories/audit.repository");
const redact_1 = require("../../../common/security/redact");
const logger_1 = require("../../../config/logger");
const pagination_1 = require("../../../common/http/pagination");
class AuditService {
    repo;
    constructor(repo = audit_repository_1.auditRepository) {
        this.repo = repo;
    }
    /**
     * Records an audit log entry with strict sanitization/redaction of sensitive fields.
     * If a session is provided, the record participates in the caller's transaction.
     * If a dedupeKey is specified and already exists, duplicate recording is prevented.
     */
    async record(input, options) {
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
                ipHash = crypto_1.default.createHash('sha256').update(input.ip.trim()).digest('hex');
            }
            // Sanitize and redact snapshots and metadata
            const sanitizedPrevious = input.previousState
                ? (0, redact_1.redactSensitiveData)(input.previousState)
                : null;
            const sanitizedNew = input.newState
                ? (0, redact_1.redactSensitiveData)(input.newState)
                : null;
            const sanitizedMetadata = input.metadata
                ? (0, redact_1.redactSensitiveData)(input.metadata)
                : null;
            const entityType = (input.entityType ?? input.targetType ?? 'Unknown').trim();
            const entityId = String(input.entityId ?? input.targetId ?? '').trim();
            await this.repo.create({
                actorId: input.actorId ? new mongoose_1.Types.ObjectId(input.actorId) : null,
                actorRole: input.actorRole ?? 'system',
                action: input.action,
                entityType,
                entityId,
                previousState: sanitizedPrevious,
                newState: sanitizedNew,
                reason: input.reason ?? null,
                metadata: sanitizedMetadata,
                requestId: input.requestId ?? null,
                ipHash,
                dedupeKey: input.dedupeKey ?? null,
                createdAt: new Date(),
            }, { session });
        }
        catch (error) {
            logger_1.logger.error({ err: error, action: input.action, entityId: input.entityId ?? input.targetId }, 'Failed to write audit log');
            // In transactions, rethrow to guarantee atomic abort
            if (session) {
                throw error;
            }
        }
    }
    /**
     * Retrieves paginated audit logs with safe projections and read-time redaction.
     */
    async getAuditLogs(filter, pagination, sort) {
        const { logs, total } = await this.repo.findWithPagination(filter, { skip: pagination.skip, limit: pagination.limit }, sort);
        // Deep sanitize on read as defense-in-depth
        const safeLogs = logs.map((log) => {
            const sanitized = (0, redact_1.redactSensitiveData)(log);
            return sanitized;
        });
        const paginationMeta = (0, pagination_1.createPaginationMeta)({
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
exports.AuditService = AuditService;
exports.auditService = new AuditService();
//# sourceMappingURL=audit.service.js.map