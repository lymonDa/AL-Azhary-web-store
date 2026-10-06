"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.whatsAppService = exports.WhatsAppLinkService = void 0;
const env_1 = require("../../config/env");
const errors_1 = require("../../common/errors");
const errorCodes_1 = require("../../common/errors/errorCodes");
const whatsapp_builder_1 = require("./whatsapp.builder");
class WhatsAppLinkService {
    supportPhone;
    constructor(supportPhone) {
        this.supportPhone = supportPhone;
    }
    /**
     * Resolves the configured support phone number.
     * If not configured, safely blocks with an Open Decision (OD-01) error.
     */
    resolveSupportPhone() {
        const phone = this.supportPhone !== undefined ? this.supportPhone : env_1.env.WHATSAPP_PHONE;
        if (!phone || !phone.trim()) {
            throw new errors_1.BusinessRuleViolationError(errorCodes_1.ErrorCodes.BUSINESS_RULE_VIOLATION, 'Library WhatsApp support phone number is not configured (OD-01 open decision). Please configure WHATSAPP_PHONE in environment.');
        }
        return phone.trim();
    }
    /**
     * Builds a WhatsApp URL for any valid phone number with safe contextual prefill.
     */
    buildUrl(phone, context) {
        return (0, whatsapp_builder_1.buildWhatsAppUrl)(phone, context);
    }
    /**
     * Builds the official Library support WhatsApp URL (WA-001).
     */
    getSupportUrl(context) {
        const phone = this.resolveSupportPhone();
        return (0, whatsapp_builder_1.buildWhatsAppUrl)(phone, context);
    }
    /**
     * Builds a WhatsApp URL for an Admin to contact a specific customer (WA-002).
     */
    getCustomerContactUrl(customerPhone, context) {
        return (0, whatsapp_builder_1.buildWhatsAppUrl)(customerPhone, context);
    }
    /**
     * Generates complete structured response for customer support link with disclaimers.
     * Confirms WhatsApp does not mutate authoritative records (WA-003).
     */
    getSupportLinkData(context) {
        const url = this.getSupportUrl(context);
        return {
            url,
            disclaimer: whatsapp_builder_1.WHATSAPP_DISCLAIMER_AR,
            disclaimerEn: whatsapp_builder_1.WHATSAPP_DISCLAIMER_EN,
            context: {
                product: context?.product?.trim() || undefined,
                orderReference: context?.orderReference?.trim() || undefined,
                serviceReference: context?.serviceReference?.trim() || undefined,
            },
        };
    }
    /**
     * Generates complete structured response for Admin contacting a customer with disclaimers.
     * Confirms WhatsApp does not mutate authoritative records (WA-003).
     */
    getCustomerLinkData(customerPhone, context) {
        const cleanPhone = (0, whatsapp_builder_1.normalizeWhatsAppPhone)(customerPhone);
        const url = this.getCustomerContactUrl(cleanPhone, context);
        return {
            url,
            disclaimer: whatsapp_builder_1.WHATSAPP_DISCLAIMER_AR,
            disclaimerEn: whatsapp_builder_1.WHATSAPP_DISCLAIMER_EN,
            customerPhone: cleanPhone,
            context: {
                product: context?.product?.trim() || undefined,
                orderReference: context?.orderReference?.trim() || undefined,
                serviceReference: context?.serviceReference?.trim() || undefined,
            },
        };
    }
}
exports.WhatsAppLinkService = WhatsAppLinkService;
exports.whatsAppService = new WhatsAppLinkService();
//# sourceMappingURL=whatsapp.service.js.map