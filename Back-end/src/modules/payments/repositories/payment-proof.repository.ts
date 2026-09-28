import { Types, UpdateQuery } from 'mongoose';
import { PaymentProofModel } from '../models/payment-proof.model';
import { IPaymentProof, IPaymentProofDocument, PaymentOwnerType } from '../types/payment.types';
import { RepositoryContext } from '../../../common/types';

export class PaymentProofRepository {
  async create(data: Partial<IPaymentProof>, ctx?: RepositoryContext): Promise<IPaymentProofDocument> {
    const docs = await PaymentProofModel.create([data], { session: ctx?.session || undefined });
    return docs[0];
  }

  async findById(
    id: string | Types.ObjectId,
    ctx?: RepositoryContext,
  ): Promise<IPaymentProofDocument | null> {
    const objectId = typeof id === 'string' ? new Types.ObjectId(id) : id;
    const query = PaymentProofModel.findById(objectId);
    if (ctx?.session) {
      query.session(ctx.session);
    }
    return query;
  }

  async findByPaymentAndSubmission(
    paymentId: string | Types.ObjectId,
    submissionNumber: number,
    ctx?: RepositoryContext,
  ): Promise<IPaymentProofDocument | null> {
    const objectId = typeof paymentId === 'string' ? new Types.ObjectId(paymentId) : paymentId;
    const query = PaymentProofModel.findOne({ paymentId: objectId, submissionNumber });
    if (ctx?.session) {
      query.session(ctx.session);
    }
    return query;
  }

  async findByPaymentId(
    paymentId: string | Types.ObjectId,
    ctx?: RepositoryContext,
  ): Promise<IPaymentProofDocument[]> {
    const objectId = typeof paymentId === 'string' ? new Types.ObjectId(paymentId) : paymentId;
    const query = PaymentProofModel.find({ paymentId: objectId }).sort({ submissionNumber: -1 });
    if (ctx?.session) {
      query.session(ctx.session);
    }
    return query.exec();
  }

  async findLatestByPaymentId(
    paymentId: string | Types.ObjectId,
    ctx?: RepositoryContext,
  ): Promise<IPaymentProofDocument | null> {
    const objectId = typeof paymentId === 'string' ? new Types.ObjectId(paymentId) : paymentId;
    const query = PaymentProofModel.findOne({ paymentId: objectId }).sort({ submissionNumber: -1 });
    if (ctx?.session) {
      query.session(ctx.session);
    }
    return query.exec();
  }

  async findByOwner(
    ownerType: PaymentOwnerType,
    ownerId: string | Types.ObjectId,
    ctx?: RepositoryContext,
  ): Promise<IPaymentProofDocument[]> {
    const objectId = typeof ownerId === 'string' ? new Types.ObjectId(ownerId) : ownerId;
    const query = PaymentProofModel.find({ ownerType, ownerId: objectId }).sort({ submissionNumber: -1 });
    if (ctx?.session) {
      query.session(ctx.session);
    }
    return query.exec();
  }

  async updateById(
    id: string | Types.ObjectId,
    update: UpdateQuery<IPaymentProofDocument>,
    ctx?: RepositoryContext,
  ): Promise<IPaymentProofDocument | null> {
    const objectId = typeof id === 'string' ? new Types.ObjectId(id) : id;
    const query = PaymentProofModel.findByIdAndUpdate(objectId, update, {
      new: true,
      runValidators: true,
    });
    if (ctx?.session) {
      query.session(ctx.session);
    }
    return query.exec();
  }
}

export const paymentProofRepository = new PaymentProofRepository();
