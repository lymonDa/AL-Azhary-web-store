import { Router } from 'express';
import { requireAuthentication } from '../../auth/middleware/auth.middleware';
import { requirePermission } from '../../auth/middleware/rbac.middleware';
import { reportController } from '../controllers/report.controller';

const router = Router();

/**
 * GET /api/v1/admin/reports/:report
 * Authoritative administrative aggregation reports.
 * Protected by authentication and RBAC permission "reports.read".
 */
router.use(requireAuthentication());
router.get('/:report', requirePermission('reports.read'), reportController.getReport);

export const adminReportRouter = router;
