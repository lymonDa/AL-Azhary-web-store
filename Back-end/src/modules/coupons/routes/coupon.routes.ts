import { Router } from 'express';
import { couponController } from '../controllers/coupon.controller';
import {
  optionalAuthentication,
  requireAuthentication,
} from '../../auth/middleware/auth.middleware';
import { requirePermission } from '../../auth/middleware/rbac.middleware';

// Public / Customer coupon routes
export const couponRouter = Router();
couponRouter.post('/validate', optionalAuthentication(), couponController.validateCoupon);

// Admin coupon management routes
export const adminCouponRouter = Router();

adminCouponRouter.use(requireAuthentication());

adminCouponRouter.post('/', requirePermission('coupons.write'), couponController.createCoupon);
adminCouponRouter.get('/', requirePermission('coupons.read'), couponController.listCoupons);
adminCouponRouter.get('/:id', requirePermission('coupons.read'), couponController.getCouponById);
adminCouponRouter.patch('/:id', requirePermission('coupons.write'), couponController.updateCoupon);
adminCouponRouter.post('/:id/activate', requirePermission('coupons.write'), couponController.activateCoupon);
adminCouponRouter.post('/:id/deactivate', requirePermission('coupons.write'), couponController.deactivateCoupon);
adminCouponRouter.get('/:id/redemptions', requirePermission('coupons.read'), couponController.listRedemptions);
