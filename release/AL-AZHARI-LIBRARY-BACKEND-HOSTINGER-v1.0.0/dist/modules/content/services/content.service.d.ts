import { ContentRepository } from '../repositories/content.repository';
import { ProductRepository } from '../../products/repositories/product.repository';
import { CategoryRepository } from '../../categories/repositories/category.repository';
import { CreateContentModuleInput, UpdateContentModuleInput, SafePublicContentModule, SafeAdminContentModule, IContentModuleDocument, IContentModule } from '../types/content.types';
export declare function toSafeAdminContentModule(module: IContentModuleDocument | IContentModule | Record<string, unknown>): SafeAdminContentModule;
export declare class ContentService {
    private readonly repo;
    private readonly productRepo;
    private readonly categoryRepo;
    constructor(repo?: ContentRepository, productRepo?: ProductRepository, categoryRepo?: CategoryRepository);
    getHomeContent(): Promise<SafePublicContentModule[]>;
    listAdminContent(): Promise<SafeAdminContentModule[]>;
    getContentById(id: string): Promise<SafeAdminContentModule>;
    createContent(input: CreateContentModuleInput, actorId?: string, actorRole?: string, requestId?: string): Promise<SafeAdminContentModule>;
    updateContent(id: string, input: UpdateContentModuleInput, actorId?: string, actorRole?: string, requestId?: string): Promise<SafeAdminContentModule>;
    deleteContent(id: string, actorId?: string, actorRole?: string, requestId?: string): Promise<void>;
}
export declare const contentService: ContentService;
