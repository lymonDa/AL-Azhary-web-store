import { Types, FilterQuery, UpdateQuery } from 'mongoose';
import { ReturnRequestModel } from '../models/return-request.model';
import { IReturnRequest, IReturnRequestDocument } from '../types/returns.types';
import { RepositoryContext } from '../../../common/types';

export class ReturnRequestRepository {
  async create(data: Partial<IReturnRequest>, ctx?: RepositoryContext): Promise<IReturnRequestDocument> {
    const docs = await ReturnRequestModel.create([data], { session: ctx?.session || undefined });
    return docs[0];
  }

  async findByReference(
    reference: string,
    ctx?: RepositoryContext,
  ): Promise<IReturnRequestDocument | null> {
    const query = ReturnRequestModel.findOne({ reference: reference.trim() });
    if (ctx?.session) {
      query.session(ctx.session);
    }
    return query;
  }

  async findById(
    id: string | Types.ObjectId,
    ctx?: RepositoryContext,
  ): Promise<IReturnRequestDocument | null> {
    const objectId = typeof id === 'string' ? new Types.ObjectId(id) : id;
    const query = ReturnRequestModel.findById(objectId);
    if (ctx?.session) {
      query.session(ctx.session);
    }
    return query;
  }

  async findByOrderId(
    orderId: string | Types.ObjectId,
    ctx?: RepositoryContext,
  ): Promise<IReturnRequestDocument[]> {
    const objectId = typeof orderId === 'string' ? new Types.ObjectId(orderId) : orderId;
    const query = ReturnRequestModel.find({ orderId: objectId }).sort({ createdAt: -1 });
    if (ctx?.session) {
      query.session(ctx.session);
    }
    return query;
  }

  async findActiveByOrderId(
    orderId: string | Types.ObjectId,
    ctx?: RepositoryContext,
  ): Promise<IReturnRequestDocument[]> {
    const objectId = typeof orderId === 'string' ? new Types.ObjectId(orderId) : orderId;
    const query = ReturnRequestModel.find({
      orderId: objectId,
      status: { $in: ['return_requested', 'return_review', 'return_approved', 'refund_initiated'] },
    });
    if (ctx?.session) {
      query.session(ctx.session);
    }
    return query;
  }

  async findCustomerReturns(
    customerId: string | Types.ObjectId,
    options: { page?: number; limit?: number } = {},
    ctx?: RepositoryContext,
  ): Promise<{ items: IReturnRequestDocument[]; total: number; page: number; limit: number; totalPages: number }> {
    const objectId = typeof customerId === 'string' ? new Types.ObjectId(customerId) : customerId;
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 20));
    const skip = (page - 1) * limit;

    const filter = { customerId: objectId };
    const query = ReturnRequestModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit);
    const countQuery = ReturnRequestModel.countDocuments(filter);

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

  async findAdminReturns(
    filter: FilterQuery<IReturnRequestDocument> = {},
    options: { page?: number; limit?: number } = {},
    ctx?: RepositoryContext,
  ): Promise<{ items: IReturnRequestDocument[]; total: number; page: number; limit: number; totalPages: number }> {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 20));
    const skip = (page - 1) * limit;

    const query = ReturnRequestModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit);
    const countQuery = ReturnRequestModel.countDocuments(filter);

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
    reference: string,
    expectedVersion: number,
    update: UpdateQuery<IReturnRequestDocument>,
    ctx?: RepositoryContext,
  ): Promise<IReturnRequestDocument | null> {
    const query = ReturnRequestModel.findOneAndUpdate(
      { reference: reference.trim(), version: expectedVersion },
      update,
      { new: true, runValidators: true },
    );
    if (ctx?.session) {
      query.session(ctx.session);
    }
    return query;
  }
}

export const returnRequestRepository = new ReturnRequestRepository();
