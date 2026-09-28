import { Types, FilterQuery, UpdateQuery } from 'mongoose';
import { OrderModel } from '../models/order.model';
import { IOrder, IOrderDocument } from '../types/order.types';
import { RepositoryContext } from '../../../common/types';

export class OrderRepository {
  async create(data: Partial<IOrder>, ctx?: RepositoryContext): Promise<IOrderDocument> {
    const docs = await OrderModel.create([data], { session: ctx?.session || undefined });
    return docs[0];
  }

  async findByReference(
    reference: string,
    ctx?: RepositoryContext,
  ): Promise<IOrderDocument | null> {
    const query = OrderModel.findOne({ reference: reference.trim() });
    if (ctx?.session) {
      query.session(ctx.session);
    }
    return query;
  }

  async findById(
    id: string | Types.ObjectId,
    ctx?: RepositoryContext,
  ): Promise<IOrderDocument | null> {
    const objectId = typeof id === 'string' ? new Types.ObjectId(id) : id;
    const query = OrderModel.findById(objectId);
    if (ctx?.session) {
      query.session(ctx.session);
    }
    return query;
  }

  async findByIdempotencyKey(
    key: string,
    ctx?: RepositoryContext,
  ): Promise<IOrderDocument | null> {
    const query = OrderModel.findOne({ idempotencyKey: key.trim() });
    if (ctx?.session) {
      query.session(ctx.session);
    }
    return query;
  }

  async findCustomerOrders(
    customerId: string | Types.ObjectId,
    options: { page?: number; limit?: number } = {},
    ctx?: RepositoryContext,
  ): Promise<{ items: IOrderDocument[]; total: number; page: number; limit: number; totalPages: number }> {
    const objectId = typeof customerId === 'string' ? new Types.ObjectId(customerId) : customerId;
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 20));
    const skip = (page - 1) * limit;

    const filter = { customerId: objectId };
    const query = OrderModel.find(filter).sort({ submittedAt: -1 }).skip(skip).limit(limit);
    const countQuery = OrderModel.countDocuments(filter);

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

  async findAdminOrders(
    filter: FilterQuery<IOrderDocument> = {},
    options: { page?: number; limit?: number } = {},
    ctx?: RepositoryContext,
  ): Promise<{ items: IOrderDocument[]; total: number; page: number; limit: number; totalPages: number }> {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 20));
    const skip = (page - 1) * limit;

    const query = OrderModel.find(filter).sort({ submittedAt: -1 }).skip(skip).limit(limit);
    const countQuery = OrderModel.countDocuments(filter);

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
    update: UpdateQuery<IOrderDocument>,
    ctx?: RepositoryContext,
  ): Promise<IOrderDocument | null> {
    const query = OrderModel.findOneAndUpdate(
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

export const orderRepository = new OrderRepository();
