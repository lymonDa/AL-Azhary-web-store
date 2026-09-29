import { FilterQuery, Types, UpdateQuery } from 'mongoose';
import { CouponModel } from '../models/coupon.model';
import { ICoupon, ICouponDocument } from '../types/coupon.types';
import { RepositoryContext } from '../../../common/types';

export class CouponRepository {
  async findByCode(
    codeNormalized: string,
    ctx?: RepositoryContext,
  ): Promise<ICouponDocument | null> {
    return CouponModel.findOne({ codeNormalized }).session(ctx?.session ?? null).exec();
  }

  async findById(
    id: string | Types.ObjectId,
    ctx?: RepositoryContext,
  ): Promise<ICouponDocument | null> {
    return CouponModel.findById(id).session(ctx?.session ?? null).exec();
  }

  async create(
    data: Partial<ICoupon>,
    ctx?: RepositoryContext,
  ): Promise<ICouponDocument> {
    const docs = await CouponModel.create([data], { session: ctx?.session });
    return docs[0];
  }

  async updateWithVersion(
    id: string | Types.ObjectId,
    expectedVersion: number,
    update: UpdateQuery<ICouponDocument>,
    ctx?: RepositoryContext,
  ): Promise<ICouponDocument | null> {
    return CouponModel.findOneAndUpdate(
      { _id: id, version: expectedVersion },
      {
        ...update,
        $inc: { ...(update.$inc || {}), version: 1 },
      },
      {
        new: true,
        session: ctx?.session ?? null,
      },
    ).exec();
  }

  /**
   * Atomically increments coupon usage count only if coupon is active
   * and usageCount is strictly less than usageLimit (or usageLimit is null).
   * Guaranteed safe against concurrent race conditions.
   */
  async incrementUsageAtomic(
    couponId: Types.ObjectId,
    ctx?: RepositoryContext,
  ): Promise<ICouponDocument | null> {
    return CouponModel.findOneAndUpdate(
      {
        _id: couponId,
        active: true,
        $or: [
          { usageLimit: null },
          { $expr: { $lt: ['$usageCount', '$usageLimit'] } },
        ],
      },
      {
        $inc: { usageCount: 1, version: 1 },
      },
      {
        new: true,
        session: ctx?.session ?? null,
      },
    ).exec();
  }

  async findWithPagination(
    filter: FilterQuery<ICouponDocument>,
    page: number = 1,
    limit: number = 20,
  ): Promise<{ items: ICouponDocument[]; total: number; page: number; limit: number; totalPages: number }> {
    const safePage = Math.max(1, page);
    const safeLimit = Math.max(1, Math.min(100, limit));
    const skip = (safePage - 1) * safeLimit;

    const [items, total] = await Promise.all([
      CouponModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(safeLimit)
        .exec(),
      CouponModel.countDocuments(filter).exec(),
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

export const couponRepository = new CouponRepository();
