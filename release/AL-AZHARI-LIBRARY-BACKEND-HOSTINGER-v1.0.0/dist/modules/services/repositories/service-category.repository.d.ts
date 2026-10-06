import { Types } from 'mongoose';
import { IServiceCategory, IServiceCategoryDocument } from '../types/service.types';
import { RepositoryContext } from '../../../common/types';
export declare class ServiceCategoryRepository {
    create(data: Partial<IServiceCategory>, ctx?: RepositoryContext): Promise<IServiceCategoryDocument>;
    findById(id: string | Types.ObjectId, ctx?: RepositoryContext): Promise<IServiceCategoryDocument | null>;
    findBySlug(slug: string, ctx?: RepositoryContext): Promise<IServiceCategoryDocument | null>;
    findActive(ctx?: RepositoryContext): Promise<IServiceCategoryDocument[]>;
    findAll(ctx?: RepositoryContext): Promise<IServiceCategoryDocument[]>;
    upsertBySlug(slug: string, data: Partial<IServiceCategory>, ctx?: RepositoryContext): Promise<IServiceCategoryDocument | null>;
}
export declare const serviceCategoryRepository: ServiceCategoryRepository;
