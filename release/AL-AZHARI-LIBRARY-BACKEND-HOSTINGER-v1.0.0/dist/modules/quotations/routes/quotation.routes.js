"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminServiceRequestRouter = void 0;
const express_1 = require("express");
const quotation_controller_1 = require("../controllers/quotation.controller");
const auth_middleware_1 = require("../../auth/middleware/auth.middleware");
const rbac_middleware_1 = require("../../auth/middleware/rbac.middleware");
// Admin Service Requests / Quotes Router (mounted at /admin/service-requests)
exports.adminServiceRequestRouter = (0, express_1.Router)();
exports.adminServiceRequestRouter.use((0, auth_middleware_1.requireAuthentication)());
// POST /admin/service-requests/:reference/quotes
exports.adminServiceRequestRouter.post('/:reference/quotes', (0, rbac_middleware_1.requirePermission)('services.quote'), quotation_controller_1.quotationController.adminCreateQuote);
//# sourceMappingURL=quotation.routes.js.map