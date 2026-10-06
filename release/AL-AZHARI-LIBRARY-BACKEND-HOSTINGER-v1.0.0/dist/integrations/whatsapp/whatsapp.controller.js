"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.whatsAppController = exports.WhatsAppController = void 0;
const whatsapp_service_1 = require("./whatsapp.service");
const whatsapp_schema_1 = require("./whatsapp.schema");
const response_util_1 = require("../../common/utils/response.util");
class WhatsAppController {
    service;
    constructor(service = whatsapp_service_1.whatsAppService) {
        this.service = service;
    }
    /**
     * GET /api/v1/whatsapp/support
     * Customer / Public endpoint to generate safe, URL-encoded WhatsApp support link (WA-001).
     * Accompanied by authoritative disclaimer confirming chat does not mutate state (WA-003).
     */
    getSupportLink = (req, res, next) => {
        try {
            const query = whatsapp_schema_1.supportLinkQuerySchema.parse(req.query);
            const result = this.service.getSupportLinkData(query);
            (0, response_util_1.sendSuccess)(req, res, result);
        }
        catch (err) {
            next(err);
        }
    };
    /**
     * POST /api/v1/admin/whatsapp/customer-link
     * Admin endpoint to generate WhatsApp link for contacting a specific customer (WA-002).
     * Requires admin permission (orders.read or services.read).
     */
    getCustomerLink = (req, res, next) => {
        try {
            const body = whatsapp_schema_1.customerLinkBodySchema.parse(req.body);
            const { customerPhone, ...context } = body;
            const result = this.service.getCustomerLinkData(customerPhone, context);
            (0, response_util_1.sendSuccess)(req, res, result);
        }
        catch (err) {
            next(err);
        }
    };
}
exports.WhatsAppController = WhatsAppController;
exports.whatsAppController = new WhatsAppController();
//# sourceMappingURL=whatsapp.controller.js.map