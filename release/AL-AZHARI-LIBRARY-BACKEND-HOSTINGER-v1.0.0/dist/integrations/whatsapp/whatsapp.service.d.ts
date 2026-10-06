import { WhatsAppContext, WhatsAppLinkAdapter, WhatsAppLinkResult, CustomerWhatsAppLinkResult } from './whatsapp.types';
export declare class WhatsAppLinkService implements WhatsAppLinkAdapter {
    private readonly supportPhone?;
    constructor(supportPhone?: string | undefined);
    /**
     * Resolves the configured support phone number.
     * If not configured, safely blocks with an Open Decision (OD-01) error.
     */
    private resolveSupportPhone;
    /**
     * Builds a WhatsApp URL for any valid phone number with safe contextual prefill.
     */
    buildUrl(phone: string, context?: WhatsAppContext): string;
    /**
     * Builds the official Library support WhatsApp URL (WA-001).
     */
    getSupportUrl(context?: WhatsAppContext): string;
    /**
     * Builds a WhatsApp URL for an Admin to contact a specific customer (WA-002).
     */
    getCustomerContactUrl(customerPhone: string, context?: WhatsAppContext): string;
    /**
     * Generates complete structured response for customer support link with disclaimers.
     * Confirms WhatsApp does not mutate authoritative records (WA-003).
     */
    getSupportLinkData(context?: WhatsAppContext): WhatsAppLinkResult;
    /**
     * Generates complete structured response for Admin contacting a customer with disclaimers.
     * Confirms WhatsApp does not mutate authoritative records (WA-003).
     */
    getCustomerLinkData(customerPhone: string, context?: WhatsAppContext): CustomerWhatsAppLinkResult;
}
export declare const whatsAppService: WhatsAppLinkService;
