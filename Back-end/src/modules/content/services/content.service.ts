import { Types } from 'mongoose';
import { contentRepository, ContentRepository } from '../repositories/content.repository';
import { productRepository, ProductRepository } from '../../products/repositories/product.repository';
import { categoryRepository, CategoryRepository } from '../../categories/repositories/category.repository';
import {
  CreateContentModuleInput,
  UpdateContentModuleInput,
  SafePublicContentModule,
  SafeAdminContentModule,
  IContentModuleDocument,
  IContentModule,
} from '../types/content.types';
import { toSafePublicProduct } from '../../products/utils/product.projection';
import { toSafeCategory } from '../../categories/utils/category.projection';
import { SafePublicProduct } from '../../products/types/product.types';
import { SafeCategory } from '../../categories/types/category.types';
import { ConflictError, NotFoundError, BadRequestError, ErrorCodes } from '../../../common/errors';
import { auditService } from '../../audit';

export function toSafeAdminContentModule(
  module: IContentModuleDocument | IContentModule | Record<string, unknown>,
): SafeAdminContentModule {
  const record = module as unknown as Record<string, unknown>;
  const rawId = record._id ?? record.id;
  const id = typeof rawId === 'object' && rawId !== null ? rawId.toString() : String(rawId);

  const rawProductIds = Array.isArray(record.productIds) ? record.productIds : [];
  const rawCategoryIds = Array.isArray(record.categoryIds) ? record.categoryIds : [];

  return {
    id,
    key: String(record.key ?? ''),
    title: (record.title as SafeAdminContentModule['title']) ?? { ar: '' },
    body: (record.body as SafeAdminContentModule['body']) ?? null,
    moduleType: record.moduleType as SafeAdminContentModule['moduleType'],
    productIds: rawProductIds.map((p) => (typeof p === 'object' && p !== null ? p.toString() : String(p))),
    categoryIds: rawCategoryIds.map((c) => (typeof c === 'object' && c !== null ? c.toString() : String(c))),
    startsAt: (record.startsAt as Date) ?? null,
    endsAt: (record.endsAt as Date) ?? null,
    displayOrder: typeof record.displayOrder === 'number' ? record.displayOrder : 0,
    active: Boolean(record.active),
    updatedBy: record.updatedBy ? record.updatedBy.toString() : null,
    createdAt: (record.createdAt as Date) ?? new Date(),
    updatedAt: (record.updatedAt as Date) ?? new Date(),
  };
}

export class ContentService {
  constructor(
    private readonly repo: ContentRepository = contentRepository,
    private readonly productRepo: ProductRepository = productRepository,
    private readonly categoryRepo: CategoryRepository = categoryRepository,
  ) {}

  async getHomeContent(): Promise<SafePublicContentModule[]> {
    const activeModules = await this.repo.findActive(new Date());

    const result: SafePublicContentModule[] = [];

    for (const mod of activeModules) {
      // Resolve product references (only published products with active + MVP-enabled categories)
      let safeProducts: SafePublicProduct[] = [];
      if (mod.productIds && mod.productIds.length > 0) {
        const rawProducts = await this.productRepo.findPublishedByIds(mod.productIds);

        // Filter out any products whose category is not active/MVP-enabled
        const validProducts = [];
        for (const prod of rawProducts) {
          const cat = await this.categoryRepo.findById(prod.categoryId);
          if (cat && cat.isActive && cat.isMvpEnabled) {
            validProducts.push(toSafePublicProduct(prod));
          }
        }
        safeProducts = validProducts;
      }

      // Resolve category references (only active + MVP-enabled categories)
      let safeCategories: SafeCategory[] = [];
      if (mod.categoryIds && mod.categoryIds.length > 0) {
        const categories = [];
        for (const catId of mod.categoryIds) {
          const cat = await this.categoryRepo.findById(catId);
          if (cat && cat.isActive && cat.isMvpEnabled) {
            categories.push(toSafeCategory(cat));
          }
        }
        safeCategories = categories;
      }

      result.push({
        id: mod._id.toString(),
        key: mod.key,
        title: mod.title,
        body: mod.body ?? null,
        moduleType: mod.moduleType,
        products: safeProducts,
        categories: safeCategories,
        displayOrder: mod.displayOrder,
      });
    }

    return result;
  }

  async listAdminContent(): Promise<SafeAdminContentModule[]> {
    const modules = await this.repo.findAllAdmin();
    return modules.map(toSafeAdminContentModule);
  }

  async getContentById(id: string): Promise<SafeAdminContentModule> {
    const module = await this.repo.findById(id);
    if (!module) {
      throw new NotFoundError('Content module not found');
    }
    return toSafeAdminContentModule(module);
  }

  async createContent(
    input: CreateContentModuleInput,
    actorId?: string,
    actorRole?: string,
    requestId?: string,
  ): Promise<SafeAdminContentModule> {
    const existing = await this.repo.findByKey(input.key);
    if (existing) {
      throw new ConflictError(
        ErrorCodes.RESOURCE_CONFLICT,
        `Content module with key "${input.key}" already exists`,
      );
    }

    // Validate referenced products
    const productObjectIds: Types.ObjectId[] = [];
    if (input.productIds && input.productIds.length > 0) {
      for (const pId of input.productIds) {
        const p = await this.productRepo.findById(pId);
        if (!p) {
          throw new BadRequestError(`Referenced product ID "${pId}" not found`);
        }
        productObjectIds.push(new Types.ObjectId(pId));
      }
    }

    // Validate referenced categories
    const categoryObjectIds: Types.ObjectId[] = [];
    if (input.categoryIds && input.categoryIds.length > 0) {
      for (const cId of input.categoryIds) {
        const c = await this.categoryRepo.findById(cId);
        if (!c) {
          throw new BadRequestError(`Referenced category ID "${cId}" not found`);
        }
        categoryObjectIds.push(new Types.ObjectId(cId));
      }
    }

    const created = await this.repo.create({
      key: input.key.toLowerCase().trim(),
      title: input.title,
      body: input.body ?? null,
      moduleType: input.moduleType,
      productIds: productObjectIds,
      categoryIds: categoryObjectIds,
      startsAt: input.startsAt ? new Date(input.startsAt) : null,
      endsAt: input.endsAt ? new Date(input.endsAt) : null,
      displayOrder: input.displayOrder ?? 0,
      active: input.active ?? true,
      updatedBy: actorId ? new Types.ObjectId(actorId) : null,
    });

    await auditService.record({
      actorId,
      actorRole,
      action: 'content.create',
      entityType: 'content',
      entityId: created._id.toString(),
      newState: created.toObject(),
      requestId,
    });

    return toSafeAdminContentModule(created);
  }

  async updateContent(
    id: string,
    input: UpdateContentModuleInput,
    actorId?: string,
    actorRole?: string,
    requestId?: string,
  ): Promise<SafeAdminContentModule> {
    const module = await this.repo.findById(id);
    if (!module) {
      throw new NotFoundError('Content module not found');
    }

    if (input.key && input.key.toLowerCase().trim() !== module.key) {
      const existing = await this.repo.findByKey(input.key);
      if (existing && existing._id.toString() !== id) {
        throw new ConflictError(
          ErrorCodes.RESOURCE_CONFLICT,
          `Content module with key "${input.key}" already exists`,
        );
      }
    }

    const updateData: Record<string, unknown> = {
      updatedBy: actorId ? new Types.ObjectId(actorId) : null,
    };

    if (input.key !== undefined) updateData.key = input.key.toLowerCase().trim();
    if (input.title !== undefined) updateData.title = input.title;
    if (input.body !== undefined) updateData.body = input.body;
    if (input.moduleType !== undefined) updateData.moduleType = input.moduleType;

    if (input.productIds !== undefined) {
      const pIds: Types.ObjectId[] = [];
      for (const pId of input.productIds) {
        const p = await this.productRepo.findById(pId);
        if (!p) {
          throw new BadRequestError(`Referenced product ID "${pId}" not found`);
        }
        pIds.push(new Types.ObjectId(pId));
      }
      updateData.productIds = pIds;
    }

    if (input.categoryIds !== undefined) {
      const cIds: Types.ObjectId[] = [];
      for (const cId of input.categoryIds) {
        const c = await this.categoryRepo.findById(cId);
        if (!c) {
          throw new BadRequestError(`Referenced category ID "${cId}" not found`);
        }
        cIds.push(new Types.ObjectId(cId));
      }
      updateData.categoryIds = cIds;
    }

    if (input.startsAt !== undefined) {
      updateData.startsAt = input.startsAt ? new Date(input.startsAt) : null;
    }
    if (input.endsAt !== undefined) {
      updateData.endsAt = input.endsAt ? new Date(input.endsAt) : null;
    }
    if (input.displayOrder !== undefined) updateData.displayOrder = input.displayOrder;
    if (input.active !== undefined) updateData.active = input.active;

    const previousState = module.toObject();
    const updated = await this.repo.update(id, updateData as Partial<IContentModule>);
    if (!updated) {
      throw new NotFoundError('Content module not found');
    }

    await auditService.record({
      actorId,
      actorRole,
      action: 'content.update',
      entityType: 'content',
      entityId: id,
      previousState,
      newState: updated.toObject(),
      requestId,
    });

    return toSafeAdminContentModule(updated);
  }

  async deleteContent(
    id: string,
    actorId?: string,
    actorRole?: string,
    requestId?: string,
  ): Promise<void> {
    const module = await this.repo.findById(id);
    if (!module) {
      throw new NotFoundError('Content module not found');
    }

    await this.repo.delete(id);

    await auditService.record({
      actorId,
      actorRole,
      action: 'content.delete',
      entityType: 'content',
      entityId: id,
      previousState: module.toObject(),
      requestId,
    });
  }
}

export const contentService = new ContentService();
