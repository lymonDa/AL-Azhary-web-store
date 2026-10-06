"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminPreorderRouter = exports.customerPreorderRouter = exports.productPreorderRouter = void 0;
const express_1 = require("express");
const preorder_controller_1 = require("../controllers/preorder.controller");
const auth_middleware_1 = require("../../auth/middleware/auth.middleware");
const rbac_middleware_1 = require("../../auth/middleware/rbac.middleware");
/**
 * Product-scoped Pre-order Router (mounted at /products)
 * POST /api/v1/products/:slug/pre-orders
 */
exports.productPreorderRouter = (0, express_1.Router)();
exports.productPreorderRouter.post('/:slug/pre-orders', (0, auth_middleware_1.optionalAuthentication)(), preorder_controller_1.preorderController.createPreorder);
/**
 * Customer Pre-order Router (mounted at /pre-orders)
 * Requires authenticated customer
 */
exports.customerPreorderRouter = (0, express_1.Router)();
exports.customerPreorderRouter.use((0, auth_middleware_1.requireAuthentication)());
// GET /api/v1/pre-orders (List customer's own pre-orders, or admin list if admin)
exports.customerPreorderRouter.get('/', preorder_controller_1.preorderController.listPreorders);
// GET /api/v1/pre-orders/:reference (Retrieve single pre-order with ownership validation)
exports.customerPreorderRouter.get('/:reference', preorder_controller_1.preorderController.getPreorderByReference);
// POST /api/v1/pre-orders/:reference/cancel (Cancel pre-order request)
exports.customerPreorderRouter.post('/:reference/cancel', preorder_controller_1.preorderController.cancelPreorder);
/**
 * Admin Pre-order Router (mounted at /admin/pre-orders)
 * Requires authenticated user with 'preorders.write' permission
 */
exports.adminPreorderRouter = (0, express_1.Router)();
exports.adminPreorderRouter.use((0, auth_middleware_1.requireAuthentication)());
exports.adminPreorderRouter.use((0, rbac_middleware_1.requirePermission)('preorders.write'));
// GET /api/v1/admin/pre-orders
exports.adminPreorderRouter.get('/', preorder_controller_1.preorderController.adminListPreorders);
// GET /api/v1/admin/pre-orders/:reference
exports.adminPreorderRouter.get('/:reference', preorder_controller_1.preorderController.getPreorderByReference);
// POST /api/v1/admin/pre-orders/:reference/accept
exports.adminPreorderRouter.post('/:reference/accept', preorder_controller_1.preorderController.adminAcceptPreorder);
// POST /api/v1/admin/pre-orders/:reference/reject
exports.adminPreorderRouter.post('/:reference/reject', preorder_controller_1.preorderController.adminRejectPreorder);
// POST /api/v1/admin/pre-orders/:reference/available
exports.adminPreorderRouter.post('/:reference/available', preorder_controller_1.preorderController.adminMarkAvailable);
// POST /api/v1/admin/pre-orders/:reference/cancel
exports.adminPreorderRouter.post('/:reference/cancel', preorder_controller_1.preorderController.cancelPreorder);
//# sourceMappingURL=preorder.routes.js.map