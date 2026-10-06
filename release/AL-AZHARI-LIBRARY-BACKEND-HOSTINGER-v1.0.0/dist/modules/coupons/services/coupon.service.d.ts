import { ClientSession, Types } from 'mongoose';
import { CouponRepository } from '../repositories/coupon.repository';
import { CouponRedemptionRepository } from '../repositories/coupon-redemption.repository';
import { CouponQueryFilter, CouponValidationResult, CreateCouponInput, ICouponDocument, ICouponRedemptionDocument, UpdateCouponInput, ValidateCouponInput } from '../types/coupon.types';
import { AuditService } from '../../audit/services/audit.service';
export declare class CouponService {
    private readonly couponRepo;
    private readonly redemptionRepo;
    private readonly audit;
    constructor(couponRepo?: CouponRepository, redemptionRepo?: CouponRedemptionRepository, audit?: AuditService);
    /**
     * Normalizes coupon code: trims whitespace and converts to uppercase.
     */
    normalizeCouponCode(code: string): string;
    /**
     * Validates a coupon code against candidate order items, customer, and subtotal.
     * Centralized server-side discount calculation using integer minor units.
     */
    validateCoupon(input: ValidateCouponInput, session?: ClientSession): Promise<CouponValidationResult>;
    /**
     * Concurrency-safe atomic redemption execution within a multi-document transaction session.
     * Atomically increments usage count (verifying limit guard) and inserts the unique redemption record.
     */
    redeemCoupon(couponId: Types.ObjectId, orderId: Types.ObjectId, customerId: Types.ObjectId | null, discountMinor: number, session: ClientSession): Promise<ICouponRedemptionDocument>;
    /**
     * Admin: Create a new coupon.
     */
    createCoupon(input: CreateCouponInput, actor: {
        id: string;
        role: string;
    }): Promise<ICouponDocument>;
    /**
     * Admin: Update coupon configuration with optimistic concurrency.
     */
    updateCoupon(id: string, input: UpdateCouponInput, actor: {
        id: string;
        role: string;
    }): Promise<ICouponDocument>;
    /**
     * Admin: Activate coupon.
     */
    activateCoupon(id: string, expectedVersion: number, actor: {
        id: string;
        role: string;
    }): Promise<ICouponDocument>;
    /**
     * Admin: Deactivate coupon.
     */
    deactivateCoupon(id: string, expectedVersion: number, actor: {
        id: string;
        role: string;
    }): Promise<ICouponDocument>;
    getCouponById(id: string): Promise<ICouponDocument>;
    listCoupons(filter: CouponQueryFilter): Promise<{
        items: ICouponDocument[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    listRedemptions(couponId: string, page?: number, limit?: number): Promise<{
        items: ICouponRedemptionDocument[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
}
export declare const couponService: CouponService;
