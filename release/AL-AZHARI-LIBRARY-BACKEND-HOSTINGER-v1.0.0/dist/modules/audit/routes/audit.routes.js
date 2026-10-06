"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminAuditRouter = void 0;
const express_1 = require("express");
const auth_middleware_1 = require("../../auth/middleware/auth.middleware");
const rbac_middleware_1 = require("../../auth/middleware/rbac.middleware");
const audit_controller_1 = require("../controllers/audit.controller");
const router = (0, express_1.Router)();
/**
 * GET /api/v1/admin/audit-logs
 * Strictly read-only, paginated, filtered audit log query endpoint.
 * Protected by authentication and RBAC permission "audit.read".
 */
router.use((0, auth_middleware_1.requireAuthentication)());
router.get('/', (0, rbac_middleware_1.requirePermission)('audit.read'), audit_controller_1.auditController.getAuditLogs);
exports.adminAuditRouter = router;
//# sourceMappingURL=audit.routes.js.map