import { Request, Response, NextFunction } from 'express';
import { couponService, CouponService } from '../services/coupon.service';
import { cartRepository, CartRepository } from '../../carts/repositories/cart.repository';
import {
  createCouponSchema,
  updateCouponSchema,
  validateCouponSchema,
  couponQuerySchema,
  couponVersionSchema,
} from '../schemas/coupon.schema';
import { sendSuccess } from '../../../common/utils/response.util';
import { CartOwnerContext } from '../../carts/types/cart.types';
import { UnauthorizedError, ValidationError } from '../../../common/errors';

export class CouponController {
  constructor(
    private readonly coupons: CouponService = couponService,
    private readonly carts: CartRepository = cartRepository,
  ) {}

  private getCartOwnerContext(req: Request): CartOwnerContext | null {
    if (req.user) {
      return {
        ownerType: 'user',
        userId: req.user.userId,
      };
    }
    const sessionId =
      (req.headers['x-guest-session-id'] as string) || req.cookies?.guest_session_id;
    if (sessionId && typeof sessionId === 'string' && sessionId.trim().length > 0) {
      return {
        ownerType: 'guest',
        sessionId: sessionId.trim(),
      };
    }
    return null;
  }

  /**
   * POST /api/v1/checkout/validate-coupon or POST /api/v1/coupons/validate
   * Validates a coupon code and returns expected discount without consuming.
   */
  validateCoupon = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input = validateCouponSchema.parse(req.body);
      const customerId = req.user?.userId || null;

      let items = input.items;

      // If items not directly provided in body, load from active cart
      if (!items || items.length === 0) {
        const owner = this.getCartOwnerContext(req);
        if (owner) {
          const cart = await this.carts.findActiveByOwner(owner);
          if (cart && cart.items.length > 0) {
            items = cart.items.map((it) => ({
              productId: it.productId.toString(),
              unitPriceMinor: it.unitPriceMinor,
              quantity: it.quantity,
              lineTotalMinor: it.unitPriceMinor * it.quantity,
            }));
          }
        }
      }

      if (!items || items.length === 0) {
        throw new ValidationError('Cart or items must be provided to validate coupon');
      }

      const result = await this.coupons.validateCoupon({
        code: input.code,
        customerId,
        items,
        subtotalMinor: input.subtotalMinor,
      });

      sendSuccess(req, res, result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/admin/coupons
   */
  createCoupon = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) throw new UnauthorizedError('Authentication required');
      const input = createCouponSchema.parse(req.body);

      const coupon = await this.coupons.createCoupon(input, {
        id: req.user.userId,
        role: req.user.role,
      });

      sendSuccess(req, res, coupon, 201);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/admin/coupons
   */
  listCoupons = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = couponQuerySchema.parse(req.query);
      const result = await this.coupons.listCoupons(query);
      sendSuccess(req, res, result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/admin/coupons/:id
   */
  getCouponById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const coupon = await this.coupons.getCouponById(id);
      sendSuccess(req, res, coupon);
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /api/v1/admin/coupons/:id
   */
  updateCoupon = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) throw new UnauthorizedError('Authentication required');
      const { id } = req.params;
      const input = updateCouponSchema.parse(req.body);

      const updated = await this.coupons.updateCoupon(id, input, {
        id: req.user.userId,
        role: req.user.role,
      });

      sendSuccess(req, res, updated);
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/admin/coupons/:id/activate
   */
  activateCoupon = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) throw new UnauthorizedError('Authentication required');
      const { id } = req.params;
      const { expectedVersion } = couponVersionSchema.parse(req.body);

      const updated = await this.coupons.activateCoupon(id, expectedVersion, {
        id: req.user.userId,
        role: req.user.role,
      });

      sendSuccess(req, res, updated);
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/admin/coupons/:id/deactivate
   */
  deactivateCoupon = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) throw new UnauthorizedError('Authentication required');
      const { id } = req.params;
      const { expectedVersion } = couponVersionSchema.parse(req.body);

      const updated = await this.coupons.deactivateCoupon(id, expectedVersion, {
        id: req.user.userId,
        role: req.user.role,
      });

      sendSuccess(req, res, updated);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/admin/coupons/:id/redemptions
   */
  listRedemptions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const page = req.query.page ? Number(req.query.page) : 1;
      const limit = req.query.limit ? Number(req.query.limit) : 20;

      const result = await this.coupons.listRedemptions(id, page, limit);
      sendSuccess(req, res, result);
    } catch (error) {
      next(error);
    }
  };
}

export const couponController = new CouponController();
