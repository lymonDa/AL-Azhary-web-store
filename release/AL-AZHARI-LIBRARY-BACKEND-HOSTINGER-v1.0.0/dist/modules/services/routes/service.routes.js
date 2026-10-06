"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serviceRequestRouter = exports.serviceRouter = void 0;
const express_1 = require("express");
const service_controller_1 = require("../controllers/service.controller");
const quotation_controller_1 = require("../../quotations/controllers/quotation.controller");
const auth_middleware_1 = require("../../auth/middleware/auth.middleware");
// Public / Services Catalog Router (mounted at /services)
exports.serviceRouter = (0, express_1.Router)();
// GET /services
exports.serviceRouter.get('/', service_controller_1.serviceController.getServices);
// GET /services/:slug
exports.serviceRouter.get('/:slug', service_controller_1.serviceController.getServiceBySlug);
// POST /services/:slug/requests
exports.serviceRouter.post('/:slug/requests', (0, auth_middleware_1.optionalAuthentication)(), service_controller_1.serviceController.createServiceRequest);
// Customer Service Request Router (mounted at /service-requests)
exports.serviceRequestRouter = (0, express_1.Router)();
// GET /service-requests/:reference
exports.serviceRequestRouter.get('/:reference', (0, auth_middleware_1.optionalAuthentication)(), service_controller_1.serviceController.getServiceRequestByReference);
// POST /service-requests/:reference/quotation/accept
exports.serviceRequestRouter.post('/:reference/quotation/accept', (0, auth_middleware_1.optionalAuthentication)(), quotation_controller_1.quotationController.acceptQuotation);
// POST /service-requests/:reference/quotation/reject
exports.serviceRequestRouter.post('/:reference/quotation/reject', (0, auth_middleware_1.optionalAuthentication)(), quotation_controller_1.quotationController.rejectQuotation);
//# sourceMappingURL=service.routes.js.map