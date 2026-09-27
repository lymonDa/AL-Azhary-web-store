import { Types } from 'mongoose';
import {
  productRepository,
  ProductRepository,
  PublicProductFilters,
  PaginatedResult,
} from '../repositories/product.repository';
import { categoryRepository, CategoryRepository } from '../../categories/repositories/category.repository';
import {
  CreateProductInput,
  UpdateProductInput,
  SafePublicProduct,
  SafeAdminProduct,
  ProductAvailability,
  IProduct,
} from '../types/product.types';
import { toSafePublicProduct, toSafeAdminProduct } from '../utils/product.projection';
import { buildSearchText } from '../utils/search-normalizer';
import {
  ConflictError,
  NotFoundError,
  BadRequestError,
  ErrorCodes,
} from '../../../common/errors';
import { auditService } from '../../audit';

export class ProductService {
  constructor(
    private readonly repo: ProductRepository = productRepository,
    private readonly categoryRepo: CategoryRepository = categoryRepository,
  ) {}

  /**
   * Validates publication requirements.
   * Note: description may be null and does not block publication.
   */
  private async validatePublicationRules(
    categoryId: string | Types.ObjectId,
    hasVariants: boolean,
    priceMinor: number,
    variants: CreateProductInput['variants'],
  ): Promise<void> {
    const category = await this.categoryRepo.findById(categoryId);
    if (!category) {
      throw new BadRequestError('Associated category does not exist');
    }

    if (!category.isActive || !category.isMvpEnabled) {
      throw new BadRequestError(
        'Cannot publish product under an inactive or MVP-disabled category',
      );
    }

    if (hasVariants) {
      if (!variants || variants.length === 0) {
        throw new BadRequestError('Cannot publish a product with hasVariants=true without variants');
      }
      const hasUsablePrice = variants.some((v) => typeof v.priceMinor === 'number' && v.priceMinor >= 0);
      if (!hasUsablePrice) {
        throw new BadRequestError('Cannot publish product without at least one usable variant price');
      }
    } else {
      if (typeof priceMinor !== 'number' || priceMinor < 0) {
        throw new BadRequestError('Cannot publish product without a valid non-negative priceMinor');
      }
    }
  }

  async listPublicProducts(
    query: {
      page?: number;
      limit?: number;
      category?: string;
      availability?: ProductAvailability;
    },
  ): Promise<{ items: SafePublicProduct[]; total: number; page: number; limit: number; totalPages: number }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const filters: PublicProductFilters = {};
    if (query.availability) {
      filters.availability = query.availability;
    }

    if (query.category) {
      // Allow category filter by ID or by Slug
      let cat = null;
      if (/^[a-fA-F0-9]{24}$/.test(query.category)) {
        cat = await this.categoryRepo.findById(query.category);
      } else {
        cat = await this.categoryRepo.findBySlug(query.category);
      }

      if (!cat || !cat.isActive || !cat.isMvpEnabled) {
        // Return empty result if category doesn't exist or is not public
        return {
          items: [],
          total: 0,
          page,
          limit,
          totalPages: 1,
        };
      }

      filters.categoryId = cat._id;
    }

    const result = await this.repo.findPublic(filters, page, limit);

    return {
      items: result.items.map(toSafePublicProduct),
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  }

  async searchPublicProducts(
    rawQuery: string,
    query: {
      page?: number;
      limit?: number;
      category?: string;
      availability?: ProductAvailability;
    },
  ): Promise<{ items: SafePublicProduct[]; total: number; page: number; limit: number; totalPages: number }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const filters: PublicProductFilters = {};
    if (query.availability) {
      filters.availability = query.availability;
    }

    if (query.category) {
      let cat = null;
      if (/^[a-fA-F0-9]{24}$/.test(query.category)) {
        cat = await this.categoryRepo.findById(query.category);
      } else {
        cat = await this.categoryRepo.findBySlug(query.category);
      }

      if (!cat || !cat.isActive || !cat.isMvpEnabled) {
        return {
          items: [],
          total: 0,
          page,
          limit,
          totalPages: 1,
        };
      }

      filters.categoryId = cat._id;
    }

    const result = await this.repo.findSearch(rawQuery, filters, page, limit);

    return {
      items: result.items.map(toSafePublicProduct),
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  }

  async getPublicProductBySlug(slug: string): Promise<SafePublicProduct> {
    const product = await this.repo.findPublicBySlug(slug);
    if (!product) {
      throw new NotFoundError('Product not found');
    }

    // Verify category is active and MVP-enabled
    const category = await this.categoryRepo.findById(product.categoryId);
    if (!category || !category.isActive || !category.isMvpEnabled) {
      throw new NotFoundError('Product not found');
    }

    return toSafePublicProduct(product);
  }

  async listAdminProducts(
    page: number = 1,
    limit: number = 20,
  ): Promise<PaginatedResult<SafeAdminProduct>> {
    const result = await this.repo.findAdmin(page, limit);
    return {
      items: result.items.map(toSafeAdminProduct),
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  }

  async getAdminProductById(id: string): Promise<SafeAdminProduct> {
    const product = await this.repo.findById(id);
    if (!product) {
      throw new NotFoundError('Product not found');
    }
    return toSafeAdminProduct(product);
  }

  async createProduct(
    input: CreateProductInput,
    actorId?: string,
    actorRole?: string,
    requestId?: string,
  ): Promise<SafeAdminProduct> {
    const existing = await this.repo.findBySlug(input.slug);
    if (existing) {
      throw new ConflictError(
        ErrorCodes.RESOURCE_CONFLICT,
        `Product with slug "${input.slug}" already exists`,
      );
    }

    const category = await this.categoryRepo.findById(input.categoryId);
    if (!category) {
      throw new BadRequestError('Category not found');
    }

    const hasVariants = Boolean(input.hasVariants);
    const priceMinor = input.priceMinor ?? 0;

    if (input.isPublished) {
      await this.validatePublicationRules(
        input.categoryId,
        hasVariants,
        priceMinor,
        input.variants,
      );
    }

    const searchText = buildSearchText(input.name, input.metadata, input.description);

    const created = await this.repo.create({
      slug: input.slug.toLowerCase().trim(),
      name: input.name,
      description: input.description ?? null,
      categoryId: new Types.ObjectId(input.categoryId),
      images: (input.images ?? []) as unknown as IProduct['images'],
      metadata: input.metadata ?? {},
      hasVariants,
      variants: (input.variants ?? []) as unknown as IProduct['variants'],
      availability: input.availability ?? 'in_stock',
      priceMinor,
      currency: 'EGP',
      preOrderEligible: input.preOrderEligible ?? false,
      isPublished: input.isPublished ?? false,
      returnPolicyFlags: {
        eligibleForReturn: input.returnPolicyFlags?.eligibleForReturn ?? true,
        windowDays: input.returnPolicyFlags?.windowDays ?? 14,
      },
      displayOrder: input.displayOrder ?? 0,
      stockTotal: input.stockTotal ?? 0,
      stockReserved: input.stockReserved ?? 0,
      searchText,
    });

    await auditService.record({
      actorId,
      actorRole,
      action: 'product.create',
      entityType: 'product',
      entityId: created._id.toString(),
      newState: created.toObject(),
      requestId,
    });

    return toSafeAdminProduct(created);
  }

  async updateProduct(
    id: string,
    input: UpdateProductInput,
    actorId?: string,
    actorRole?: string,
    requestId?: string,
  ): Promise<SafeAdminProduct> {
    const product = await this.repo.findById(id);
    if (!product) {
      throw new NotFoundError('Product not found');
    }

    if (input.slug && input.slug.toLowerCase().trim() !== product.slug) {
      const existing = await this.repo.findBySlug(input.slug);
      if (existing && existing._id.toString() !== id) {
        throw new ConflictError(
          ErrorCodes.RESOURCE_CONFLICT,
          `Product with slug "${input.slug}" already exists`,
        );
      }
    }

    const targetCategoryId = input.categoryId ?? product.categoryId.toString();
    if (input.categoryId && input.categoryId !== product.categoryId.toString()) {
      const category = await this.categoryRepo.findById(input.categoryId);
      if (!category) {
        throw new BadRequestError('Category not found');
      }
    }

    const targetHasVariants =
      input.hasVariants !== undefined ? input.hasVariants : product.hasVariants;
    const targetPriceMinor =
      input.priceMinor !== undefined ? input.priceMinor : product.priceMinor;
    const targetVariants =
      input.variants !== undefined
        ? input.variants
        : (product.variants as unknown as CreateProductInput['variants']);
    const targetIsPublished =
      input.isPublished !== undefined ? input.isPublished : product.isPublished;

    if (targetIsPublished) {
      await this.validatePublicationRules(
        targetCategoryId,
        targetHasVariants,
        targetPriceMinor,
        targetVariants,
      );
    }

    const previousState = product.toObject();
    const updateData: Record<string, unknown> = {};

    if (input.slug !== undefined) updateData.slug = input.slug.toLowerCase().trim();
    if (input.name !== undefined) updateData.name = input.name;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.categoryId !== undefined) updateData.categoryId = new Types.ObjectId(input.categoryId);
    if (input.images !== undefined) updateData.images = input.images;
    if (input.metadata !== undefined) updateData.metadata = input.metadata;
    if (input.hasVariants !== undefined) updateData.hasVariants = input.hasVariants;
    if (input.variants !== undefined) updateData.variants = input.variants;
    if (input.availability !== undefined) updateData.availability = input.availability;
    if (input.priceMinor !== undefined) updateData.priceMinor = input.priceMinor;
    if (input.currency !== undefined) updateData.currency = input.currency;
    if (input.preOrderEligible !== undefined) updateData.preOrderEligible = input.preOrderEligible;
    if (input.isPublished !== undefined) updateData.isPublished = input.isPublished;
    if (input.returnPolicyFlags !== undefined) {
      updateData.returnPolicyFlags = {
        eligibleForReturn: input.returnPolicyFlags.eligibleForReturn ?? product.returnPolicyFlags.eligibleForReturn,
        windowDays: input.returnPolicyFlags.windowDays ?? product.returnPolicyFlags.windowDays,
      };
    }
    if (input.displayOrder !== undefined) updateData.displayOrder = input.displayOrder;
    if (input.stockTotal !== undefined) updateData.stockTotal = input.stockTotal;
    if (input.stockReserved !== undefined) updateData.stockReserved = input.stockReserved;

    // Recompute searchText if name, metadata, or description was touched
    const targetName = input.name ?? product.name;
    const targetMeta = input.metadata ?? product.metadata;
    const targetDesc = input.description !== undefined ? input.description : product.description;
    updateData.searchText = buildSearchText(targetName, targetMeta, targetDesc);

    const updated = await this.repo.update(id, updateData as Partial<IProduct>);
    if (!updated) {
      throw new NotFoundError('Product not found');
    }

    // Audit critical catalog mutations: price, availability, publication
    const criticalMutations: string[] = [];
    if (input.priceMinor !== undefined && input.priceMinor !== product.priceMinor) {
      criticalMutations.push('price');
    }
    if (input.availability !== undefined && input.availability !== product.availability) {
      criticalMutations.push('availability');
    }
    if (input.isPublished !== undefined && input.isPublished !== product.isPublished) {
      criticalMutations.push('publication');
    }

    const action = criticalMutations.length > 0
      ? `product.update.${criticalMutations.join('.')}`
      : 'product.update';

    await auditService.record({
      actorId,
      actorRole,
      action,
      entityType: 'product',
      entityId: id,
      previousState,
      newState: updated.toObject(),
      metadata: criticalMutations.length > 0 ? { mutatedFields: criticalMutations } : null,
      requestId,
    });

    return toSafeAdminProduct(updated);
  }
}

export const productService = new ProductService();
