import { Types, ClientSession } from 'mongoose';
import { IProduct, IProductDocument, ProductAvailability } from '../types/product.types';
export interface PublicProductFilters {
    categoryId?: Types.ObjectId;
    availability?: ProductAvailability;
}
export interface PaginatedResult<T> {
    items: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
export declare class ProductRepository {
    create(data: Partial<IProduct>): Promise<IProductDocument>;
    findById(id: string | Types.ObjectId, session?: ClientSession): Promise<IProductDocument | null>;
    findBySlug(slug: string): Promise<IProductDocument | null>;
    findPublicBySlug(slug: string): Promise<IProduct | null>;
    findPublic(filters: PublicProductFilters, page?: number, limit?: number): Promise<PaginatedResult<IProduct>>;
    findSearch(rawQuery: string, filters: PublicProductFilters, page?: number, limit?: number): Promise<PaginatedResult<IProduct>>;
    findAdmin(page?: number, limit?: number): Promise<PaginatedResult<IProduct>>;
    findPublishedByIds(ids: (string | Types.ObjectId)[]): Promise<IProduct[]>;
    update(id: string | Types.ObjectId, data: Partial<IProduct>): Promise<IProductDocument | null>;
}
export declare const productRepository: ProductRepository;
