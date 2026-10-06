"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminPaymentRouter = exports.orderPaymentRouter = void 0;
const express_1 = require("express");
const payment_controller_1 = require("../controllers/payment.controller");
const auth_middleware_1 = require("../../auth/middleware/auth.middleware");
const rbac_middleware_1 = require("../../auth/middleware/rbac.middleware");
const security_1 = require("../../../config/security");
const env_1 = require("../../../config/env");
// 1. Order-scoped Customer / Guest Payment Routes
// Mounted under /orders in app.ts, or directly
exports.orderPaymentRouter = (0, express_1.Router)({ mergeParams: true });
if (env_1.env.NODE_ENV !== 'test') {
    exports.orderPaymentRouter.use('/:reference/payment-proof', security_1.proofUploadRateLimiter);
    exports.orderPaymentRouter.use('/:reference/payment-proofs', security_1.proofUploadRateLimiter);
}
exports.orderPaymentRouter.get('/:reference/payment', (0, auth_middleware_1.optionalAuthentication)(), payment_controller_1.paymentController.getPaymentByOrderReference);
exports.orderPaymentRouter.post('/:reference/payment-proof/upload-config', (0, auth_middleware_1.optionalAuthentication)(), payment_controller_1.paymentController.getUploadConfig);
exports.orderPaymentRouter.post('/:reference/payment-proofs', (0, auth_middleware_1.optionalAuthentication)(), payment_controller_1.paymentController.submitPaymentProof);
// 2. Admin Payments Management & Review Router
// Mounted under /api/v1/admin/payments
exports.adminPaymentRouter = (0, express_1.Router)();
exports.adminPaymentRouter.use((0, auth_middleware_1.requireAuthentication)());
// Review Queue
exports.adminPaymentRouter.get('/', (0, rbac_middleware_1.requirePermission)('payments.review'), payment_controller_1.paymentController.listAdminPayments);
// Get Payment & Proof Detail
exports.adminPaymentRouter.get('/:paymentId', (0, rbac_middleware_1.requirePermission)('payments.review'), payment_controller_1.paymentController.getAdminPaymentById);
// Admin Review Actions
exports.adminPaymentRouter.post('/:paymentId/confirm', (0, rbac_middleware_1.requirePermission)('payments.review'), payment_controller_1.paymentController.adminConfirmPayment);
exports.adminPaymentRouter.post('/:paymentId/reject', (0, rbac_middleware_1.requirePermission)('payments.review'), payment_controller_1.paymentController.adminRejectPayment);
exports.adminPaymentRouter.post('/:paymentId/request-new-proof', (0, rbac_middleware_1.requirePermission)('payments.review'), payment_controller_1.paymentController.adminRequestNewProof);
// Short-lived Signed URL generation for authorized proof inspection
exports.adminPaymentRouter.get('/:paymentId/proofs/:submissionNumber/signed-url', (0, rbac_middleware_1.requirePermission)('payments.review'), payment_controller_1.paymentController.getProofSignedUrl);
//# sourceMappingURL=payment.routes.js.map