import { Router } from 'express';
import { getMeController } from '../controllers/auth.controller';
import { requireAuthentication } from '../middleware/auth.middleware';

export const meRouter = Router();

meRouter.get('/', requireAuthentication(), getMeController);
