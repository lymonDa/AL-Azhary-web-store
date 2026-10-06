import { Types, FilterQuery, UpdateQuery } from 'mongoose';
import { IPayment, IPaymentDocument, PaymentOwnerType } from '../types/payment.types';
import { RepositoryContext } from '../../../common/types';
export declare class PaymentRepository {
    create(data: Partial<IPayment>, ctx?: RepositoryContext): Promise<IPaymentDocument>;
    findById(id: string | Types.ObjectId, ctx?: RepositoryContext): Promise<IPaymentDocument | null>;
    findByOwner(ownerType: PaymentOwnerType, ownerId: string | Types.ObjectId, ctx?: RepositoryContext): Promise<IPaymentDocument | null>;
    updateWithVersion(id: string | Types.ObjectId, expectedVersion: number, update: UpdateQuery<IPaymentDocument>, ctx?: RepositoryContext): Promise<IPaymentDocument | null>;
    findAdminPayments(filter?: FilterQuery<IPaymentDocument>, options?: {
        page?: number;
        limit?: number;
    }, ctx?: RepositoryContext): Promise<{
        items: IPaymentDocument[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
}
export declare const paymentRepository: PaymentRepository;
