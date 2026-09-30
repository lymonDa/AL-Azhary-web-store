import { Router } from 'express';
import { quotationController } from '../controllers/quotation.controller';
import { requireAuthentication } from '../../auth/middleware/auth.middleware';
import { requirePermission } from '../../auth/middleware/rbac.middleware';

// Admin Service Requests / Quotes Router (mounted at /admin/service-requests)
export const adminServiceRequestRouter = Router();

adminServiceRequestRouter.use(requireAuthentication());

// POST /admin/service-requests/:reference/quotes
adminServiceRequestRouter.post(
  '/:reference/quotes',
  requirePermission('services.quote'),
  quotationController.adminCreateQuote,
);
