import { Types, UpdateQuery } from 'mongoose';
import { IServiceRequest, IServiceRequestDocument } from '../types/service.types';
import { RepositoryContext } from '../../../common/types';
export declare class ServiceRequestRepository {
    create(data: Partial<IServiceRequest>, ctx?: RepositoryContext): Promise<IServiceRequestDocument>;
    findById(id: string | Types.ObjectId, ctx?: RepositoryContext): Promise<IServiceRequestDocument | null>;
    findByReference(reference: string, ctx?: RepositoryContext): Promise<IServiceRequestDocument | null>;
    findByCustomerId(customerId: string | Types.ObjectId, ctx?: RepositoryContext): Promise<IServiceRequestDocument[]>;
    updateWithVersion(reference: string, expectedVersion: number, update: UpdateQuery<IServiceRequestDocument>, ctx?: RepositoryContext): Promise<IServiceRequestDocument | null>;
    updateById(id: string | Types.ObjectId, update: UpdateQuery<IServiceRequestDocument>, ctx?: RepositoryContext): Promise<IServiceRequestDocument | null>;
}
export declare const serviceRequestRepository: ServiceRequestRepository;
