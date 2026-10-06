"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.returnsController = exports.ReturnsController = void 0;
const returns_service_1 = require("../services/returns.service");
const returns_schema_1 = require("../schemas/returns.schema");
const returns_projection_1 = require("../utils/returns.projection");
const response_util_1 = require("../../../common/utils/response.util");
class ReturnsController {
    service;
    constructor(service = returns_service_1.returnsService) {
        this.service = service;
    }
    /**
     * POST /api/v1/orders/:orderReference/returns
     * Customer submits return request for order items.
     */
    createReturnRequest = async (req, res, next) => {
        try {
            const { orderReference } = returns_schema_1.returnOrderReferenceParamSchema.parse(req.params);
            const input = returns_schema_1.createReturnRequestSchema.parse(req.body);
            const returnRequest = await this.service.createReturnRequest(orderReference, input, {
                userId: req.user.userId,
                role: req.user.role,
                requestId: String(req.id || ''),
                ipHash: req.ip,
            });
            (0, response_util_1.sendSuccess)(req, res, { returnRequest: (0, returns_projection_1.toSafeReturnRequest)(returnRequest) }, 201);
        }
        catch (err) {
            next(err);
        }
    };
    /**
     * GET /api/v1/returns/:reference
     * Customer or Admin retrieves return request.
     */
    getReturnRequest = async (req, res, next) => {
        try {
            const { reference } = returns_schema_1.returnReferenceParamSchema.parse(req.params);
            const returnRequest = await this.service.getReturnRequestByReference(reference, {
                userId: req.user.userId,
                role: req.user.role,
                requestId: String(req.id || ''),
                ipHash: req.ip,
            });
            (0, response_util_1.sendSuccess)(req, res, { returnRequest: (0, returns_projection_1.toSafeReturnRequest)(returnRequest) }, 200);
        }
        catch (err) {
            next(err);
        }
    };
    /**
     * GET /api/v1/returns
     * Customer lists their return requests.
     */
    listCustomerReturns = async (req, res, next) => {
        try {
            const query = returns_schema_1.listReturnsQuerySchema.parse(req.query);
            const result = await this.service.listCustomerReturns({
                userId: req.user.userId,
                role: req.user.role,
                requestId: String(req.id || ''),
                ipHash: req.ip,
            }, query);
            (0, response_util_1.sendSuccess)(req, res, {
                returns: result.items.map(returns_projection_1.toSafeReturnRequest),
                pagination: {
                    page: result.page,
                    limit: result.limit,
                    total: result.total,
                    totalPages: result.totalPages,
                },
            }, 200);
        }
        catch (err) {
            next(err);
        }
    };
    /**
     * GET /api/v1/admin/returns
     * Admin lists return requests queue.
     */
    listAdminReturns = async (req, res, next) => {
        try {
            const query = returns_schema_1.listReturnsQuerySchema.parse(req.query);
            const filter = {};
            if (query.status) {
                filter.status = query.status;
            }
            const result = await this.service.listAdminReturns(filter, query);
            (0, response_util_1.sendSuccess)(req, res, {
                returns: result.items.map(returns_projection_1.toSafeReturnRequest),
                pagination: {
                    page: result.page,
                    limit: result.limit,
                    total: result.total,
                    totalPages: result.totalPages,
                },
            }, 200);
        }
        catch (err) {
            next(err);
        }
    };
    /**
     * POST /api/v1/admin/returns/:reference/approve
     * Admin approves return request & initiates refund atomically.
     */
    adminApproveReturn = async (req, res, next) => {
        try {
            const { reference } = returns_schema_1.returnReferenceParamSchema.parse(req.params);
            const input = returns_schema_1.adminReviewReturnSchema.parse(req.body);
            const result = await this.service.adminApproveReturn(reference, input, {
                userId: req.user.userId,
                role: req.user.role,
                requestId: String(req.id || ''),
                ipHash: req.ip,
            });
            (0, response_util_1.sendSuccess)(req, res, {
                returnRequest: (0, returns_projection_1.toSafeReturnRequest)(result.returnRequest),
                refund: (0, returns_projection_1.toSafeRefund)(result.refund),
            }, 200);
        }
        catch (err) {
            next(err);
        }
    };
    /**
     * POST /api/v1/admin/returns/:reference/reject
     * Admin rejects return request.
     */
    adminRejectReturn = async (req, res, next) => {
        try {
            const { reference } = returns_schema_1.returnReferenceParamSchema.parse(req.params);
            const input = returns_schema_1.adminReviewReturnSchema.parse(req.body);
            const returnRequest = await this.service.adminRejectReturn(reference, input, {
                userId: req.user.userId,
                role: req.user.role,
                requestId: String(req.id || ''),
                ipHash: req.ip,
            });
            (0, response_util_1.sendSuccess)(req, res, { returnRequest: (0, returns_projection_1.toSafeReturnRequest)(returnRequest) }, 200);
        }
        catch (err) {
            next(err);
        }
    };
    /**
     * GET /api/v1/admin/refunds
     * Admin lists refunds queue.
     */
    listAdminRefunds = async (req, res, next) => {
        try {
            const query = returns_schema_1.listRefundsQuerySchema.parse(req.query);
            const filter = {};
            if (query.status) {
                filter.status = query.status;
            }
            const result = await this.service.listAdminRefunds(filter, query);
            (0, response_util_1.sendSuccess)(req, res, {
                refunds: result.items.map(returns_projection_1.toSafeRefund),
                pagination: {
                    page: result.page,
                    limit: result.limit,
                    total: result.total,
                    totalPages: result.totalPages,
                },
            }, 200);
        }
        catch (err) {
            next(err);
        }
    };
    /**
     * GET /api/v1/admin/refunds/:id
     * Admin retrieves refund by ID.
     */
    getRefund = async (req, res, next) => {
        try {
            const { id } = returns_schema_1.refundIdParamSchema.parse(req.params);
            const refund = await this.service.getRefundById(id, {
                userId: req.user.userId,
                role: req.user.role,
                requestId: String(req.id || ''),
                ipHash: req.ip,
            });
            (0, response_util_1.sendSuccess)(req, res, { refund: (0, returns_projection_1.toSafeRefund)(refund) }, 200);
        }
        catch (err) {
            next(err);
        }
    };
    /**
     * POST /api/v1/admin/refunds/:id/complete
     * Admin completes manual refund.
     */
    adminCompleteRefund = async (req, res, next) => {
        try {
            const { id } = returns_schema_1.refundIdParamSchema.parse(req.params);
            const input = returns_schema_1.completeRefundSchema.parse(req.body);
            const result = await this.service.adminCompleteRefund(id, input, {
                userId: req.user.userId,
                role: req.user.role,
                requestId: String(req.id || ''),
                ipHash: req.ip,
            });
            (0, response_util_1.sendSuccess)(req, res, {
                refund: (0, returns_projection_1.toSafeRefund)(result.refund),
                returnRequest: (0, returns_projection_1.toSafeReturnRequest)(result.returnRequest),
            }, 200);
        }
        catch (err) {
            next(err);
        }
    };
    /**
     * POST /api/v1/admin/refunds/:id/fail
     * Admin records refund failure.
     */
    adminFailRefund = async (req, res, next) => {
        try {
            const { id } = returns_schema_1.refundIdParamSchema.parse(req.params);
            const input = returns_schema_1.failRefundSchema.parse(req.body);
            const refund = await this.service.adminFailRefund(id, input, {
                userId: req.user.userId,
                role: req.user.role,
                requestId: String(req.id || ''),
                ipHash: req.ip,
            });
            (0, response_util_1.sendSuccess)(req, res, { refund: (0, returns_projection_1.toSafeRefund)(refund) }, 200);
        }
        catch (err) {
            next(err);
        }
    };
}
exports.ReturnsController = ReturnsController;
exports.returnsController = new ReturnsController();
//# sourceMappingURL=returns.controller.js.map