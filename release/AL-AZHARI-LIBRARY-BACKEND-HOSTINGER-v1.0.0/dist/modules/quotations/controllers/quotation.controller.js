"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.quotationController = exports.QuotationController = void 0;
const quotation_service_1 = require("../services/quotation.service");
const quotation_schema_1 = require("../schemas/quotation.schema");
const service_schema_1 = require("../../services/schemas/service.schema");
const service_projection_1 = require("../../services/utils/service.projection");
const response_util_1 = require("../../../common/utils/response.util");
class QuotationController {
    quotations;
    constructor(quotations = quotation_service_1.quotationService) {
        this.quotations = quotations;
    }
    /**
     * POST /api/v1/admin/service-requests/:reference/quotes
     * Admin creates and sends a quotation for a service request.
     * Permission: services.quote
     */
    adminCreateQuote = async (req, res, next) => {
        try {
            const { reference } = service_schema_1.serviceReferenceParamSchema.parse(req.params);
            const input = quotation_schema_1.createQuoteSchema.parse(req.body);
            const quotation = await this.quotations.createAndSendQuotation(reference, input, {
                userId: req.user.userId,
                role: req.user.role,
                requestId: String(req.id || ''),
                ipHash: req.ip,
            });
            (0, response_util_1.sendSuccess)(req, res, { quotation }, 201);
        }
        catch (err) {
            next(err);
        }
    };
    /**
     * POST /api/v1/service-requests/:reference/quotation/accept
     * Customer / Guest accepts quotation.
     * Advances service request to awaiting_payment and activates payment.
     */
    acceptQuotation = async (req, res, next) => {
        try {
            const { reference } = service_schema_1.serviceReferenceParamSchema.parse(req.params);
            const input = quotation_schema_1.acceptQuoteSchema.parse(req.body);
            const guestToken = req.headers['x-guest-token'] || req.query.token || undefined;
            const result = await this.quotations.acceptQuotation(reference, input, {
                userId: req.user?.userId,
                role: req.user?.role,
                guestToken,
                requestId: String(req.id || ''),
                ipHash: req.ip,
            });
            (0, response_util_1.sendSuccess)(req, res, {
                quotation: result.quotation,
                serviceRequest: (0, service_projection_1.toSafeServiceRequest)(result.serviceRequest, result.quotation),
                payment: result.payment,
            });
        }
        catch (err) {
            next(err);
        }
    };
    /**
     * POST /api/v1/service-requests/:reference/quotation/reject
     * Customer / Guest rejects quotation.
     * Closes request without creating payment.
     */
    rejectQuotation = async (req, res, next) => {
        try {
            const { reference } = service_schema_1.serviceReferenceParamSchema.parse(req.params);
            const input = quotation_schema_1.rejectQuoteSchema.parse(req.body);
            const guestToken = req.headers['x-guest-token'] || req.query.token || undefined;
            const result = await this.quotations.rejectQuotation(reference, input, {
                userId: req.user?.userId,
                role: req.user?.role,
                guestToken,
                requestId: String(req.id || ''),
                ipHash: req.ip,
            });
            (0, response_util_1.sendSuccess)(req, res, {
                quotation: result.quotation,
                serviceRequest: (0, service_projection_1.toSafeServiceRequest)(result.serviceRequest, result.quotation),
            });
        }
        catch (err) {
            next(err);
        }
    };
}
exports.QuotationController = QuotationController;
exports.quotationController = new QuotationController();
//# sourceMappingURL=quotation.controller.js.map