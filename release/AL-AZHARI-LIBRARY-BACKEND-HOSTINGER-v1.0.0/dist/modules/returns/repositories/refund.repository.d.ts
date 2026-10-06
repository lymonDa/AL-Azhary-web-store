import { Types, FilterQuery, UpdateQuery } from 'mongoose';
import { IRefund, IRefundDocument } from '../types/returns.types';
import { RepositoryContext } from '../../../common/types';
export declare class RefundRepository {
    create(data: Partial<IRefund>, ctx?: RepositoryContext): Promise<IRefundDocument>;
    findById(id: string | Types.ObjectId, ctx?: RepositoryContext): Promise<IRefundDocument | null>;
    findByReturnRequestId(returnRequestId: string | Types.ObjectId, ctx?: RepositoryContext): Promise<IRefundDocument | null>;
    findByOrderId(orderId: string | Types.ObjectId, ctx?: RepositoryContext): Promise<IRefundDocument[]>;
    findCustomerRefunds(customerId: string | Types.ObjectId, options?: {
        page?: number;
        limit?: number;
    }, ctx?: RepositoryContext): Promise<{
        items: IRefundDocument[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findAdminRefunds(filter?: FilterQuery<IRefundDocument>, options?: {
        page?: number;
        limit?: number;
    }, ctx?: RepositoryContext): Promise<{
        items: IRefundDocument[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    updateWithVersion(id: string | Types.ObjectId, expectedVersion: number, update: UpdateQuery<IRefundDocument>, ctx?: RepositoryContext): Promise<IRefundDocument | null>;
}
export declare const refundRepository: RefundRepository;
