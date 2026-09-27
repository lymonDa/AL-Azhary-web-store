import { Router } from 'express';
import {
  listCategoriesController,
  listAdminCategoriesController,
  createCategoryController,
  updateCategoryController,
  deleteCategoryController,
} from '../controllers/category.controller';
import {
  createCategorySchema,
  updateCategorySchema,
  categoryIdParamSchema,
} from '../schemas/category.schema';
import { requireAuthentication } from '../../auth/middleware/auth.middleware';
import { requirePermission } from '../../auth/middleware/rbac.middleware';
import { validateRequest } from '../../../common/validators/common.validators';

// Public category routes
export const categoryRouter = Router();

categoryRouter.get('/', listCategoriesController);

// Admin category routes
export const adminCategoryRouter = Router();

adminCategoryRouter.use(requireAuthentication());
adminCategoryRouter.use(requirePermission('categories.write'));

adminCategoryRouter.get('/', listAdminCategoriesController);

adminCategoryRouter.post(
  '/',
  validateRequest({ body: createCategorySchema }),
  createCategoryController,
);

adminCategoryRouter.patch(
  '/:id',
  validateRequest({ params: categoryIdParamSchema, body: updateCategorySchema }),
  updateCategoryController,
);

adminCategoryRouter.delete(
  '/:id',
  validateRequest({ params: categoryIdParamSchema }),
  deleteCategoryController,
);
