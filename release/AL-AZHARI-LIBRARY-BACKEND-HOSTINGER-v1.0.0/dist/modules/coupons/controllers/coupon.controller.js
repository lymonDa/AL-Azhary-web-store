"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.couponController = exports.CouponController = void 0;
const coupon_service_1 = require("../services/coupon.service");
const cart_repository_1 = require("../../carts/repositories/cart.repository");
const coupon_schema_1 = require("../schemas/coupon.schema");
const response_util_1 = require("../../../common/utils/response.util");
const errors_1 = require("../../../common/errors");
class CouponController {
    coupons;
    carts;
    constructor(coupons = coupon_service_1.couponService, carts = cart_repository_1.cartRepository) {
        this.coupons = coupons;
        this.carts = carts;
    }
    getCartOwnerContext(req) {
        if (req.user) {
            return {
                ownerType: 'user',
                userId: req.user.userId,
            };
        }
        const sessionId = req.headers['x-guest-session-id'] || req.cookies?.guest_session_id;
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
    validateCoupon = async (req, res, next) => {
        try {
            const input = coupon_schema_1.validateCouponSchema.parse(req.body);
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
                throw new errors_1.ValidationError('Cart or items must be provided to validate coupon');
            }
            const result = await this.coupons.validateCoupon({
                code: input.code,
                customerId,
                items,
                subtotalMinor: input.subtotalMinor,
            });
            (0, response_util_1.sendSuccess)(req, res, result);
        }
        catch (error) {
            next(error);
        }
    };
    /**
     * POST /api/v1/admin/coupons
     */
    createCoupon = async (req, res, next) => {
        try {
            if (!req.user)
                throw new errors_1.UnauthorizedError('Authentication required');
            const input = coupon_schema_1.createCouponSchema.parse(req.body);
            const coupon = await this.coupons.createCoupon(input, {
                id: req.user.userId,
                role: req.user.role,
            });
            (0, response_util_1.sendSuccess)(req, res, coupon, 201);
        }
        catch (error) {
            next(error);
        }
    };
    /**
     * GET /api/v1/admin/coupons
     */
    listCoupons = async (req, res, next) => {
        try {
            const query = coupon_schema_1.couponQuerySchema.parse(req.query);
            const result = await this.coupons.listCoupons(query);
            (0, response_util_1.sendSuccess)(req, res, result);
        }
        catch (error) {
            next(error);
        }
    };
    /**
     * GET /api/v1/admin/coupons/:id
     */
    getCouponById = async (req, res, next) => {
        try {
            const { id } = req.params;
            const coupon = await this.coupons.getCouponById(id);
            (0, response_util_1.sendSuccess)(req, res, coupon);
        }
        catch (error) {
            next(error);
        }
    };
    /**
     * PATCH /api/v1/admin/coupons/:id
     */
    updateCoupon = async (req, res, next) => {
        try {
            if (!req.user)
                throw new errors_1.UnauthorizedError('Authentication required');
            const { id } = req.params;
            const input = coupon_schema_1.updateCouponSchema.parse(req.body);
            const updated = await this.coupons.updateCoupon(id, input, {
                id: req.user.userId,
                role: req.user.role,
            });
            (0, response_util_1.sendSuccess)(req, res, updated);
        }
        catch (error) {
            next(error);
        }
    };
    /**
     * POST /api/v1/admin/coupons/:id/activate
     */
    activateCoupon = async (req, res, next) => {
        try {
            if (!req.user)
                throw new errors_1.UnauthorizedError('Authentication required');
            const { id } = req.params;
            const { expectedVersion } = coupon_schema_1.couponVersionSchema.parse(req.body);
            const updated = await this.coupons.activateCoupon(id, expectedVersion, {
                id: req.user.userId,
                role: req.user.role,
            });
            (0, response_util_1.sendSuccess)(req, res, updated);
        }
        catch (error) {
            next(error);
        }
    };
    /**
     * POST /api/v1/admin/coupons/:id/deactivate
     */
    deactivateCoupon = async (req, res, next) => {
        try {
            if (!req.user)
                throw new errors_1.UnauthorizedError('Authentication required');
            const { id } = req.params;
            const { expectedVersion } = coupon_schema_1.couponVersionSchema.parse(req.body);
            const updated = await this.coupons.deactivateCoupon(id, expectedVersion, {
                id: req.user.userId,
                role: req.user.role,
            });
            (0, response_util_1.sendSuccess)(req, res, updated);
        }
        catch (error) {
            next(error);
        }
    };
    /**
     * GET /api/v1/admin/coupons/:id/redemptions
     */
    listRedemptions = async (req, res, next) => {
        try {
            const { id } = req.params;
            const page = req.query.page ? Number(req.query.page) : 1;
            const limit = req.query.limit ? Number(req.query.limit) : 20;
            const result = await this.coupons.listRedemptions(id, page, limit);
            (0, response_util_1.sendSuccess)(req, res, result);
        }
        catch (error) {
            next(error);
        }
    };
}
exports.CouponController = CouponController;
exports.couponController = new CouponController();
//# sourceMappingURL=coupon.controller.js.map