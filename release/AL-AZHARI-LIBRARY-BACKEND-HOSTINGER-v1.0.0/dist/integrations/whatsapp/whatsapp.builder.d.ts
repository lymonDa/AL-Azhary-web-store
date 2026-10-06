import { WhatsAppContext } from './whatsapp.types';
export declare const WHATSAPP_BASE_GREETING = "\u0627\u0644\u0633\u0644\u0627\u0645 \u0639\u0644\u064A\u0643\u0645\u060C \u0623\u062D\u062A\u0627\u062C \u0645\u0633\u0627\u0639\u062F\u0629 \u0645\u0646 \u0645\u0643\u062A\u0628\u0629 \u0627\u0644\u0623\u0632\u0647\u0631\u064A";
export declare const WHATSAPP_LABEL_PRODUCT = "\u0627\u0644\u0645\u0646\u062A\u062C: ";
export declare const WHATSAPP_LABEL_ORDER = "\u0631\u0642\u0645 \u0627\u0644\u0637\u0644\u0628: ";
export declare const WHATSAPP_LABEL_SERVICE = "\u0631\u0642\u0645 \u0627\u0644\u062E\u062F\u0645\u0629: ";
export declare const WHATSAPP_DISCLAIMER_AR = "\u0627\u0644\u0645\u062D\u0627\u062F\u062B\u0629 \u0639\u0628\u0631 \u0648\u0627\u062A\u0633\u0627\u0628 \u0647\u064A \u0644\u0644\u062A\u0648\u0627\u0635\u0644 \u0648\u0627\u0644\u0627\u0633\u062A\u0641\u0633\u0627\u0631 \u0641\u0642\u0637\u060C \u0648\u0644\u0627 \u062A\u064F\u0646\u0634\u0626 \u0648\u0644\u0627 \u062A\u064F\u0639\u062F\u0651\u0644 \u0648\u0644\u0627 \u062A\u064F\u0624\u0643\u062F \u0648\u0644\u0627 \u062A\u064F\u0644\u063A\u064A \u0623\u064A \u0637\u0644\u0628 \u0623\u0648 \u062E\u062F\u0645\u0629 \u0623\u0648 \u0633\u062C\u0644 \u0645\u0627\u0644\u064A.";
export declare const WHATSAPP_DISCLAIMER_EN = "WhatsApp chat is for communication and inquiries only. It does not create, modify, confirm, or cancel any order, service, or payment record.";
/**
 * Normalizes and validates a phone number for use in a WhatsApp wa.me URL.
 * Omit any plus sign, zeroes, brackets, or dashes per WhatsApp wa.me specification.
 */
export declare function normalizeWhatsAppPhone(rawPhone: string): string;
/**
 * Builds a safe, URL-encoded WhatsApp deep-link per Section 38.1 of the Implementation Plan.
 *
 * Requirements:
 * - Generates normal WhatsApp links with URL-encoded, safe prefills.
 * - Does not require WhatsApp Business API.
 * - URL pattern: https://wa.me/<phone>?text=<encoded-message>
 * - Context is strictly allowlisted: only product, orderReference, and serviceReference are included.
 * - Sensitive data (payment proofs, addresses, tokens, private notes, passwords) are strictly excluded.
 */
export declare function buildWhatsAppUrl(phone: string, context?: WhatsAppContext): string;
