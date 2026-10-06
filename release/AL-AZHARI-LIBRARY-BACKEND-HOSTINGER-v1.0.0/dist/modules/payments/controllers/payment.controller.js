"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentController = exports.PaymentController = void 0;
const payment_service_1 = require("../services/payment.service");
const payment_schema_1 = require("../schemas/payment.schema");
const payment_projection_1 = require("../utils/payment.projection");
const response_util_1 = require("../../../common/utils/response.util");
const errors_1 = require("../../../common/errors");
class PaymentController {
    payments;
    constructor(payments = payment_service_1.paymentService) {
        this.payments = payments;
    }
    /**
     * Helper to extract payment access context from request (customer user, guest token header, or admin)
     */
    getAccessContext(req) {
        const guestToken = req.headers['x-guest-token'] || req.query.token;
        return {
            userId: req.user?.userId,
            role: req.user?.role,
            guestToken,
            requestId: String(req.id || ''),
            ipHash: req.ip,
        };
    }
    /**
     * GET /api/v1/orders/:reference/payment
     * Retrieve payment status, method instructions, and customer-safe proof history.
     */
    getPaymentByOrderReference = async (req, res, next) => {
        try {
            const { reference } = req.params;
            const access = this.getAccessContext(req);
            const result = await this.payments.getPaymentByOrderReference(reference, access);
            const safeData = (0, payment_projection_1.toSafeCustomerPaymentResponse)(result.payment, result.proofs);
            (0, response_util_1.sendSuccess)(req, res, safeData);
        }
        catch (error) {
            next(error);
        }
    };
    /**
     * POST /api/v1/orders/:reference/payment-proof/upload-config
     * Requests a constrained signed Cloudinary direct-upload policy for payment proof screenshots.
     */
    getUploadConfig = async (req, res, next) => {
        try {
            const { reference } = req.params;
            const access = this.getAccessContext(req);
            const result = await this.payments.generateProofUploadConfig(reference, access);
            (0, response_util_1.sendSuccess)(req, res, result.uploadConfig);
        }
        catch (error) {
            next(error);
        }
    };
    /**
     * POST /api/v1/orders/:reference/payment-proofs
     * Customer submits uploaded Cloudinary proof screenshots.
     */
    submitPaymentProof = async (req, res, next) => {
        try {
            const { reference } = req.params;
            const access = this.getAccessContext(req);
            const input = payment_schema_1.submitPaymentProofSchema.parse(req.body);
            const result = await this.payments.submitPaymentProof(reference, input, access);
            const safeData = (0, payment_projection_1.toSafeCustomerPaymentResponse)(result.payment, [result.proof]);
            (0, response_util_1.sendSuccess)(req, res, safeData, 201);
        }
        catch (error) {
            next(error);
        }
    };
    /**
     * GET /api/v1/admin/payments
     * Admin lists payment queue with pagination.
     */
    listAdminPayments = async (req, res, next) => {
        try {
            if (!req.user)
                throw new errors_1.UnauthorizedError('Authentication required');
            const query = payment_schema_1.paymentQuerySchema.parse(req.query);
            const result = await this.payments.listAdminPayments(query);
            (0, response_util_1.sendSuccess)(req, res, result.items.map((p) => (0, payment_projection_1.toSafeAdminPaymentResponse)(p)), 200, {
                page: result.page,
                limit: result.limit,
                total: result.total,
                totalPages: result.totalPages,
            });
        }
        catch (error) {
            next(error);
        }
    };
    /**
     * GET /api/v1/admin/payments/:paymentId
     * Admin gets payment and full proof details.
     */
    getAdminPaymentById = async (req, res, next) => {
        try {
            if (!req.user)
                throw new errors_1.UnauthorizedError('Authentication required');
            const { paymentId } = req.params;
            const result = await this.payments.getAdminPaymentById(paymentId);
            const safeData = (0, payment_projection_1.toSafeAdminPaymentResponse)(result.payment, result.proofs);
            (0, response_util_1.sendSuccess)(req, res, safeData);
        }
        catch (error) {
            next(error);
        }
    };
    /**
     * POST /api/v1/admin/payments/:paymentId/confirm
     * Admin confirms payment proof.
     */
    adminConfirmPayment = async (req, res, next) => {
        try {
            if (!req.user)
                throw new errors_1.UnauthorizedError('Authentication required');
            const { paymentId } = req.params;
            const input = payment_schema_1.adminConfirmPaymentSchema.parse(req.body);
            const result = await this.payments.adminConfirmPayment(paymentId, input, { id: req.user.userId, role: req.user.role });
            (0, response_util_1.sendSuccess)(req, res, (0, payment_projection_1.toSafeAdminPaymentResponse)(result.payment));
        }
        catch (error) {
            next(error);
        }
    };
    /**
     * POST /api/v1/admin/payments/:paymentId/reject
     * Admin rejects payment proof.
     */
    adminRejectPayment = async (req, res, next) => {
        try {
            if (!req.user)
                throw new errors_1.UnauthorizedError('Authentication required');
            const { paymentId } = req.params;
            const input = payment_schema_1.adminRejectPaymentSchema.parse(req.body);
            const result = await this.payments.adminRejectPayment(paymentId, input, { id: req.user.userId, role: req.user.role });
            (0, response_util_1.sendSuccess)(req, res, (0, payment_projection_1.toSafeAdminPaymentResponse)(result.payment));
        }
        catch (error) {
            next(error);
        }
    };
    /**
     * POST /api/v1/admin/payments/:paymentId/request-new-proof
     * Admin requests customer to upload new payment proof.
     */
    adminRequestNewProof = async (req, res, next) => {
        try {
            if (!req.user)
                throw new errors_1.UnauthorizedError('Authentication required');
            const { paymentId } = req.params;
            const input = payment_schema_1.adminRequestNewProofSchema.parse(req.body);
            const result = await this.payments.adminRequestNewProof(paymentId, input, { id: req.user.userId, role: req.user.role });
            (0, response_util_1.sendSuccess)(req, res, (0, payment_projection_1.toSafeAdminPaymentResponse)(result.payment));
        }
        catch (error) {
            next(error);
        }
    };
    /**
     * GET /api/v1/admin/payments/:paymentId/proofs/:submissionNumber/signed-url
     * Generates a short-lived signed URL for an authorized admin to view a private proof screenshot.
     */
    getProofSignedUrl = async (req, res, next) => {
        try {
            if (!req.user)
                throw new errors_1.UnauthorizedError('Authentication required');
            const { paymentId, submissionNumber } = req.params;
            const subNum = parseInt(submissionNumber, 10);
            const result = await this.payments.getProofSignedUrl(paymentId, subNum, { id: req.user.userId, role: req.user.role });
            (0, response_util_1.sendSuccess)(req, res, {
                signedUrl: result.signedUrl,
                expiresAt: result.expiresAt.toISOString(),
            });
        }
        catch (error) {
            next(error);
        }
    };
}
exports.PaymentController = PaymentController;
exports.paymentController = new PaymentController();
//# sourceMappingURL=payment.controller.js.map