import { Types, FilterQuery, UpdateQuery } from 'mongoose';
import { PaymentModel } from '../models/payment.model';
import { IPayment, IPaymentDocument, PaymentOwnerType } from '../types/payment.types';
import { RepositoryContext } from '../../../common/types';

export class PaymentRepository {
  async create(data: Partial<IPayment>, ctx?: RepositoryContext): Promise<IPaymentDocument> {
    const docs = await PaymentModel.create([data], { session: ctx?.session || undefined });
    return docs[0];
  }

  async findById(
    id: string | Types.ObjectId,
    ctx?: RepositoryContext,
  ): Promise<IPaymentDocument | null> {
    const objectId = typeof id === 'string' ? new Types.ObjectId(id) : id;
    const query = PaymentModel.findById(objectId);
    if (ctx?.session) {
      query.session(ctx.session);
    }
    return query;
  }

  async findByOwner(
    ownerType: PaymentOwnerType,
    ownerId: string | Types.ObjectId,
    ctx?: RepositoryContext,
  ): Promise<IPaymentDocument | null> {
    const objectId = typeof ownerId === 'string' ? new Types.ObjectId(ownerId) : ownerId;
    const query = PaymentModel.findOne({ ownerType, ownerId: objectId });
    if (ctx?.session) {
      query.session(ctx.session);
    }
    return query;
  }

  async updateWithVersion(
    id: string | Types.ObjectId,
    expectedVersion: number,
    update: UpdateQuery<IPaymentDocument>,
    ctx?: RepositoryContext,
  ): Promise<IPaymentDocument | null> {
    const objectId = typeof id === 'string' ? new Types.ObjectId(id) : id;
    const query = PaymentModel.findOneAndUpdate(
      { _id: objectId, version: expectedVersion },
      update,
      { new: true, runValidators: true },
    );
    if (ctx?.session) {
      query.session(ctx.session);
    }
    return query;
  }

  async findAdminPayments(
    filter: FilterQuery<IPaymentDocument> = {},
    options: { page?: number; limit?: number } = {},
    ctx?: RepositoryContext,
  ): Promise<{
    items: IPaymentDocument[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 20));
    const skip = (page - 1) * limit;

    const query = PaymentModel.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(limit);
    const countQuery = PaymentModel.countDocuments(filter);

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
}

export const paymentRepository = new PaymentRepository();
