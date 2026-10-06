import { Types, FilterQuery, UpdateQuery } from 'mongoose';
import { IReturnRequest, IReturnRequestDocument } from '../types/returns.types';
import { RepositoryContext } from '../../../common/types';
export declare class ReturnRequestRepository {
    create(data: Partial<IReturnRequest>, ctx?: RepositoryContext): Promise<IReturnRequestDocument>;
    findByReference(reference: string, ctx?: RepositoryContext): Promise<IReturnRequestDocument | null>;
    findById(id: string | Types.ObjectId, ctx?: RepositoryContext): Promise<IReturnRequestDocument | null>;
    findByOrderId(orderId: string | Types.ObjectId, ctx?: RepositoryContext): Promise<IReturnRequestDocument[]>;
    findActiveByOrderId(orderId: string | Types.ObjectId, ctx?: RepositoryContext): Promise<IReturnRequestDocument[]>;
    findCustomerReturns(customerId: string | Types.ObjectId, options?: {
        page?: number;
        limit?: number;
    }, ctx?: RepositoryContext): Promise<{
        items: IReturnRequestDocument[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findAdminReturns(filter?: FilterQuery<IReturnRequestDocument>, options?: {
        page?: number;
        limit?: number;
    }, ctx?: RepositoryContext): Promise<{
        items: IReturnRequestDocument[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    updateWithVersion(reference: string, expectedVersion: number, update: UpdateQuery<IReturnRequestDocument>, ctx?: RepositoryContext): Promise<IReturnRequestDocument | null>;
}
export declare const returnRequestRepository: ReturnRequestRepository;
