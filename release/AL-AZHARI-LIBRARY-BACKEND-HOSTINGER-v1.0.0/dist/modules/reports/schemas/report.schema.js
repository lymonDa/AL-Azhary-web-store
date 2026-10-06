"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportQuerySchema = exports.reportParamSchema = void 0;
const zod_1 = require("zod");
const report_types_1 = require("../types/report.types");
const query_1 = require("../../../common/http/query");
exports.reportParamSchema = zod_1.z.object({
    report: zod_1.z.enum(report_types_1.REPORT_TYPES, {
        errorMap: () => ({
            message: `Invalid report type. Supported reports: ${report_types_1.REPORT_TYPES.join(', ')}`,
        }),
    }),
});
exports.reportQuerySchema = zod_1.z
    .object({
    dateFrom: zod_1.z
        .string()
        .trim()
        .refine((val) => !isNaN(Date.parse(val)), {
        message: 'dateFrom must be a valid ISO date string',
    })
        .optional(),
    dateTo: zod_1.z
        .string()
        .trim()
        .refine((val) => !isNaN(Date.parse(val)), {
        message: 'dateTo must be a valid ISO date string',
    })
        .optional(),
    status: zod_1.z
        .string()
        .trim()
        .max(50)
        .refine((v) => !(0, query_1.containsMongoOperator)(v), {
        message: 'status filter contains prohibited operator characters',
    })
        .optional(),
    geography: zod_1.z
        .string()
        .trim()
        .max(100)
        .refine((v) => !(0, query_1.containsMongoOperator)(v), {
        message: 'geography filter contains prohibited operator characters',
    })
        .optional(),
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
//# sourceMappingURL=report.schema.js.map