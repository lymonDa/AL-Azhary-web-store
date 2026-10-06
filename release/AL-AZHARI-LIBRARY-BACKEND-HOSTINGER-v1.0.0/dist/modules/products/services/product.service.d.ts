import { ProductRepository, PaginatedResult } from '../repositories/product.repository';
import { CategoryRepository } from '../../categories/repositories/category.repository';
import { CreateProductInput, UpdateProductInput, SafePublicProduct, SafeAdminProduct, ProductAvailability } from '../types/product.types';
export declare class ProductService {
    private readonly repo;
    private readonly categoryRepo;
    constructor(repo?: ProductRepository, categoryRepo?: CategoryRepository);
    /**
     * Validates publication requirements.
     * Note: description may be null and does not block publication.
     */
    private validatePublicationRules;
    listPublicProducts(query: {
        page?: number;
        limit?: number;
        category?: string;
        availability?: ProductAvailability;
    }): Promise<{
        items: SafePublicProduct[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    searchPublicProducts(rawQuery: string, query: {
        page?: number;
        limit?: number;
        category?: string;
        availability?: ProductAvailability;
    }): Promise<{
        items: SafePublicProduct[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    getPublicProductBySlug(slug: string): Promise<SafePublicProduct>;
    listAdminProducts(page?: number, limit?: number): Promise<PaginatedResult<SafeAdminProduct>>;
    getAdminProductById(id: string): Promise<SafeAdminProduct>;
    createProduct(input: CreateProductInput, actorId?: string, actorRole?: string, requestId?: string): Promise<SafeAdminProduct>;
    updateProduct(id: string, input: UpdateProductInput, actorId?: string, actorRole?: string, requestId?: string): Promise<SafeAdminProduct>;
}
export declare const productService: ProductService;
