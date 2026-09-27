import { Router } from 'express';
import {
  registerController,
  loginController,
  refreshController,
  logoutController,
  verifyEmailController,
  forgotPasswordController,
  resetPasswordController,
} from '../controllers/auth.controller';
import {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  logoutSchema,
} from '../schemas/auth.schema';
import { validateRequest } from '../../../common/validators/common.validators';
import { requireAuthentication } from '../middleware/auth.middleware';
import { authRateLimiter } from '../../../config/security';
import { env } from '../../../config/env';

export const authRouter = Router();

// Apply auth rate limiter in non-test environments
if (env.NODE_ENV !== 'test') {
  authRouter.use(authRateLimiter);
}

authRouter.post('/register', validateRequest({ body: registerSchema }), registerController);
authRouter.post('/login', validateRequest({ body: loginSchema }), loginController);
authRouter.post('/refresh', refreshController);
authRouter.post(
  '/logout',
  requireAuthentication(),
  validateRequest({ body: logoutSchema }),
  logoutController,
);
authRouter.post(
  '/verify-email',
  validateRequest({ body: verifyEmailSchema }),
  verifyEmailController,
);
authRouter.post(
  '/forgot-password',
  validateRequest({ body: forgotPasswordSchema }),
  forgotPasswordController,
);
authRouter.post(
  '/reset-password',
  validateRequest({ body: resetPasswordSchema }),
  resetPasswordController,
);
