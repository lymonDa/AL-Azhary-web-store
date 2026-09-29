import { ClientSession, FilterQuery, Types, UpdateQuery } from 'mongoose';
import { ShippingRuleModel } from '../models/shipping-rule.model';
import { IShippingRule, IShippingRuleDocument } from '../types/shipping.types';

export class ShippingRepository {
  async findActiveRules(now: Date = new Date(), session?: ClientSession): Promise<IShippingRuleDocument[]> {
    return ShippingRuleModel.find({
      isActive: true,
      $and: [
        {
          $or: [
            { effectiveFrom: null },
            { effectiveFrom: { $lte: now } },
          ],
        },
        {
          $or: [
            { effectiveTo: null },
            { effectiveTo: { $gte: now } },
          ],
        },
      ],
    })
      .sort({ priority: -1 })
      .session(session ?? null)
      .exec();
  }

  async findById(
    id: string | Types.ObjectId,
    session?: ClientSession,
  ): Promise<IShippingRuleDocument | null> {
    return ShippingRuleModel.findById(id).session(session ?? null).exec();
  }

  async create(
    data: Partial<IShippingRule>,
    session?: ClientSession,
  ): Promise<IShippingRuleDocument> {
    const docs = await ShippingRuleModel.create([data], { session });
    return docs[0];
  }

  async update(
    id: string | Types.ObjectId,
    update: UpdateQuery<IShippingRuleDocument>,
    session?: ClientSession,
  ): Promise<IShippingRuleDocument | null> {
    return ShippingRuleModel.findByIdAndUpdate(id, update, {
      new: true,
      session: session ?? null,
    }).exec();
  }

  async delete(
    id: string | Types.ObjectId,
    session?: ClientSession,
  ): Promise<IShippingRuleDocument | null> {
    return ShippingRuleModel.findByIdAndDelete(id).session(session ?? null).exec();
  }

  async findWithPagination(
    filter: FilterQuery<IShippingRuleDocument>,
    page: number = 1,
    limit: number = 20,
  ): Promise<{ items: IShippingRuleDocument[]; total: number; page: number; limit: number; totalPages: number }> {
    const safePage = Math.max(1, page);
    const safeLimit = Math.max(1, Math.min(100, limit));
    const skip = (safePage - 1) * safeLimit;

    const [items, total] = await Promise.all([
      ShippingRuleModel.find(filter)
        .sort({ priority: -1, createdAt: -1 })
        .skip(skip)
        .limit(safeLimit)
        .exec(),
      ShippingRuleModel.countDocuments(filter).exec(),
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

export const shippingRepository = new ShippingRepository();
