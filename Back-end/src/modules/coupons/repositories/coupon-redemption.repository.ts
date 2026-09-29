import { Types } from 'mongoose';
import { CouponRedemptionModel } from '../models/coupon-redemption.model';
import { ICouponRedemption, ICouponRedemptionDocument } from '../types/coupon.types';
import { RepositoryContext } from '../../../common/types';

export class CouponRedemptionRepository {
  async create(
    data: Partial<ICouponRedemption>,
    ctx?: RepositoryContext,
  ): Promise<ICouponRedemptionDocument> {
    const docs = await CouponRedemptionModel.create([data], { session: ctx?.session });
    return docs[0];
  }

  async findByCouponAndOrder(
    couponId: Types.ObjectId,
    orderId: Types.ObjectId,
    ctx?: RepositoryContext,
  ): Promise<ICouponRedemptionDocument | null> {
    return CouponRedemptionModel.findOne({ couponId, orderId })
      .session(ctx?.session ?? null)
      .exec();
  }

  async findByOrderId(
    orderId: Types.ObjectId,
    ctx?: RepositoryContext,
  ): Promise<ICouponRedemptionDocument | null> {
    return CouponRedemptionModel.findOne({ orderId })
      .session(ctx?.session ?? null)
      .exec();
  }

  async findByCouponId(
    couponId: Types.ObjectId,
    page: number = 1,
    limit: number = 20,
  ): Promise<{ items: ICouponRedemptionDocument[]; total: number; page: number; limit: number; totalPages: number }> {
    const safePage = Math.max(1, page);
    const safeLimit = Math.max(1, Math.min(100, limit));
    const skip = (safePage - 1) * safeLimit;

    const [items, total] = await Promise.all([
      CouponRedemptionModel.find({ couponId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(safeLimit)
        .exec(),
      CouponRedemptionModel.countDocuments({ couponId }).exec(),
    ]);

    return {
      items,
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit) || 1,
    };
  }

  async findByCustomerId(
    customerId: Types.ObjectId,
    page: number = 1,
    limit: number = 20,
  ): Promise<{ items: ICouponRedemptionDocument[]; total: number; page: number; limit: number; totalPages: number }> {
    const safePage = Math.max(1, page);
    const safeLimit = Math.max(1, Math.min(100, limit));
    const skip = (safePage - 1) * safeLimit;

    const [items, total] = await Promise.all([
      CouponRedemptionModel.find({ customerId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(safeLimit)
        .exec(),
      CouponRedemptionModel.countDocuments({ customerId }).exec(),
    ]);

    return {
      items,
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit) || 1,
    };
  }
}

export const couponRedemptionRepository = new CouponRedemptionRepository();
