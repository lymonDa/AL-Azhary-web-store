import { Router } from 'express';
import { preorderController } from '../controllers/preorder.controller';
import { requireAuthentication, optionalAuthentication } from '../../auth/middleware/auth.middleware';
import { requirePermission } from '../../auth/middleware/rbac.middleware';

/**
 * Product-scoped Pre-order Router (mounted at /products)
 * POST /api/v1/products/:slug/pre-orders
 */
export const productPreorderRouter = Router();

productPreorderRouter.post(
  '/:slug/pre-orders',
  optionalAuthentication(),
  preorderController.createPreorder,
);

/**
 * Customer Pre-order Router (mounted at /pre-orders)
 * Requires authenticated customer
 */
export const customerPreorderRouter = Router();

customerPreorderRouter.use(requireAuthentication());

// GET /api/v1/pre-orders (List customer's own pre-orders, or admin list if admin)
customerPreorderRouter.get('/', preorderController.listPreorders);

// GET /api/v1/pre-orders/:reference (Retrieve single pre-order with ownership validation)
customerPreorderRouter.get('/:reference', preorderController.getPreorderByReference);

// POST /api/v1/pre-orders/:reference/cancel (Cancel pre-order request)
customerPreorderRouter.post('/:reference/cancel', preorderController.cancelPreorder);

/**
 * Admin Pre-order Router (mounted at /admin/pre-orders)
 * Requires authenticated user with 'preorders.write' permission
 */
export const adminPreorderRouter = Router();

adminPreorderRouter.use(requireAuthentication());
adminPreorderRouter.use(requirePermission('preorders.write'));

// GET /api/v1/admin/pre-orders
adminPreorderRouter.get('/', preorderController.adminListPreorders);

// GET /api/v1/admin/pre-orders/:reference
adminPreorderRouter.get('/:reference', preorderController.getPreorderByReference);

// POST /api/v1/admin/pre-orders/:reference/accept
adminPreorderRouter.post('/:reference/accept', preorderController.adminAcceptPreorder);

// POST /api/v1/admin/pre-orders/:reference/reject
adminPreorderRouter.post('/:reference/reject', preorderController.adminRejectPreorder);

// POST /api/v1/admin/pre-orders/:reference/available
adminPreorderRouter.post('/:reference/available', preorderController.adminMarkAvailable);

// POST /api/v1/admin/pre-orders/:reference/cancel
adminPreorderRouter.post('/:reference/cancel', preorderController.cancelPreorder);
