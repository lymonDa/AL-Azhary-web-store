"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.couponService = exports.CouponService = void 0;
const coupon_repository_1 = require("../repositories/coupon.repository");
const coupon_redemption_repository_1 = require("../repositories/coupon-redemption.repository");
const errors_1 = require("../../../common/errors");
const errorCodes_1 = require("../../../common/errors/errorCodes");
const audit_service_1 = require("../../audit/services/audit.service");
class CouponService {
    couponRepo;
    redemptionRepo;
    audit;
    constructor(couponRepo = coupon_repository_1.couponRepository, redemptionRepo = coupon_redemption_repository_1.couponRedemptionRepository, audit = audit_service_1.auditService) {
        this.couponRepo = couponRepo;
        this.redemptionRepo = redemptionRepo;
        this.audit = audit;
    }
    /**
     * Normalizes coupon code: trims whitespace and converts to uppercase.
     */
    normalizeCouponCode(code) {
        if (!code || typeof code !== 'string') {
            return '';
        }
        return code.trim().toUpperCase();
    }
    /**
     * Validates a coupon code against candidate order items, customer, and subtotal.
     * Centralized server-side discount calculation using integer minor units.
     */
    async validateCoupon(input, session) {
        const codeNormalized = this.normalizeCouponCode(input.code);
        if (!codeNormalized) {
            throw new errors_1.ValidationError('Coupon code is required');
        }
        const ctx = { session };
        const coupon = await this.couponRepo.findByCode(codeNormalized, ctx);
        if (!coupon) {
            throw new errors_1.NotFoundError(`Coupon with code "${codeNormalized}" was not found`, errorCodes_1.ErrorCodes.COUPON_NOT_FOUND);
        }
        // 1. Active check
        if (!coupon.active) {
            throw new errors_1.BusinessRuleViolationError(errorCodes_1.ErrorCodes.COUPON_INACTIVE, 'This coupon is currently inactive');
        }
        const now = new Date();
        // 2. StartsAt check
        if (coupon.startsAt && now < coupon.startsAt) {
            throw new errors_1.BusinessRuleViolationError(errorCodes_1.ErrorCodes.COUPON_NOT_STARTED, 'This coupon has not yet started');
        }
        // 3. EndsAt check
        if (coupon.endsAt && now > coupon.endsAt) {
            throw new errors_1.BusinessRuleViolationError(errorCodes_1.ErrorCodes.COUPON_EXPIRED, 'This coupon has expired');
        }
        // 4. Usage limit check
        const usageLimit = coupon.usageLimit ?? null;
        if (usageLimit !== null && coupon.usageCount >= usageLimit) {
            throw new errors_1.BusinessRuleViolationError(errorCodes_1.ErrorCodes.COUPON_USAGE_LIMIT_REACHED, 'This coupon has reached its maximum usage limit');
        }
        // 5. Customer restrictions check (OD-17)
        if (coupon.customerRestriction) {
            const rest = coupon.customerRestriction;
            if (rest.registeredOnly && !input.customerId) {
                throw new errors_1.BusinessRuleViolationError(errorCodes_1.ErrorCodes.COUPON_NOT_APPLICABLE, 'This coupon is reserved for registered account holders');
            }
            if (rest.customerIds &&
                Array.isArray(rest.customerIds) &&
                rest.customerIds.length > 0) {
                if (!input.customerId || !rest.customerIds.map(String).includes(String(input.customerId))) {
                    throw new errors_1.BusinessRuleViolationError(errorCodes_1.ErrorCodes.COUPON_NOT_APPLICABLE, 'This coupon is not applicable to your account');
                }
            }
        }
        // 6. Scope evaluation and eligible subtotal
        const items = input.items || [];
        let eligibleItems = items;
        if (coupon.scopeType === 'product') {
            const scopeSet = new Set(coupon.scopeIds.map(String));
            eligibleItems = items.filter((it) => scopeSet.has(String(it.productId)));
        }
        else if (coupon.scopeType === 'category') {
            const scopeSet = new Set(coupon.scopeIds.map(String));
            eligibleItems = items.filter((it) => {
                const cat = it.categorySnapshot || it.categoryId;
                return cat && scopeSet.has(String(cat));
            });
        }
        const eligibleSubtotalMinor = eligibleItems.reduce((sum, it) => sum + (it.lineTotalMinor || it.unitPriceMinor * it.quantity), 0);
        if (eligibleItems.length === 0 || eligibleSubtotalMinor <= 0) {
            throw new errors_1.BusinessRuleViolationError(errorCodes_1.ErrorCodes.COUPON_NOT_APPLICABLE, 'None of the items in your order are eligible for this coupon');
        }
        // 7. Minimum Order check
        const orderSubtotalMinor = input.subtotalMinor !== undefined
            ? input.subtotalMinor
            : items.reduce((sum, it) => sum + (it.lineTotalMinor || it.unitPriceMinor * it.quantity), 0);
        const minimumOrderMinor = coupon.minimumOrderMinor ?? null;
        if (minimumOrderMinor !== null && minimumOrderMinor > 0) {
            if (orderSubtotalMinor < minimumOrderMinor) {
                throw new errors_1.BusinessRuleViolationError(errorCodes_1.ErrorCodes.COUPON_MINIMUM_NOT_MET, `Order subtotal does not meet the minimum requirement of ${minimumOrderMinor} piastres`);
            }
        }
        // 8. Calculate Discount
        let calculatedDiscountMinor = 0;
        if (coupon.discountType === 'percentage') {
            // Value in basis points (1 to 10000; e.g. 1500 = 15.00%)
            calculatedDiscountMinor = Math.round((eligibleSubtotalMinor * coupon.value) / 10000);
        }
        else if (coupon.discountType === 'fixed') {
            calculatedDiscountMinor = Math.round(coupon.value);
        }
        // Strict safety bounds: never negative, never exceeds eligible subtotal, integer minor units
        const discountMinor = Math.max(0, Math.min(calculatedDiscountMinor, eligibleSubtotalMinor));
        return {
            valid: true,
            couponId: coupon._id.toString(),
            code: coupon.codeNormalized,
            discountType: coupon.discountType,
            value: coupon.value,
            discountMinor,
            scopeType: coupon.scopeType,
            scopeIds: coupon.scopeIds,
            appliedTo: coupon.scopeType,
        };
    }
    /**
     * Concurrency-safe atomic redemption execution within a multi-document transaction session.
     * Atomically increments usage count (verifying limit guard) and inserts the unique redemption record.
     */
    async redeemCoupon(couponId, orderId, customerId, discountMinor, session) {
        const ctx = { session };
        // 1. Atomically consume 1 usage slot guarded against usageLimit
        const updatedCoupon = await this.couponRepo.incrementUsageAtomic(couponId, ctx);
        if (!updatedCoupon) {
            throw new errors_1.BusinessRuleViolationError(errorCodes_1.ErrorCodes.COUPON_USAGE_LIMIT_REACHED, 'Coupon usage limit was reached concurrently');
        }
        // 2. Insert immutable redemption record with unique (couponId, orderId) constraint
        const redemption = await this.redemptionRepo.create({
            couponId,
            codeSnapshot: updatedCoupon.codeNormalized,
            orderId,
            customerId,
            discountMinor,
        }, ctx);
        return redemption;
    }
    /**
     * Admin: Create a new coupon.
     */
    async createCoupon(input, actor) {
        const codeNormalized = this.normalizeCouponCode(input.code);
        if (!codeNormalized) {
            throw new errors_1.ValidationError('Coupon code cannot be empty');
        }
        const existing = await this.couponRepo.findByCode(codeNormalized);
        if (existing) {
            throw new errors_1.ConflictError(errorCodes_1.ErrorCodes.COUPON_CODE_CONFLICT, `Coupon code "${codeNormalized}" already exists`);
        }
        const coupon = await this.couponRepo.create({
            codeNormalized,
            discountType: input.discountType,
            value: input.value,
            currency: input.currency ?? (input.discountType === 'fixed' ? 'EGP' : null),
            scopeType: input.scopeType ?? 'order',
            scopeIds: input.scopeIds ?? [],
            active: input.active !== undefined ? input.active : true,
            startsAt: input.startsAt ?? null,
            endsAt: input.endsAt ?? null,
            usageCount: 0,
            usageLimit: input.usageLimit ?? null,
            minimumOrderMinor: input.minimumOrderMinor ?? null,
            stackable: input.stackable ?? null,
            customerRestriction: input.customerRestriction ?? null,
            version: 1,
        });
        await this.audit.record({
            actorId: actor.id,
            actorRole: actor.role,
            action: 'coupon.created',
            entityType: 'Coupon',
            entityId: coupon._id.toString(),
            newState: {
                code: coupon.codeNormalized,
                discountType: coupon.discountType,
                value: coupon.value,
                active: coupon.active,
            },
        });
        return coupon;
    }
    /**
     * Admin: Update coupon configuration with optimistic concurrency.
     */
    async updateCoupon(id, input, actor) {
        const coupon = await this.couponRepo.findById(id);
        if (!coupon) {
            throw new errors_1.NotFoundError(`Coupon not found: ${id}`, errorCodes_1.ErrorCodes.COUPON_NOT_FOUND);
        }
        if (coupon.version !== input.expectedVersion) {
            throw new errors_1.ConflictError(errorCodes_1.ErrorCodes.COUPON_VERSION_CONFLICT, `Coupon version conflict: expected ${input.expectedVersion}, current ${coupon.version}`);
        }
        const updateFields = {};
        if (input.discountType !== undefined)
            updateFields.discountType = input.discountType;
        if (input.value !== undefined)
            updateFields.value = input.value;
        if (input.currency !== undefined)
            updateFields.currency = input.currency;
        if (input.scopeType !== undefined)
            updateFields.scopeType = input.scopeType;
        if (input.scopeIds !== undefined)
            updateFields.scopeIds = input.scopeIds;
        if (input.active !== undefined)
            updateFields.active = input.active;
        if (input.startsAt !== undefined)
            updateFields.startsAt = input.startsAt;
        if (input.endsAt !== undefined)
            updateFields.endsAt = input.endsAt;
        if (input.usageLimit !== undefined)
            updateFields.usageLimit = input.usageLimit;
        if (input.minimumOrderMinor !== undefined)
            updateFields.minimumOrderMinor = input.minimumOrderMinor;
        if (input.stackable !== undefined)
            updateFields.stackable = input.stackable;
        if (input.customerRestriction !== undefined)
            updateFields.customerRestriction = input.customerRestriction;
        const updated = await this.couponRepo.updateWithVersion(id, input.expectedVersion, { $set: updateFields });
        if (!updated) {
            throw new errors_1.ConflictError(errorCodes_1.ErrorCodes.COUPON_VERSION_CONFLICT, 'Coupon version conflict while updating coupon');
        }
        await this.audit.record({
            actorId: actor.id,
            actorRole: actor.role,
            action: 'coupon.updated',
            entityType: 'Coupon',
            entityId: id,
            previousState: {
                value: coupon.value,
                active: coupon.active,
                version: coupon.version,
            },
            newState: {
                value: updated.value,
                active: updated.active,
                version: updated.version,
            },
        });
        return updated;
    }
    /**
     * Admin: Activate coupon.
     */
    async activateCoupon(id, expectedVersion, actor) {
        const coupon = await this.couponRepo.findById(id);
        if (!coupon) {
            throw new errors_1.NotFoundError(`Coupon not found: ${id}`, errorCodes_1.ErrorCodes.COUPON_NOT_FOUND);
        }
        if (coupon.version !== expectedVersion) {
            throw new errors_1.ConflictError(errorCodes_1.ErrorCodes.COUPON_VERSION_CONFLICT, `Coupon version conflict: expected ${expectedVersion}, current ${coupon.version}`);
        }
        const updated = await this.couponRepo.updateWithVersion(id, expectedVersion, { $set: { active: true } });
        if (!updated) {
            throw new errors_1.ConflictError(errorCodes_1.ErrorCodes.COUPON_VERSION_CONFLICT, 'Coupon version conflict while activating coupon');
        }
        await this.audit.record({
            actorId: actor.id,
            actorRole: actor.role,
            action: 'coupon.activated',
            entityType: 'Coupon',
            entityId: id,
            newState: { active: true, version: updated.version },
        });
        return updated;
    }
    /**
     * Admin: Deactivate coupon.
     */
    async deactivateCoupon(id, expectedVersion, actor) {
        const coupon = await this.couponRepo.findById(id);
        if (!coupon) {
            throw new errors_1.NotFoundError(`Coupon not found: ${id}`, errorCodes_1.ErrorCodes.COUPON_NOT_FOUND);
        }
        if (coupon.version !== expectedVersion) {
            throw new errors_1.ConflictError(errorCodes_1.ErrorCodes.COUPON_VERSION_CONFLICT, `Coupon version conflict: expected ${expectedVersion}, current ${coupon.version}`);
        }
        const updated = await this.couponRepo.updateWithVersion(id, expectedVersion, { $set: { active: false } });
        if (!updated) {
            throw new errors_1.ConflictError(errorCodes_1.ErrorCodes.COUPON_VERSION_CONFLICT, 'Coupon version conflict while deactivating coupon');
        }
        await this.audit.record({
            actorId: actor.id,
            actorRole: actor.role,
            action: 'coupon.deactivated',
            entityType: 'Coupon',
            entityId: id,
            newState: { active: false, version: updated.version },
        });
        return updated;
    }
    async getCouponById(id) {
        const coupon = await this.couponRepo.findById(id);
        if (!coupon) {
            throw new errors_1.NotFoundError(`Coupon not found: ${id}`, errorCodes_1.ErrorCodes.COUPON_NOT_FOUND);
        }
        return coupon;
    }
    async listCoupons(filter) {
        const query = {};
        if (filter.active !== undefined)
            query.active = filter.active;
        if (filter.scopeType)
            query.scopeType = filter.scopeType;
        if (filter.discountType)
            query.discountType = filter.discountType;
        if (filter.code)
            query.codeNormalized = this.normalizeCouponCode(filter.code);
        return this.couponRepo.findWithPagination(query, filter.page, filter.limit);
    }
    async listRedemptions(couponId, page, limit) {
        const coupon = await this.couponRepo.findById(couponId);
        if (!coupon) {
            throw new errors_1.NotFoundError(`Coupon not found: ${couponId}`, errorCodes_1.ErrorCodes.COUPON_NOT_FOUND);
        }
        return this.redemptionRepo.findByCouponId(coupon._id, page, limit);
    }
}
exports.CouponService = CouponService;
exports.couponService = new CouponService();
//# sourceMappingURL=coupon.service.js.map