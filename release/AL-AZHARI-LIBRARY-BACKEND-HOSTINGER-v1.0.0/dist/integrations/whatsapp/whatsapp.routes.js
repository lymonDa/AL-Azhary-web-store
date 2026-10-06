"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminWhatsappRouter = exports.customerWhatsappRouter = void 0;
const express_1 = require("express");
const whatsapp_controller_1 = require("./whatsapp.controller");
const auth_middleware_1 = require("../../modules/auth/middleware/auth.middleware");
const rbac_middleware_1 = require("../../modules/auth/middleware/rbac.middleware");
/**
 * Customer / Storefront WhatsApp Router (mounted at /whatsapp)
 * Publicly accessible support link generation (WA-001)
 */
exports.customerWhatsappRouter = (0, express_1.Router)();
exports.customerWhatsappRouter.get('/support', (0, auth_middleware_1.optionalAuthentication)(), whatsapp_controller_1.whatsAppController.getSupportLink);
exports.customerWhatsappRouter.get('/link', (0, auth_middleware_1.optionalAuthentication)(), whatsapp_controller_1.whatsAppController.getSupportLink);
/**
 * Admin WhatsApp Router (mounted at /admin/whatsapp)
 * Requires authenticated admin with 'orders.read' permission (WA-002)
 */
exports.adminWhatsappRouter = (0, express_1.Router)();
exports.adminWhatsappRouter.use((0, auth_middleware_1.requireAuthentication)());
exports.adminWhatsappRouter.use((0, rbac_middleware_1.requirePermission)('orders.read'));
exports.adminWhatsappRouter.post('/customer-link', whatsapp_controller_1.whatsAppController.getCustomerLink);
//# sourceMappingURL=whatsapp.routes.js.map