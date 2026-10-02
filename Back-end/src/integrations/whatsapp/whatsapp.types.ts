/**
 * Allowed contextual data for WhatsApp prefilled messages.
 * STRICT SECURITY ALLOWLIST:
 * Only safe, public references are allowed.
 * Never include payment proofs, addresses, tokens, JWTs, cookies,
 * private notes, passwords, or internal audit metadata.
 */
export interface WhatsAppContext {
  product?: string;
  orderReference?: string;
  serviceReference?: string;
}

/**
 * Result data for a generated WhatsApp link action.
 * Accompanied by authoritative disclaimer confirming chat does not mutate state.
 */
export interface WhatsAppLinkResult {
  url: string;
  disclaimer: string;
  disclaimerEn: string;
  context: WhatsAppContext;
}

/**
 * Result data when Admin requests a link to contact a customer on WhatsApp (WA-002).
 */
export interface CustomerWhatsAppLinkResult extends WhatsAppLinkResult {
  customerPhone: string;
}

/**
 * Input for Admin contacting customer on WhatsApp.
 */
export interface CustomerWhatsAppLinkInput {
  customerPhone: string;
  context?: WhatsAppContext;
}

/**
 * Future-friendly adapter interface for WhatsApp integrations (Section 38.3).
 * Decouples link generation and future WhatsApp Business API from domain logic.
 */
export interface WhatsAppLinkAdapter {
  buildUrl(phone: string, context?: WhatsAppContext): string;
  getSupportUrl(context?: WhatsAppContext): string;
  getCustomerContactUrl(customerPhone: string, context?: WhatsAppContext): string;
}
