"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listAuditLogsQuerySchema = void 0;
const zod_1 = require("zod");
const query_1 = require("../../../common/http/query");
exports.listAuditLogsQuerySchema = zod_1.z
    .object({
    page: zod_1.z.coerce.number().int().min(1).default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(20),
    entityType: zod_1.z
        .string()
        .trim()
        .max(100)
        .refine((v) => !(0, query_1.containsMongoOperator)(v), {
        message: 'entityType contains illegal characters',
    })
        .optional(),
    entityId: zod_1.z
        .string()
        .trim()
        .max(100)
        .refine((v) => !(0, query_1.containsMongoOperator)(v), {
        message: 'entityId contains illegal characters',
    })
        .optional(),
    action: zod_1.z
        .string()
        .trim()
        .max(100)
        .refine((v) => !(0, query_1.containsMongoOperator)(v), {
        message: 'action contains illegal characters',
    })
        .optional(),
    actorId: zod_1.z
        .string()
        .trim()
        .max(50)
        .refine((v) => !(0, query_1.containsMongoOperator)(v), {
        message: 'actorId contains illegal characters',
    })
        .optional(),
    actorRole: zod_1.z
        .string()
        .trim()
        .max(50)
        .refine((v) => !(0, query_1.containsMongoOperator)(v), {
        message: 'actorRole contains illegal characters',
    })
        .optional(),
    dateFrom: zod_1.z
        .string()
        .refine((val) => !isNaN(Date.parse(val)), {
        message: 'dateFrom must be a valid ISO date',
    })
        .optional(),
    dateTo: zod_1.z
        .string()
        .refine((val) => !isNaN(Date.parse(val)), {
        message: 'dateTo must be a valid ISO date',
    })
        .optional(),
    sort: zod_1.z.enum(['createdAt', '-createdAt', 'action', '-action']).optional(),
})
    .refine((data) => {
    if (data.dateFrom && data.dateTo) {
        return new Date(data.dateFrom).getTime() <= new Date(data.dateTo).getTime();
    }
    return true;
}, {
    message: 'dateFrom cannot be later than dateTo',
    path: ['dateFrom'],
});
//# sourceMappingURL=audit.schema.js.map