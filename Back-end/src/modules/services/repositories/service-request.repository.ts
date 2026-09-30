import { Types, UpdateQuery } from 'mongoose';
import { ServiceRequestModel } from '../models/service-request.model';
import { IServiceRequest, IServiceRequestDocument } from '../types/service.types';
import { RepositoryContext } from '../../../common/types';

export class ServiceRequestRepository {
  async create(
    data: Partial<IServiceRequest>,
    ctx?: RepositoryContext,
  ): Promise<IServiceRequestDocument> {
    const docs = await ServiceRequestModel.create([data], { session: ctx?.session });
    return docs[0];
  }

  async findById(
    id: string | Types.ObjectId,
    ctx?: RepositoryContext,
  ): Promise<IServiceRequestDocument | null> {
    const objectId = typeof id === 'string' ? new Types.ObjectId(id) : id;
    return ServiceRequestModel.findById(objectId).session(ctx?.session ?? null);
  }

  async findByReference(
    reference: string,
    ctx?: RepositoryContext,
  ): Promise<IServiceRequestDocument | null> {
    return ServiceRequestModel.findOne({
      reference: reference.trim(),
    }).session(ctx?.session ?? null);
  }

  async findByCustomerId(
    customerId: string | Types.ObjectId,
    ctx?: RepositoryContext,
  ): Promise<IServiceRequestDocument[]> {
    const objectId = typeof customerId === 'string' ? new Types.ObjectId(customerId) : customerId;
    return ServiceRequestModel.find({ customerId: objectId })
      .sort({ createdAt: -1 })
      .session(ctx?.session ?? null);
  }

  async updateWithVersion(
    reference: string,
    expectedVersion: number,
    update: UpdateQuery<IServiceRequestDocument>,
    ctx?: RepositoryContext,
  ): Promise<IServiceRequestDocument | null> {
    return ServiceRequestModel.findOneAndUpdate(
      {
        reference: reference.trim(),
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

  async updateById(
    id: string | Types.ObjectId,
    update: UpdateQuery<IServiceRequestDocument>,
    ctx?: RepositoryContext,
  ): Promise<IServiceRequestDocument | null> {
    const objectId = typeof id === 'string' ? new Types.ObjectId(id) : id;
    return ServiceRequestModel.findByIdAndUpdate(objectId, update, {
      new: true,
      runValidators: true,
      session: ctx?.session ?? undefined,
    });
  }
}

export const serviceRequestRepository = new ServiceRequestRepository();
