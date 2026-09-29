import { Router } from 'express';
import { shippingController } from '../controllers/shipping.controller';
import { requireAuthentication } from '../../auth/middleware/auth.middleware';
import { requirePermission } from '../../auth/middleware/rbac.middleware';

export const adminShippingRouter = Router();

adminShippingRouter.use(requireAuthentication());

adminShippingRouter.post('/rules', requirePermission('shipping.write'), shippingController.createRule);
adminShippingRouter.get('/rules', requirePermission('shipping.read'), shippingController.listRules);
adminShippingRouter.get('/rules/:id', requirePermission('shipping.read'), shippingController.getRuleById);
adminShippingRouter.patch('/rules/:id', requirePermission('shipping.write'), shippingController.updateRule);
adminShippingRouter.delete('/rules/:id', requirePermission('shipping.write'), shippingController.deleteRule);
