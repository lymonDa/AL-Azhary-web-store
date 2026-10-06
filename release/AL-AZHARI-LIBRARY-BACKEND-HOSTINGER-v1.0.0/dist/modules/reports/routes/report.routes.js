"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminReportRouter = void 0;
const express_1 = require("express");
const auth_middleware_1 = require("../../auth/middleware/auth.middleware");
const rbac_middleware_1 = require("../../auth/middleware/rbac.middleware");
const report_controller_1 = require("../controllers/report.controller");
const router = (0, express_1.Router)();
/**
 * GET /api/v1/admin/reports/:report
 * Authoritative administrative aggregation reports.
 * Protected by authentication and RBAC permission "reports.read".
 */
router.use((0, auth_middleware_1.requireAuthentication)());
router.get('/:report', (0, rbac_middleware_1.requirePermission)('reports.read'), report_controller_1.reportController.getReport);
exports.adminReportRouter = router;
//# sourceMappingURL=report.routes.js.map