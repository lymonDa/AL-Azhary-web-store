"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationIdParamSchema = exports.notificationQuerySchema = void 0;
const zod_1 = require("zod");
const common_validators_1 = require("../../../common/validators/common.validators");
exports.notificationQuerySchema = zod_1.z.object({
    page: (0, common_validators_1.positiveInteger)('Page').optional().default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(100).optional().default(20),
    unreadOnly: (0, common_validators_1.booleanCoerce)().optional(),
});
exports.notificationIdParamSchema = zod_1.z.object({
    id: (0, common_validators_1.objectIdSchema)('Notification ID'),
});
//# sourceMappingURL=notification.schema.js.map