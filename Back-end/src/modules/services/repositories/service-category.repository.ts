import { Types } from 'mongoose';
import { ServiceCategoryModel } from '../models/service-category.model';
import { IServiceCategory, IServiceCategoryDocument } from '../types/service.types';
import { RepositoryContext } from '../../../common/types';

export class ServiceCategoryRepository {
  async create(
    data: Partial<IServiceCategory>,
    ctx?: RepositoryContext,
  ): Promise<IServiceCategoryDocument> {
    const docs = await ServiceCategoryModel.create([data], { session: ctx?.session });
    return docs[0];
  }

  async findById(
    id: string | Types.ObjectId,
    ctx?: RepositoryContext,
  ): Promise<IServiceCategoryDocument | null> {
    const objectId = typeof id === 'string' ? new Types.ObjectId(id) : id;
    return ServiceCategoryModel.findById(objectId).session(ctx?.session ?? null);
  }

  async findBySlug(
    slug: string,
    ctx?: RepositoryContext,
  ): Promise<IServiceCategoryDocument | null> {
    return ServiceCategoryModel.findOne({
      slug: slug.toLowerCase().trim(),
    }).session(ctx?.session ?? null);
  }

  async findActive(ctx?: RepositoryContext): Promise<IServiceCategoryDocument[]> {
    return ServiceCategoryModel.find({ isActive: true })
      .sort({ createdAt: 1 })
      .session(ctx?.session ?? null);
  }

  async findAll(ctx?: RepositoryContext): Promise<IServiceCategoryDocument[]> {
    return ServiceCategoryModel.find()
      .sort({ createdAt: 1 })
      .session(ctx?.session ?? null);
  }

  async upsertBySlug(
    slug: string,
    data: Partial<IServiceCategory>,
    ctx?: RepositoryContext,
  ): Promise<IServiceCategoryDocument | null> {
    return ServiceCategoryModel.findOneAndUpdate(
      { slug: slug.toLowerCase().trim() },
      { $set: data },
      {
        new: true,
        upsert: true,
        runValidators: true,
        session: ctx?.session ?? undefined,
      },
    );
  }
}

export const serviceCategoryRepository = new ServiceCategoryRepository();
