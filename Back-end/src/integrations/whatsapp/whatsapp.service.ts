import { env } from '../../config/env';
import { BusinessRuleViolationError } from '../../common/errors';
import { ErrorCodes } from '../../common/errors/errorCodes';
import {
  buildWhatsAppUrl,
  normalizeWhatsAppPhone,
  WHATSAPP_DISCLAIMER_AR,
  WHATSAPP_DISCLAIMER_EN,
} from './whatsapp.builder';
import {
  WhatsAppContext,
  WhatsAppLinkAdapter,
  WhatsAppLinkResult,
  CustomerWhatsAppLinkResult,
} from './whatsapp.types';

export class WhatsAppLinkService implements WhatsAppLinkAdapter {
  constructor(private readonly supportPhone?: string) {}

  /**
   * Resolves the configured support phone number.
   * If not configured, safely blocks with an Open Decision (OD-01) error.
   */
  private resolveSupportPhone(): string {
    const phone = this.supportPhone !== undefined ? this.supportPhone : env.WHATSAPP_PHONE;
    if (!phone || !phone.trim()) {
      throw new BusinessRuleViolationError(
        ErrorCodes.BUSINESS_RULE_VIOLATION,
        'Library WhatsApp support phone number is not configured (OD-01 open decision). Please configure WHATSAPP_PHONE in environment.',
      );
    }
    return phone.trim();
  }

  /**
   * Builds a WhatsApp URL for any valid phone number with safe contextual prefill.
   */
  buildUrl(phone: string, context?: WhatsAppContext): string {
    return buildWhatsAppUrl(phone, context);
  }

  /**
   * Builds the official Library support WhatsApp URL (WA-001).
   */
  getSupportUrl(context?: WhatsAppContext): string {
    const phone = this.resolveSupportPhone();
    return buildWhatsAppUrl(phone, context);
  }

  /**
   * Builds a WhatsApp URL for an Admin to contact a specific customer (WA-002).
   */
  getCustomerContactUrl(customerPhone: string, context?: WhatsAppContext): string {
    return buildWhatsAppUrl(customerPhone, context);
  }

  /**
   * Generates complete structured response for customer support link with disclaimers.
   * Confirms WhatsApp does not mutate authoritative records (WA-003).
   */
  getSupportLinkData(context?: WhatsAppContext): WhatsAppLinkResult {
    const url = this.getSupportUrl(context);
    return {
      url,
      disclaimer: WHATSAPP_DISCLAIMER_AR,
      disclaimerEn: WHATSAPP_DISCLAIMER_EN,
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
  getCustomerLinkData(customerPhone: string, context?: WhatsAppContext): CustomerWhatsAppLinkResult {
    const cleanPhone = normalizeWhatsAppPhone(customerPhone);
    const url = this.getCustomerContactUrl(cleanPhone, context);
    return {
      url,
      disclaimer: WHATSAPP_DISCLAIMER_AR,
      disclaimerEn: WHATSAPP_DISCLAIMER_EN,
      customerPhone: cleanPhone,
      context: {
        product: context?.product?.trim() || undefined,
        orderReference: context?.orderReference?.trim() || undefined,
        serviceReference: context?.serviceReference?.trim() || undefined,
      },
    };
  }
}

export const whatsAppService = new WhatsAppLinkService();
