import { Types } from 'mongoose';
import { ICouponRedemption, ICouponRedemptionDocument } from '../types/coupon.types';
import { RepositoryContext } from '../../../common/types';
export declare class CouponRedemptionRepository {
    create(data: Partial<ICouponRedemption>, ctx?: RepositoryContext): Promise<ICouponRedemptionDocument>;
    findByCouponAndOrder(couponId: Types.ObjectId, orderId: Types.ObjectId, ctx?: RepositoryContext): Promise<ICouponRedemptionDocument | null>;
    findByOrderId(orderId: Types.ObjectId, ctx?: RepositoryContext): Promise<ICouponRedemptionDocument | null>;
    findByCouponId(couponId: Types.ObjectId, page?: number, limit?: number): Promise<{
        items: ICouponRedemptionDocument[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findByCustomerId(customerId: Types.ObjectId, page?: number, limit?: number): Promise<{
        items: ICouponRedemptionDocument[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
}
export declare const couponRedemptionRepository: CouponRedemptionRepository;
