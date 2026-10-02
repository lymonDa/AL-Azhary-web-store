import { Router } from 'express';
import { whatsAppController } from './whatsapp.controller';
import { requireAuthentication, optionalAuthentication } from '../../modules/auth/middleware/auth.middleware';
import { requirePermission } from '../../modules/auth/middleware/rbac.middleware';

/**
 * Customer / Storefront WhatsApp Router (mounted at /whatsapp)
 * Publicly accessible support link generation (WA-001)
 */
export const customerWhatsappRouter = Router();

customerWhatsappRouter.get('/support', optionalAuthentication(), whatsAppController.getSupportLink);
customerWhatsappRouter.get('/link', optionalAuthentication(), whatsAppController.getSupportLink);

/**
 * Admin WhatsApp Router (mounted at /admin/whatsapp)
 * Requires authenticated admin with 'orders.read' permission (WA-002)
 */
export const adminWhatsappRouter = Router();

adminWhatsappRouter.use(requireAuthentication());
adminWhatsappRouter.use(requirePermission('orders.read'));

adminWhatsappRouter.post('/customer-link', whatsAppController.getCustomerLink);
