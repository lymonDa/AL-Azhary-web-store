import { canonicalizePhone, isValidPhone } from '../../modules/users/utils/phone.util';
import { ValidationError } from '../../common/errors';
import { WhatsAppContext } from './whatsapp.types';

export const WHATSAPP_BASE_GREETING = 'السلام عليكم، أحتاج مساعدة من مكتبة الأزهري';
export const WHATSAPP_LABEL_PRODUCT = 'المنتج: ';
export const WHATSAPP_LABEL_ORDER = 'رقم الطلب: ';
export const WHATSAPP_LABEL_SERVICE = 'رقم الخدمة: ';

export const WHATSAPP_DISCLAIMER_AR =
  'المحادثة عبر واتساب هي للتواصل والاستفسار فقط، ولا تُنشئ ولا تُعدّل ولا تُؤكد ولا تُلغي أي طلب أو خدمة أو سجل مالي.';
export const WHATSAPP_DISCLAIMER_EN =
  'WhatsApp chat is for communication and inquiries only. It does not create, modify, confirm, or cancel any order, service, or payment record.';

/**
 * Normalizes and validates a phone number for use in a WhatsApp wa.me URL.
 * Omit any plus sign, zeroes, brackets, or dashes per WhatsApp wa.me specification.
 */
export function normalizeWhatsAppPhone(rawPhone: string): string {
  if (!rawPhone || typeof rawPhone !== 'string' || !rawPhone.trim()) {
    throw new ValidationError('Phone number is required for WhatsApp link', { field: 'phone' });
  }

  const canonical = canonicalizePhone(rawPhone.trim());
  if (!isValidPhone(canonical)) {
    throw new ValidationError('Invalid phone number for WhatsApp link', { field: 'phone' });
  }

  // wa.me format expects international digits without leading '+' or '00'
  const waPhone = canonical.replace(/^\+/, '');

  if (!/^[1-9]\d{7,14}$/.test(waPhone)) {
    throw new ValidationError('Invalid phone number digits for WhatsApp link', { field: 'phone' });
  }

  return waPhone;
}

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
export function buildWhatsAppUrl(
  phone: string,
  context?: WhatsAppContext,
): string {
  const cleanPhone = normalizeWhatsAppPhone(phone);

  const parts = [WHATSAPP_BASE_GREETING];

  // Strict allowlist: only extract known public safe fields as trimmed strings
  if (context?.product && typeof context.product === 'string') {
    const trimmed = context.product.trim();
    if (trimmed.length > 0) {
      parts.push(`${WHATSAPP_LABEL_PRODUCT}${trimmed}`);
    }
  }

  if (context?.orderReference && typeof context.orderReference === 'string') {
    const trimmed = context.orderReference.trim();
    if (trimmed.length > 0) {
      parts.push(`${WHATSAPP_LABEL_ORDER}${trimmed}`);
    }
  }

  if (context?.serviceReference && typeof context.serviceReference === 'string') {
    const trimmed = context.serviceReference.trim();
    if (trimmed.length > 0) {
      parts.push(`${WHATSAPP_LABEL_SERVICE}${trimmed}`);
    }
  }

  const encodedPhone = encodeURIComponent(cleanPhone);
  const encodedText = encodeURIComponent(parts.join('\n'));

  return `https://wa.me/${encodedPhone}?text=${encodedText}`;
}
