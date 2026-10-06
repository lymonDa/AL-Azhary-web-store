import { Types, FilterQuery, UpdateQuery } from 'mongoose';
import { IOrder, IOrderDocument } from '../types/order.types';
import { RepositoryContext } from '../../../common/types';
export declare class OrderRepository {
    create(data: Partial<IOrder>, ctx?: RepositoryContext): Promise<IOrderDocument>;
    findByReference(reference: string, ctx?: RepositoryContext): Promise<IOrderDocument | null>;
    findById(id: string | Types.ObjectId, ctx?: RepositoryContext): Promise<IOrderDocument | null>;
    findByIdempotencyKey(key: string, ctx?: RepositoryContext): Promise<IOrderDocument | null>;
    findCustomerOrders(customerId: string | Types.ObjectId, options?: {
        page?: number;
        limit?: number;
    }, ctx?: RepositoryContext): Promise<{
        items: IOrderDocument[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findAdminOrders(filter?: FilterQuery<IOrderDocument>, options?: {
        page?: number;
        limit?: number;
    }, ctx?: RepositoryContext): Promise<{
        items: IOrderDocument[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    updateWithVersion(reference: string, expectedVersion: number, update: UpdateQuery<IOrderDocument>, ctx?: RepositoryContext): Promise<IOrderDocument | null>;
}
export declare const orderRepository: OrderRepository;
