import { Types, FilterQuery, ClientSession } from 'mongoose';
import { ProductModel } from '../models/product.model';
import { IProduct, IProductDocument, ProductAvailability } from '../types/product.types';
import { escapeRegex, normalizeText } from '../utils/search-normalizer';

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

export class ProductRepository {
  async create(data: Partial<IProduct>): Promise<IProductDocument> {
    return ProductModel.create(data);
  }

  async findById(id: string | Types.ObjectId, session?: ClientSession): Promise<IProductDocument | null> {
    const objectId = typeof id === 'string' ? new Types.ObjectId(id) : id;
    const query = ProductModel.findById(objectId);
    if (session) query.session(session);
    return query;
  }

  async findBySlug(slug: string): Promise<IProductDocument | null> {
    return ProductModel.findOne({ slug: slug.toLowerCase().trim() });
  }

  async findPublicBySlug(slug: string): Promise<IProduct | null> {
    return ProductModel.findOne({
      slug: slug.toLowerCase().trim(),
      isPublished: true,
    }).lean<IProduct>();
  }

  async findPublic(
    filters: PublicProductFilters,
    page: number = 1,
    limit: number = 20,
  ): Promise<PaginatedResult<IProduct>> {
    const query: FilterQuery<IProductDocument> = { isPublished: true };

    if (filters.categoryId) {
      query.categoryId = filters.categoryId;
    }

    if (filters.availability) {
      query.availability = filters.availability;
    }

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      ProductModel.find(query)
        .sort({ displayOrder: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean<IProduct[]>(),
      ProductModel.countDocuments(query),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async findSearch(
    rawQuery: string,
    filters: PublicProductFilters,
    page: number = 1,
    limit: number = 20,
  ): Promise<PaginatedResult<IProduct>> {
    const normalized = normalizeText(rawQuery);
    const escaped = escapeRegex(normalized);

    const query: FilterQuery<IProductDocument> = {
      isPublished: true,
      searchText: { $regex: escaped, $options: 'i' },
    };

    if (filters.categoryId) {
      query.categoryId = filters.categoryId;
    }

    if (filters.availability) {
      query.availability = filters.availability;
    }

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      ProductModel.find(query)
        .sort({ displayOrder: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean<IProduct[]>(),
      ProductModel.countDocuments(query),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async findAdmin(page: number = 1, limit: number = 20): Promise<PaginatedResult<IProduct>> {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      ProductModel.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean<IProduct[]>(),
      ProductModel.countDocuments(),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async findPublishedByIds(ids: (string | Types.ObjectId)[]): Promise<IProduct[]> {
    const objectIds = ids.map((id) => (typeof id === 'string' ? new Types.ObjectId(id) : id));
    return ProductModel.find({
      _id: { $in: objectIds },
      isPublished: true,
    }).lean<IProduct[]>();
  }

  async update(
    id: string | Types.ObjectId,
    data: Partial<IProduct>,
  ): Promise<IProductDocument | null> {
    const objectId = typeof id === 'string' ? new Types.ObjectId(id) : id;
    return ProductModel.findByIdAndUpdate(objectId, { $set: data }, { new: true, runValidators: true });
  }
}

export const productRepository = new ProductRepository();
