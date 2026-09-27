import { Router } from 'express';
import { getProfileController, updateProfileController } from '../controllers/user.controller';
import { updateProfileSchema } from '../schemas/user.schema';
import { requireAuthentication } from '../../auth/middleware/auth.middleware';
import { validateRequest } from '../../../common/validators/common.validators';

export const userRouter = Router();

userRouter.use(requireAuthentication());
userRouter.get('/profile', getProfileController);
userRouter.patch(
  '/profile',
  validateRequest({ body: updateProfileSchema }),
  updateProfileController,
);
