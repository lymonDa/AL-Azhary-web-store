import { Types, FilterQuery, UpdateQuery } from 'mongoose';
import { RefundModel } from '../models/refund.model';
import { IRefund, IRefundDocument } from '../types/returns.types';
import { RepositoryContext } from '../../../common/types';

export class RefundRepository {
  async create(data: Partial<IRefund>, ctx?: RepositoryContext): Promise<IRefundDocument> {
    const docs = await RefundModel.create([data], { session: ctx?.session || undefined });
    return docs[0];
  }

  async findById(
    id: string | Types.ObjectId,
    ctx?: RepositoryContext,
  ): Promise<IRefundDocument | null> {
    const objectId = typeof id === 'string' ? new Types.ObjectId(id) : id;
    const query = RefundModel.findById(objectId);
    if (ctx?.session) {
      query.session(ctx.session);
    }
    return query;
  }

  async findByReturnRequestId(
    returnRequestId: string | Types.ObjectId,
    ctx?: RepositoryContext,
  ): Promise<IRefundDocument | null> {
    const objectId = typeof returnRequestId === 'string' ? new Types.ObjectId(returnRequestId) : returnRequestId;
    const query = RefundModel.findOne({ returnRequestId: objectId });
    if (ctx?.session) {
      query.session(ctx.session);
    }
    return query;
  }

  async findByOrderId(
    orderId: string | Types.ObjectId,
    ctx?: RepositoryContext,
  ): Promise<IRefundDocument[]> {
    const objectId = typeof orderId === 'string' ? new Types.ObjectId(orderId) : orderId;
    const query = RefundModel.find({ orderId: objectId }).sort({ createdAt: -1 });
    if (ctx?.session) {
      query.session(ctx.session);
    }
    return query;
  }

  async findCustomerRefunds(
    customerId: string | Types.ObjectId,
    options: { page?: number; limit?: number } = {},
    ctx?: RepositoryContext,
  ): Promise<{ items: IRefundDocument[]; total: number; page: number; limit: number; totalPages: number }> {
    const objectId = typeof customerId === 'string' ? new Types.ObjectId(customerId) : customerId;
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 20));
    const skip = (page - 1) * limit;

    const filter = { customerId: objectId };
    const query = RefundModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit);
    const countQuery = RefundModel.countDocuments(filter);

    if (ctx?.session) {
      query.session(ctx.session);
      countQuery.session(ctx.session);
    }

    const [items, total] = await Promise.all([query.exec(), countQuery.exec()]);
    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async findAdminRefunds(
    filter: FilterQuery<IRefundDocument> = {},
    options: { page?: number; limit?: number } = {},
    ctx?: RepositoryContext,
  ): Promise<{ items: IRefundDocument[]; total: number; page: number; limit: number; totalPages: number }> {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 20));
    const skip = (page - 1) * limit;

    const query = RefundModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit);
    const countQuery = RefundModel.countDocuments(filter);

    if (ctx?.session) {
      query.session(ctx.session);
      countQuery.session(ctx.session);
    }

    const [items, total] = await Promise.all([query.exec(), countQuery.exec()]);
    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async updateWithVersion(
    id: string | Types.ObjectId,
    expectedVersion: number,
    update: UpdateQuery<IRefundDocument>,
    ctx?: RepositoryContext,
  ): Promise<IRefundDocument | null> {
    const objectId = typeof id === 'string' ? new Types.ObjectId(id) : id;
    const query = RefundModel.findOneAndUpdate(
      { _id: objectId, version: expectedVersion },
      update,
      { new: true, runValidators: true },
    );
    if (ctx?.session) {
      query.session(ctx.session);
    }
    return query;
  }
}

export const refundRepository = new RefundRepository();
