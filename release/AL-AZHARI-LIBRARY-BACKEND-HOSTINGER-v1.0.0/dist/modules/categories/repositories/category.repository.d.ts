import { Types } from 'mongoose';
import { ICategory, ICategoryDocument } from '../types/category.types';
export declare class CategoryRepository {
    create(data: Partial<ICategory>): Promise<ICategoryDocument>;
    findById(id: string | Types.ObjectId): Promise<ICategoryDocument | null>;
    findBySlug(slug: string): Promise<ICategoryDocument | null>;
    findAllPublic(): Promise<ICategory[]>;
    findAllAdmin(): Promise<ICategory[]>;
    update(id: string | Types.ObjectId, data: Partial<ICategory>): Promise<ICategoryDocument | null>;
    countChildren(parentId: string | Types.ObjectId): Promise<number>;
    countProducts(categoryId: string | Types.ObjectId): Promise<number>;
}
export declare const categoryRepository: CategoryRepository;
