"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminRefundRouter = exports.adminReturnRouter = exports.orderReturnsRouter = exports.customerReturnRouter = void 0;
const express_1 = require("express");
const returns_controller_1 = require("../controllers/returns.controller");
const auth_middleware_1 = require("../../auth/middleware/auth.middleware");
const rbac_middleware_1 = require("../../auth/middleware/rbac.middleware");
// ─── Customer Returns Router (mounted at /returns and /orders) ───────────────────
exports.customerReturnRouter = (0, express_1.Router)();
exports.customerReturnRouter.use((0, auth_middleware_1.requireAuthentication)());
// GET /returns
exports.customerReturnRouter.get('/', returns_controller_1.returnsController.listCustomerReturns);
// GET /returns/:reference
exports.customerReturnRouter.get('/:reference', returns_controller_1.returnsController.getReturnRequest);
// Order Returns Sub-router (mounted at /orders/:orderReference/returns)
exports.orderReturnsRouter = (0, express_1.Router)({ mergeParams: true });
exports.orderReturnsRouter.use((0, auth_middleware_1.requireAuthentication)());
// POST /orders/:orderReference/returns
exports.orderReturnsRouter.post('/', returns_controller_1.returnsController.createReturnRequest);
// ─── Admin Returns & Refunds Router ─────────────────────────────────────────────
exports.adminReturnRouter = (0, express_1.Router)();
exports.adminReturnRouter.use((0, auth_middleware_1.requireAuthentication)());
// GET /admin/returns
exports.adminReturnRouter.get('/', (0, rbac_middleware_1.requirePermission)('returns.write'), returns_controller_1.returnsController.listAdminReturns);
// GET /admin/returns/:reference
exports.adminReturnRouter.get('/:reference', (0, rbac_middleware_1.requirePermission)('returns.write'), returns_controller_1.returnsController.getReturnRequest);
// POST /admin/returns/:reference/approve
exports.adminReturnRouter.post('/:reference/approve', (0, rbac_middleware_1.requirePermission)('returns.write'), returns_controller_1.returnsController.adminApproveReturn);
// POST /admin/returns/:reference/reject
exports.adminReturnRouter.post('/:reference/reject', (0, rbac_middleware_1.requirePermission)('returns.write'), returns_controller_1.returnsController.adminRejectReturn);
// ─── Admin Refunds Router ───────────────────────────────────────────────────────
exports.adminRefundRouter = (0, express_1.Router)();
exports.adminRefundRouter.use((0, auth_middleware_1.requireAuthentication)());
// GET /admin/refunds
exports.adminRefundRouter.get('/', (0, rbac_middleware_1.requirePermission)('refunds.write'), returns_controller_1.returnsController.listAdminRefunds);
// GET /admin/refunds/:id
exports.adminRefundRouter.get('/:id', (0, rbac_middleware_1.requirePermission)('refunds.write'), returns_controller_1.returnsController.getRefund);
// POST /admin/refunds/:id/complete
exports.adminRefundRouter.post('/:id/complete', (0, rbac_middleware_1.requirePermission)('refunds.write'), returns_controller_1.returnsController.adminCompleteRefund);
// POST /admin/refunds/:id/fail
exports.adminRefundRouter.post('/:id/fail', (0, rbac_middleware_1.requirePermission)('refunds.write'), returns_controller_1.returnsController.adminFailRefund);
//# sourceMappingURL=returns.routes.js.map