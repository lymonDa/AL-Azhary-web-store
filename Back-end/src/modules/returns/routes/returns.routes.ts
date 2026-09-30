import { Router } from 'express';
import { returnsController } from '../controllers/returns.controller';
import { requireAuthentication } from '../../auth/middleware/auth.middleware';
import { requirePermission } from '../../auth/middleware/rbac.middleware';

// ─── Customer Returns Router (mounted at /returns and /orders) ───────────────────
export const customerReturnRouter = Router();

customerReturnRouter.use(requireAuthentication());

// GET /returns
customerReturnRouter.get('/', returnsController.listCustomerReturns);

// GET /returns/:reference
customerReturnRouter.get('/:reference', returnsController.getReturnRequest);

// Order Returns Sub-router (mounted at /orders/:orderReference/returns)
export const orderReturnsRouter = Router({ mergeParams: true });
orderReturnsRouter.use(requireAuthentication());

// POST /orders/:orderReference/returns
orderReturnsRouter.post('/', returnsController.createReturnRequest);

// ─── Admin Returns & Refunds Router ─────────────────────────────────────────────
export const adminReturnRouter = Router();

adminReturnRouter.use(requireAuthentication());

// GET /admin/returns
adminReturnRouter.get(
  '/',
  requirePermission('returns.write'),
  returnsController.listAdminReturns,
);

// GET /admin/returns/:reference
adminReturnRouter.get(
  '/:reference',
  requirePermission('returns.write'),
  returnsController.getReturnRequest,
);

// POST /admin/returns/:reference/approve
adminReturnRouter.post(
  '/:reference/approve',
  requirePermission('returns.write'),
  returnsController.adminApproveReturn,
);

// POST /admin/returns/:reference/reject
adminReturnRouter.post(
  '/:reference/reject',
  requirePermission('returns.write'),
  returnsController.adminRejectReturn,
);

// ─── Admin Refunds Router ───────────────────────────────────────────────────────
export const adminRefundRouter = Router();

adminRefundRouter.use(requireAuthentication());

// GET /admin/refunds
adminRefundRouter.get(
  '/',
  requirePermission('refunds.write'),
  returnsController.listAdminRefunds,
);

// GET /admin/refunds/:id
adminRefundRouter.get(
  '/:id',
  requirePermission('refunds.write'),
  returnsController.getRefund,
);

// POST /admin/refunds/:id/complete
adminRefundRouter.post(
  '/:id/complete',
  requirePermission('refunds.write'),
  returnsController.adminCompleteRefund,
);

// POST /admin/refunds/:id/fail
adminRefundRouter.post(
  '/:id/fail',
  requirePermission('refunds.write'),
  returnsController.adminFailRefund,
);
