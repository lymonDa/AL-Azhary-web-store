import { Router } from 'express';
import {
  getHomeContentController,
  listAdminContentController,
  getContentByIdController,
  createContentController,
  updateContentController,
  deleteContentController,
} from '../controllers/content.controller';
import {
  createContentModuleSchema,
  updateContentModuleSchema,
  contentModuleIdParamSchema,
} from '../schemas/content.schema';
import { requireAuthentication } from '../../auth/middleware/auth.middleware';
import { requirePermission } from '../../auth/middleware/rbac.middleware';
import { validateRequest } from '../../../common/validators/common.validators';

// Public content router
export const contentRouter = Router();

contentRouter.get('/home', getHomeContentController);

// Admin content router
export const adminContentRouter = Router();

adminContentRouter.use(requireAuthentication());
adminContentRouter.use(requirePermission('content.write'));

adminContentRouter.get('/', listAdminContentController);

adminContentRouter.get(
  '/:id',
  validateRequest({ params: contentModuleIdParamSchema }),
  getContentByIdController,
);

adminContentRouter.post(
  '/',
  validateRequest({ body: createContentModuleSchema }),
  createContentController,
);

adminContentRouter.patch(
  '/:id',
  validateRequest({ params: contentModuleIdParamSchema, body: updateContentModuleSchema }),
  updateContentController,
);

adminContentRouter.delete(
  '/:id',
  validateRequest({ params: contentModuleIdParamSchema }),
  deleteContentController,
);
