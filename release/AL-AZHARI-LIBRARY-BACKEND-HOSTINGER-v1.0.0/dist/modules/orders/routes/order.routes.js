"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminOrderRouter = exports.checkoutRouter = exports.orderRouter = void 0;
const express_1 = require("express");
const order_controller_1 = require("../controllers/order.controller");
const auth_middleware_1 = require("../../auth/middleware/auth.middleware");
const rbac_middleware_1 = require("../../auth/middleware/rbac.middleware");
const security_1 = require("../../../config/security");
const env_1 = require("../../../config/env");
// 1. Customer / Public Checkout & Order routes
exports.orderRouter = (0, express_1.Router)();
if (env_1.env.NODE_ENV !== 'test') {
    exports.orderRouter.use(security_1.guestOrderRateLimiter);
}
// POST /orders (guest or registered)
exports.orderRouter.post('/', (0, auth_middleware_1.optionalAuthentication)(), order_controller_1.orderController.createOrder);
// GET /orders/:reference
exports.orderRouter.get('/:reference', (0, auth_middleware_1.optionalAuthentication)(), order_controller_1.orderController.getOrderByReference);
// PATCH /orders/:reference (pending_review edit)
exports.orderRouter.patch('/:reference', (0, auth_middleware_1.optionalAuthentication)(), order_controller_1.orderController.updatePendingOrder);
// POST /orders/:reference/cancel
exports.orderRouter.post('/:reference/cancel', (0, auth_middleware_1.optionalAuthentication)(), order_controller_1.orderController.cancelOrder);
// POST /orders/:reference/confirm-cod
exports.orderRouter.post('/:reference/confirm-cod', (0, auth_middleware_1.optionalAuthentication)(), order_controller_1.orderController.confirmCodOrder);
// 2. Checkout helper router for /checkout/shipping-estimate
exports.checkoutRouter = (0, express_1.Router)();
exports.checkoutRouter.post('/shipping-estimate', (0, auth_middleware_1.optionalAuthentication)(), order_controller_1.orderController.estimateShipping);
// 3. Admin Orders router
exports.adminOrderRouter = (0, express_1.Router)();
exports.adminOrderRouter.use((0, auth_middleware_1.requireAuthentication)());
exports.adminOrderRouter.get('/', (0, rbac_middleware_1.requirePermission)('orders.read'), order_controller_1.orderController.listAdminOrders);
exports.adminOrderRouter.get('/:reference', (0, rbac_middleware_1.requirePermission)('orders.read'), order_controller_1.orderController.getAdminOrderByReference);
exports.adminOrderRouter.post('/:reference/accept', (0, rbac_middleware_1.requirePermission)('orders.accept'), order_controller_1.orderController.adminAcceptOrder);
exports.adminOrderRouter.post('/:reference/reject', (0, rbac_middleware_1.requirePermission)('orders.write'), order_controller_1.orderController.adminRejectOrder);
exports.adminOrderRouter.post('/:reference/status', (0, rbac_middleware_1.requirePermission)('orders.write'), order_controller_1.orderController.adminUpdateOrderStatus);
exports.adminOrderRouter.post('/:reference/shipping', (0, rbac_middleware_1.requirePermission)('orders.write'), order_controller_1.orderController.adminUpdateShipping);
//# sourceMappingURL=order.routes.js.map