import { Types, UpdateQuery } from 'mongoose';
import { IQuotation, IQuotationDocument } from '../types/quotation.types';
import { RepositoryContext } from '../../../common/types';
export declare class QuotationRepository {
    create(data: Partial<IQuotation>, ctx?: RepositoryContext): Promise<IQuotationDocument>;
    findById(id: string | Types.ObjectId, ctx?: RepositoryContext): Promise<IQuotationDocument | null>;
    findByServiceRequestId(serviceRequestId: string | Types.ObjectId, ctx?: RepositoryContext): Promise<IQuotationDocument[]>;
    findLatestByServiceRequestId(serviceRequestId: string | Types.ObjectId, ctx?: RepositoryContext): Promise<IQuotationDocument | null>;
    updateWithVersion(id: string | Types.ObjectId, expectedVersion: number, update: UpdateQuery<IQuotationDocument>, ctx?: RepositoryContext): Promise<IQuotationDocument | null>;
}
export declare const quotationRepository: QuotationRepository;
