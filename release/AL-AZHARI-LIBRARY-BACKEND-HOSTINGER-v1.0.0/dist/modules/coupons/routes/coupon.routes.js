"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminCouponRouter = exports.couponRouter = void 0;
const express_1 = require("express");
const coupon_controller_1 = require("../controllers/coupon.controller");
const auth_middleware_1 = require("../../auth/middleware/auth.middleware");
const rbac_middleware_1 = require("../../auth/middleware/rbac.middleware");
// Public / Customer coupon routes
exports.couponRouter = (0, express_1.Router)();
exports.couponRouter.post('/validate', (0, auth_middleware_1.optionalAuthentication)(), coupon_controller_1.couponController.validateCoupon);
// Admin coupon management routes
exports.adminCouponRouter = (0, express_1.Router)();
exports.adminCouponRouter.use((0, auth_middleware_1.requireAuthentication)());
exports.adminCouponRouter.post('/', (0, rbac_middleware_1.requirePermission)('coupons.write'), coupon_controller_1.couponController.createCoupon);
exports.adminCouponRouter.get('/', (0, rbac_middleware_1.requirePermission)('coupons.read'), coupon_controller_1.couponController.listCoupons);
exports.adminCouponRouter.get('/:id', (0, rbac_middleware_1.requirePermission)('coupons.read'), coupon_controller_1.couponController.getCouponById);
exports.adminCouponRouter.patch('/:id', (0, rbac_middleware_1.requirePermission)('coupons.write'), coupon_controller_1.couponController.updateCoupon);
exports.adminCouponRouter.post('/:id/activate', (0, rbac_middleware_1.requirePermission)('coupons.write'), coupon_controller_1.couponController.activateCoupon);
exports.adminCouponRouter.post('/:id/deactivate', (0, rbac_middleware_1.requirePermission)('coupons.write'), coupon_controller_1.couponController.deactivateCoupon);
exports.adminCouponRouter.get('/:id/redemptions', (0, rbac_middleware_1.requirePermission)('coupons.read'), coupon_controller_1.couponController.listRedemptions);
//# sourceMappingURL=coupon.routes.js.map