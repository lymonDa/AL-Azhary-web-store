import { Router } from 'express';
import { getMeController } from '../controllers/auth.controller';
import { updateProfileController } from '../../users/controllers/user.controller';
import { updateProfileSchema } from '../../users/schemas/user.schema';
import { requireAuthentication } from '../middleware/auth.middleware';
import { validateRequest } from '../../../common/validators/common.validators';

export const meRouter = Router();

meRouter.get('/', requireAuthentication(), getMeController);
meRouter.patch(
  '/',
  requireAuthentication(),
  validateRequest({ body: updateProfileSchema }),
  updateProfileController,
);
