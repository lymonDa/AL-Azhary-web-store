import { ICategoryDocument, ICategory, SafeCategory } from '../types/category.types';
export declare function toSafeCategory(category: ICategoryDocument | ICategory | Record<string, unknown>): SafeCategory;
