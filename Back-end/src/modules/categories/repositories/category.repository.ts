import { Types } from 'mongoose';
import { CategoryModel } from '../models/category.model';
import { ICategory, ICategoryDocument } from '../types/category.types';

export class CategoryRepository {
  async create(data: Partial<ICategory>): Promise<ICategoryDocument> {
    return CategoryModel.create(data);
  }

  async findById(id: string | Types.ObjectId): Promise<ICategoryDocument | null> {
    const objectId = typeof id === 'string' ? new Types.ObjectId(id) : id;
    return CategoryModel.findById(objectId);
  }

  async findBySlug(slug: string): Promise<ICategoryDocument | null> {
    return CategoryModel.findOne({ slug: slug.toLowerCase().trim() });
  }

  async findAllPublic(): Promise<ICategory[]> {
    return CategoryModel.find({
      isActive: true,
      isMvpEnabled: true,
    })
      .sort({ isBooksCore: -1, displayOrder: 1, createdAt: 1 })
      .lean<ICategory[]>();
  }

  async findAllAdmin(): Promise<ICategory[]> {
    return CategoryModel.find()
      .sort({ isBooksCore: -1, displayOrder: 1, createdAt: 1 })
      .lean<ICategory[]>();
  }

  async update(
    id: string | Types.ObjectId,
    data: Partial<ICategory>,
  ): Promise<ICategoryDocument | null> {
    const objectId = typeof id === 'string' ? new Types.ObjectId(id) : id;
    return CategoryModel.findByIdAndUpdate(objectId, { $set: data }, { new: true, runValidators: true });
  }

  async countChildren(parentId: string | Types.ObjectId): Promise<number> {
    const objectId = typeof parentId === 'string' ? new Types.ObjectId(parentId) : parentId;
    return CategoryModel.countDocuments({ parentId: objectId });
  }

  async countProducts(categoryId: string | Types.ObjectId): Promise<number> {
    const objectId = typeof categoryId === 'string' ? new Types.ObjectId(categoryId) : categoryId;
    // Safe lookup against products collection without circular dependency
    const db = CategoryModel.db;
    return db.collection('products').countDocuments({ categoryId: objectId });
  }
}

export const categoryRepository = new CategoryRepository();
