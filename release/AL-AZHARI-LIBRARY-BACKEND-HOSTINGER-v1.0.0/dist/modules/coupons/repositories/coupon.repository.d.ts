import { FilterQuery, Types, UpdateQuery } from 'mongoose';
import { ICoupon, ICouponDocument } from '../types/coupon.types';
import { RepositoryContext } from '../../../common/types';
export declare class CouponRepository {
    findByCode(codeNormalized: string, ctx?: RepositoryContext): Promise<ICouponDocument | null>;
    findById(id: string | Types.ObjectId, ctx?: RepositoryContext): Promise<ICouponDocument | null>;
    create(data: Partial<ICoupon>, ctx?: RepositoryContext): Promise<ICouponDocument>;
    updateWithVersion(id: string | Types.ObjectId, expectedVersion: number, update: UpdateQuery<ICouponDocument>, ctx?: RepositoryContext): Promise<ICouponDocument | null>;
    /**
     * Atomically increments coupon usage count only if coupon is active
     * and usageCount is strictly less than usageLimit (or usageLimit is null).
     * Guaranteed safe against concurrent race conditions.
     */
    incrementUsageAtomic(couponId: Types.ObjectId, ctx?: RepositoryContext): Promise<ICouponDocument | null>;
    findWithPagination(filter: FilterQuery<ICouponDocument>, page?: number, limit?: number): Promise<{
        items: ICouponDocument[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
}
export declare const couponRepository: CouponRepository;
