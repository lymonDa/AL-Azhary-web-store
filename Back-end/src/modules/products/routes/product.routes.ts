import { Router } from 'express';
import {
  listProductsController,
  getProductBySlugController,
  searchProductsController,
  listAdminProductsController,
  getAdminProductByIdController,
  createProductController,
  updateProductController,
} from '../controllers/product.controller';
import {
  createProductSchema,
  updateProductSchema,
  productIdParamSchema,
  productSlugParamSchema,
  listProductsQuerySchema,
  searchQuerySchema,
} from '../schemas/product.schema';
import { requireAuthentication } from '../../auth/middleware/auth.middleware';
import { requirePermission } from '../../auth/middleware/rbac.middleware';
import { validateRequest } from '../../../common/validators/common.validators';

// Public product router
export const productRouter = Router();

productRouter.get(
  '/',
  validateRequest({ query: listProductsQuerySchema }),
  listProductsController,
);

productRouter.get(
  '/:slug',
  validateRequest({ params: productSlugParamSchema }),
  getProductBySlugController,
);

// Public search router
export const searchRouter = Router();

searchRouter.get(
  '/',
  validateRequest({ query: searchQuerySchema }),
  searchProductsController,
);

// Admin product router
export const adminProductRouter = Router();

adminProductRouter.use(requireAuthentication());
adminProductRouter.use(requirePermission('products.write'));

adminProductRouter.get('/', listAdminProductsController);

adminProductRouter.get(
  '/:id',
  validateRequest({ params: productIdParamSchema }),
  getAdminProductByIdController,
);

adminProductRouter.post(
  '/',
  validateRequest({ body: createProductSchema }),
  createProductController,
);

adminProductRouter.patch(
  '/:id',
  validateRequest({ params: productIdParamSchema, body: updateProductSchema }),
  updateProductController,
);
