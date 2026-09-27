import { Types } from 'mongoose';
import { categoryRepository, CategoryRepository } from '../repositories/category.repository';
import {
  CreateCategoryInput,
  UpdateCategoryInput,
  SafeCategory,
} from '../types/category.types';
import { toSafeCategory } from '../utils/category.projection';
import { ConflictError, NotFoundError, BadRequestError, ErrorCodes } from '../../../common/errors';
import { auditService } from '../../audit';

export class CategoryService {
  constructor(private readonly repo: CategoryRepository = categoryRepository) {}

  async listPublicCategories(): Promise<SafeCategory[]> {
    const categories = await this.repo.findAllPublic();
    return categories.map(toSafeCategory);
  }

  async listAdminCategories(): Promise<SafeCategory[]> {
    const categories = await this.repo.findAllAdmin();
    return categories.map(toSafeCategory);
  }

  async getCategoryById(id: string): Promise<SafeCategory> {
    const category = await this.repo.findById(id);
    if (!category) {
      throw new NotFoundError('Category not found');
    }
    return toSafeCategory(category);
  }

  async createCategory(
    input: CreateCategoryInput,
    actorId?: string,
    actorRole?: string,
    requestId?: string,
  ): Promise<SafeCategory> {
    const existing = await this.repo.findBySlug(input.slug);
    if (existing) {
      throw new ConflictError(
        ErrorCodes.RESOURCE_CONFLICT,
        `Category with slug "${input.slug}" already exists`,
      );
    }

    if (input.parentId) {
      const parent = await this.repo.findById(input.parentId.toString());
      if (!parent) {
        throw new BadRequestError('Parent category not found');
      }
    }

    const created = await this.repo.create({
      slug: input.slug.toLowerCase().trim(),
      name: input.name,
      parentId: input.parentId ? new Types.ObjectId(input.parentId.toString()) : null,
      kind: 'product',
      displayOrder: input.displayOrder ?? 0,
      isActive: input.isActive ?? true,
      isMvpEnabled: input.isMvpEnabled ?? true,
      isBooksCore: input.isBooksCore ?? false,
    });

    await auditService.record({
      actorId,
      actorRole,
      action: 'category.create',
      entityType: 'category',
      entityId: created._id.toString(),
      newState: created.toObject(),
      requestId,
    });

    return toSafeCategory(created);
  }

  async updateCategory(
    id: string,
    input: UpdateCategoryInput,
    actorId?: string,
    actorRole?: string,
    requestId?: string,
  ): Promise<SafeCategory> {
    const category = await this.repo.findById(id);
    if (!category) {
      throw new NotFoundError('Category not found');
    }

    if (input.slug && input.slug.toLowerCase().trim() !== category.slug) {
      const existing = await this.repo.findBySlug(input.slug);
      if (existing && existing._id.toString() !== id) {
        throw new ConflictError(
          ErrorCodes.RESOURCE_CONFLICT,
          `Category with slug "${input.slug}" already exists`,
        );
      }
    }

    if (input.parentId) {
      if (input.parentId.toString() === id) {
        throw new BadRequestError('Category cannot be its own parent');
      }
      const parent = await this.repo.findById(input.parentId.toString());
      if (!parent) {
        throw new BadRequestError('Parent category not found');
      }
    }

    const previousState = category.toObject();
    const updateData: Record<string, unknown> = {};

    if (input.slug !== undefined) updateData.slug = input.slug.toLowerCase().trim();
    if (input.name !== undefined) updateData.name = input.name;
    if (input.parentId !== undefined) {
      updateData.parentId = input.parentId ? new Types.ObjectId(input.parentId.toString()) : null;
    }
    if (input.displayOrder !== undefined) updateData.displayOrder = input.displayOrder;
    if (input.isActive !== undefined) updateData.isActive = input.isActive;
    if (input.isMvpEnabled !== undefined) updateData.isMvpEnabled = input.isMvpEnabled;
    if (input.isBooksCore !== undefined) updateData.isBooksCore = input.isBooksCore;

    const updated = await this.repo.update(id, updateData);
    if (!updated) {
      throw new NotFoundError('Category not found');
    }

    await auditService.record({
      actorId,
      actorRole,
      action: 'category.update',
      entityType: 'category',
      entityId: id,
      previousState,
      newState: updated.toObject(),
      requestId,
    });

    return toSafeCategory(updated);
  }

  async deleteCategory(
    id: string,
    actorId?: string,
    actorRole?: string,
    requestId?: string,
  ): Promise<SafeCategory> {
    const category = await this.repo.findById(id);
    if (!category) {
      throw new NotFoundError('Category not found');
    }

    // Historical dependency protection: check if products reference this category
    const productCount = await this.repo.countProducts(id);
    if (productCount > 0) {
      throw new ConflictError(
        ErrorCodes.RESOURCE_CONFLICT,
        `Cannot delete category with ${productCount} associated product(s). Historical product dependencies must be respected.`,
      );
    }

    // Check if child categories reference this category
    const childCount = await this.repo.countChildren(id);
    if (childCount > 0) {
      throw new ConflictError(
        ErrorCodes.RESOURCE_CONFLICT,
        `Cannot delete category with ${childCount} child subcategories. Reassign child categories first.`,
      );
    }

    // Non-destructive deactivation
    const previousState = category.toObject();
    const deactivated = await this.repo.update(id, { isActive: false });
    if (!deactivated) {
      throw new NotFoundError('Category not found');
    }

    await auditService.record({
      actorId,
      actorRole,
      action: 'category.deactivate',
      entityType: 'category',
      entityId: id,
      previousState,
      newState: deactivated.toObject(),
      requestId,
    });

    return toSafeCategory(deactivated);
  }
}

export const categoryService = new CategoryService();
