import { CategoryRepository } from '../repositories/category.repository';
import { CreateCategoryInput, UpdateCategoryInput, SafeCategory } from '../types/category.types';
export declare class CategoryService {
    private readonly repo;
    constructor(repo?: CategoryRepository);
    listPublicCategories(): Promise<SafeCategory[]>;
    listAdminCategories(): Promise<SafeCategory[]>;
    getCategoryById(id: string): Promise<SafeCategory>;
    createCategory(input: CreateCategoryInput, actorId?: string, actorRole?: string, requestId?: string): Promise<SafeCategory>;
    updateCategory(id: string, input: UpdateCategoryInput, actorId?: string, actorRole?: string, requestId?: string): Promise<SafeCategory>;
    deleteCategory(id: string, actorId?: string, actorRole?: string, requestId?: string): Promise<SafeCategory>;
}
export declare const categoryService: CategoryService;
