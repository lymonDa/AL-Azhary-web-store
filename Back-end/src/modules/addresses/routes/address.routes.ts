import { Router } from 'express';
import {
  listAddressesController,
  createAddressController,
  getAddressController,
  updateAddressController,
  deleteAddressController,
} from '../controllers/address.controller';
import {
  createAddressSchema,
  updateAddressSchema,
  addressIdParamSchema,
} from '../schemas/address.schema';
import { requireAuthentication } from '../../auth/middleware/auth.middleware';
import { validateRequest } from '../../../common/validators/common.validators';

export const addressRouter = Router();

// All address operations require authenticated customer principal
addressRouter.use(requireAuthentication());

addressRouter.get('/', listAddressesController);

addressRouter.post(
  '/',
  validateRequest({ body: createAddressSchema }),
  createAddressController,
);

addressRouter.get(
  '/:id',
  validateRequest({ params: addressIdParamSchema }),
  getAddressController,
);

addressRouter.patch(
  '/:id',
  validateRequest({ params: addressIdParamSchema, body: updateAddressSchema }),
  updateAddressController,
);

addressRouter.delete(
  '/:id',
  validateRequest({ params: addressIdParamSchema }),
  deleteAddressController,
);
