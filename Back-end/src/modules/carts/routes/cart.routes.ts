import { Router } from 'express';
import { cartController } from '../controllers/cart.controller';
import { optionalAuthentication, requireAuthentication } from '../../auth/middleware/auth.middleware';
import { resolveCartOwner } from '../middleware/cart-owner.middleware';
import { validateRequest } from '../../../common/validators/common.validators';
import {
  addItemSchema,
  updateItemSchema,
  removeItemSchema,
  mergeCartSchema,
  itemIdParamSchema,
} from '../schemas/cart.schemas';

export const cartRouter = Router();

// Automatically resolve authenticated principal or generate/validate guest session
cartRouter.use(optionalAuthentication());
cartRouter.use(resolveCartOwner());

// GET /api/v1/cart
cartRouter.get('/', cartController.getCart.bind(cartController));

// POST /api/v1/cart/items
cartRouter.post(
  '/items',
  validateRequest({ body: addItemSchema }),
  cartController.addItem.bind(cartController),
);

// PATCH /api/v1/cart/items/:itemId
cartRouter.patch(
  '/items/:itemId',
  validateRequest({ params: itemIdParamSchema, body: updateItemSchema }),
  cartController.updateItem.bind(cartController),
);

// DELETE /api/v1/cart/items/:itemId
cartRouter.delete(
  '/items/:itemId',
  validateRequest({ params: itemIdParamSchema, body: removeItemSchema }),
  cartController.removeItem.bind(cartController),
);

// POST /api/v1/cart/merge
cartRouter.post(
  '/merge',
  requireAuthentication(),
  validateRequest({ body: mergeCartSchema }),
  cartController.mergeCart.bind(cartController),
);
