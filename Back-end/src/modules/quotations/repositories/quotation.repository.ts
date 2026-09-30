import { Types, UpdateQuery } from 'mongoose';
import { QuotationModel } from '../models/quotation.model';
import { IQuotation, IQuotationDocument } from '../types/quotation.types';
import { RepositoryContext } from '../../../common/types';

export class QuotationRepository {
  async create(data: Partial<IQuotation>, ctx?: RepositoryContext): Promise<IQuotationDocument> {
    const docs = await QuotationModel.create([data], { session: ctx?.session });
    return docs[0];
  }

  async findById(
    id: string | Types.ObjectId,
    ctx?: RepositoryContext,
  ): Promise<IQuotationDocument | null> {
    const objectId = typeof id === 'string' ? new Types.ObjectId(id) : id;
    return QuotationModel.findById(objectId).session(ctx?.session ?? null);
  }

  async findByServiceRequestId(
    serviceRequestId: string | Types.ObjectId,
    ctx?: RepositoryContext,
  ): Promise<IQuotationDocument[]> {
    const objectId =
      typeof serviceRequestId === 'string' ? new Types.ObjectId(serviceRequestId) : serviceRequestId;
    return QuotationModel.find({ serviceRequestId: objectId })
      .sort({ version: -1 })
      .session(ctx?.session ?? null);
  }

  async findLatestByServiceRequestId(
    serviceRequestId: string | Types.ObjectId,
    ctx?: RepositoryContext,
  ): Promise<IQuotationDocument | null> {
    const objectId =
      typeof serviceRequestId === 'string' ? new Types.ObjectId(serviceRequestId) : serviceRequestId;
    return QuotationModel.findOne({ serviceRequestId: objectId })
      .sort({ version: -1 })
      .session(ctx?.session ?? null);
  }

  async updateWithVersion(
    id: string | Types.ObjectId,
    expectedVersion: number,
    update: UpdateQuery<IQuotationDocument>,
    ctx?: RepositoryContext,
  ): Promise<IQuotationDocument | null> {
    const objectId = typeof id === 'string' ? new Types.ObjectId(id) : id;
    return QuotationModel.findOneAndUpdate(
      {
        _id: objectId,
        version: expectedVersion,
      },
      update,
      {
        new: true,
        runValidators: true,
        session: ctx?.session ?? undefined,
      },
    );
  }
}

export const quotationRepository = new QuotationRepository();
