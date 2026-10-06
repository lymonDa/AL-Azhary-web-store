"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminShippingRouter = void 0;
const express_1 = require("express");
const shipping_controller_1 = require("../controllers/shipping.controller");
const auth_middleware_1 = require("../../auth/middleware/auth.middleware");
const rbac_middleware_1 = require("../../auth/middleware/rbac.middleware");
exports.adminShippingRouter = (0, express_1.Router)();
exports.adminShippingRouter.use((0, auth_middleware_1.requireAuthentication)());
exports.adminShippingRouter.post('/rules', (0, rbac_middleware_1.requirePermission)('shipping.write'), shipping_controller_1.shippingController.createRule);
exports.adminShippingRouter.get('/rules', (0, rbac_middleware_1.requirePermission)('shipping.read'), shipping_controller_1.shippingController.listRules);
exports.adminShippingRouter.get('/rules/:id', (0, rbac_middleware_1.requirePermission)('shipping.read'), shipping_controller_1.shippingController.getRuleById);
exports.adminShippingRouter.patch('/rules/:id', (0, rbac_middleware_1.requirePermission)('shipping.write'), shipping_controller_1.shippingController.updateRule);
exports.adminShippingRouter.delete('/rules/:id', (0, rbac_middleware_1.requirePermission)('shipping.write'), shipping_controller_1.shippingController.deleteRule);
//# sourceMappingURL=shipping.routes.js.map