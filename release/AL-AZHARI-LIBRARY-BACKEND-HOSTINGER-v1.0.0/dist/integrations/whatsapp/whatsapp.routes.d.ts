/**
 * Customer / Storefront WhatsApp Router (mounted at /whatsapp)
 * Publicly accessible support link generation (WA-001)
 */
export declare const customerWhatsappRouter: import("express-serve-static-core").Router;
/**
 * Admin WhatsApp Router (mounted at /admin/whatsapp)
 * Requires authenticated admin with 'orders.read' permission (WA-002)
 */
export declare const adminWhatsappRouter: import("express-serve-static-core").Router;
