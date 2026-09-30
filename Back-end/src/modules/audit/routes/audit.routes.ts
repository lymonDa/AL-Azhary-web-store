import { Router } from 'express';
import { requireAuthentication } from '../../auth/middleware/auth.middleware';
import { requirePermission } from '../../auth/middleware/rbac.middleware';
import { auditController } from '../controllers/audit.controller';

const router = Router();

/**
 * GET /api/v1/admin/audit-logs
 * Strictly read-only, paginated, filtered audit log query endpoint.
 * Protected by authentication and RBAC permission "audit.read".
 */
router.use(requireAuthentication());
router.get('/', requirePermission('audit.read'), auditController.getAuditLogs);

export const adminAuditRouter = router;
