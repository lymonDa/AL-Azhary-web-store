import { Types, UpdateQuery } from 'mongoose';
import { IPaymentProof, IPaymentProofDocument, PaymentOwnerType } from '../types/payment.types';
import { RepositoryContext } from '../../../common/types';
export declare class PaymentProofRepository {
    create(data: Partial<IPaymentProof>, ctx?: RepositoryContext): Promise<IPaymentProofDocument>;
    findById(id: string | Types.ObjectId, ctx?: RepositoryContext): Promise<IPaymentProofDocument | null>;
    findByPaymentAndSubmission(paymentId: string | Types.ObjectId, submissionNumber: number, ctx?: RepositoryContext): Promise<IPaymentProofDocument | null>;
    findByPaymentId(paymentId: string | Types.ObjectId, ctx?: RepositoryContext): Promise<IPaymentProofDocument[]>;
    findLatestByPaymentId(paymentId: string | Types.ObjectId, ctx?: RepositoryContext): Promise<IPaymentProofDocument | null>;
    findByOwner(ownerType: PaymentOwnerType, ownerId: string | Types.ObjectId, ctx?: RepositoryContext): Promise<IPaymentProofDocument[]>;
    updateById(id: string | Types.ObjectId, update: UpdateQuery<IPaymentProofDocument>, ctx?: RepositoryContext): Promise<IPaymentProofDocument | null>;
}
export declare const paymentProofRepository: PaymentProofRepository;
