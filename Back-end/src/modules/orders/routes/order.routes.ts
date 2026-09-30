import { Router } from 'express';
import { orderController } from '../controllers/order.controller';
import {
  optionalAuthentication,
  requireAuthentication,
} from '../../auth/middleware/auth.middleware';
import { requirePermission } from '../../auth/middleware/rbac.middleware';
import { guestOrderRateLimiter } from '../../../config/security';
import { env } from '../../../config/env';

// 1. Customer / Public Checkout & Order routes
export const orderRouter = Router();

if (env.NODE_ENV !== 'test') {
  orderRouter.use(guestOrderRateLimiter);
}

// POST /orders (guest or registered)
orderRouter.post('/', optionalAuthentication(), orderController.createOrder);

// GET /orders/:reference
orderRouter.get('/:reference', optionalAuthentication(), orderController.getOrderByReference);

// PATCH /orders/:reference (pending_review edit)
orderRouter.patch('/:reference', optionalAuthentication(), orderController.updatePendingOrder);

// POST /orders/:reference/cancel
orderRouter.post('/:reference/cancel', optionalAuthentication(), orderController.cancelOrder);

// POST /orders/:reference/confirm-cod
orderRouter.post('/:reference/confirm-cod', optionalAuthentication(), orderController.confirmCodOrder);

// 2. Checkout helper router for /checkout/shipping-estimate
export const checkoutRouter = Router();
checkoutRouter.post('/shipping-estimate', optionalAuthentication(), orderController.estimateShipping);

// 3. Admin Orders router
export const adminOrderRouter = Router();

adminOrderRouter.use(requireAuthentication());

adminOrderRouter.get('/', requirePermission('orders.read'), orderController.listAdminOrders);
adminOrderRouter.get('/:reference', requirePermission('orders.read'), orderController.getAdminOrderByReference);
adminOrderRouter.post('/:reference/accept', requirePermission('orders.accept'), orderController.adminAcceptOrder);
adminOrderRouter.post('/:reference/reject', requirePermission('orders.write'), orderController.adminRejectOrder);
adminOrderRouter.post('/:reference/status', requirePermission('orders.write'), orderController.adminUpdateOrderStatus);
adminOrderRouter.post('/:reference/shipping', requirePermission('orders.write'), orderController.adminUpdateShipping);
