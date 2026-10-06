import { Request, Response, NextFunction } from 'express';
import { CouponService } from '../services/coupon.service';
import { CartRepository } from '../../carts/repositories/cart.repository';
export declare class CouponController {
    private readonly coupons;
    private readonly carts;
    constructor(coupons?: CouponService, carts?: CartRepository);
    private getCartOwnerContext;
    /**
     * POST /api/v1/checkout/validate-coupon or POST /api/v1/coupons/validate
     * Validates a coupon code and returns expected discount without consuming.
     */
    validateCoupon: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * POST /api/v1/admin/coupons
     */
    createCoupon: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * GET /api/v1/admin/coupons
     */
    listCoupons: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * GET /api/v1/admin/coupons/:id
     */
    getCouponById: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * PATCH /api/v1/admin/coupons/:id
     */
    updateCoupon: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * POST /api/v1/admin/coupons/:id/activate
     */
    activateCoupon: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * POST /api/v1/admin/coupons/:id/deactivate
     */
    deactivateCoupon: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * GET /api/v1/admin/coupons/:id/redemptions
     */
    listRedemptions: (req: Request, res: Response, next: NextFunction) => Promise<void>;
}
export declare const couponController: CouponController;
