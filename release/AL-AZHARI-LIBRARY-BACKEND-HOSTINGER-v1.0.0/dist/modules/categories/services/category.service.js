"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.categoryService = exports.CategoryService = void 0;
const mongoose_1 = require("mongoose");
const category_repository_1 = require("../repositories/category.repository");
const category_projection_1 = require("../utils/category.projection");
const errors_1 = require("../../../common/errors");
const audit_1 = require("../../audit");
class CategoryService {
    repo;
    constructor(repo = category_repository_1.categoryRepository) {
        this.repo = repo;
    }
    async listPublicCategories() {
        const categories = await this.repo.findAllPublic();
        return categories.map(category_projection_1.toSafeCategory);
    }
    async listAdminCategories() {
        const categories = await this.repo.findAllAdmin();
        return categories.map(category_projection_1.toSafeCategory);
    }
    async getCategoryById(id) {
        const category = await this.repo.findById(id);
        if (!category) {
            throw new errors_1.NotFoundError('Category not found');
        }
        return (0, category_projection_1.toSafeCategory)(category);
    }
    async createCategory(input, actorId, actorRole, requestId) {
        const existing = await this.repo.findBySlug(input.slug);
        if (existing) {
            throw new errors_1.ConflictError(errors_1.ErrorCodes.RESOURCE_CONFLICT, `Category with slug "${input.slug}" already exists`);
        }
        if (input.parentId) {
            const parent = await this.repo.findById(input.parentId.toString());
            if (!parent) {
                throw new errors_1.BadRequestError('Parent category not found');
            }
        }
        const created = await this.repo.create({
            slug: input.slug.toLowerCase().trim(),
            name: input.name,
            parentId: input.parentId ? new mongoose_1.Types.ObjectId(input.parentId.toString()) : null,
            kind: 'product',
            displayOrder: input.displayOrder ?? 0,
            isActive: input.isActive ?? true,
            isMvpEnabled: input.isMvpEnabled ?? true,
            isBooksCore: input.isBooksCore ?? false,
        });
        await audit_1.auditService.record({
            actorId,
            actorRole,
            action: 'category.create',
            entityType: 'category',
            entityId: created._id.toString(),
            newState: created.toObject(),
            requestId,
        });
        return (0, category_projection_1.toSafeCategory)(created);
    }
    async updateCategory(id, input, actorId, actorRole, requestId) {
        const category = await this.repo.findById(id);
        if (!category) {
            throw new errors_1.NotFoundError('Category not found');
        }
        if (input.slug && input.slug.toLowerCase().trim() !== category.slug) {
            const existing = await this.repo.findBySlug(input.slug);
            if (existing && existing._id.toString() !== id) {
                throw new errors_1.ConflictError(errors_1.ErrorCodes.RESOURCE_CONFLICT, `Category with slug "${input.slug}" already exists`);
            }
        }
        if (input.parentId) {
            if (input.parentId.toString() === id) {
                throw new errors_1.BadRequestError('Category cannot be its own parent');
            }
            const parent = await this.repo.findById(input.parentId.toString());
            if (!parent) {
                throw new errors_1.BadRequestError('Parent category not found');
            }
        }
        const previousState = category.toObject();
        const updateData = {};
        if (input.slug !== undefined)
            updateData.slug = input.slug.toLowerCase().trim();
        if (input.name !== undefined)
            updateData.name = input.name;
        if (input.parentId !== undefined) {
            updateData.parentId = input.parentId ? new mongoose_1.Types.ObjectId(input.parentId.toString()) : null;
        }
        if (input.displayOrder !== undefined)
            updateData.displayOrder = input.displayOrder;
        if (input.isActive !== undefined)
            updateData.isActive = input.isActive;
        if (input.isMvpEnabled !== undefined)
            updateData.isMvpEnabled = input.isMvpEnabled;
        if (input.isBooksCore !== undefined)
            updateData.isBooksCore = input.isBooksCore;
        const updated = await this.repo.update(id, updateData);
        if (!updated) {
            throw new errors_1.NotFoundError('Category not found');
        }
        await audit_1.auditService.record({
            actorId,
            actorRole,
            action: 'category.update',
            entityType: 'category',
            entityId: id,
            previousState,
            newState: updated.toObject(),
            requestId,
        });
        return (0, category_projection_1.toSafeCategory)(updated);
    }
    async deleteCategory(id, actorId, actorRole, requestId) {
        const category = await this.repo.findById(id);
        if (!category) {
            throw new errors_1.NotFoundError('Category not found');
        }
        // Historical dependency protection: check if products reference this category
        const productCount = await this.repo.countProducts(id);
        if (productCount > 0) {
            throw new errors_1.ConflictError(errors_1.ErrorCodes.RESOURCE_CONFLICT, `Cannot delete category with ${productCount} associated product(s). Historical product dependencies must be respected.`);
        }
        // Check if child categories reference this category
        const childCount = await this.repo.countChildren(id);
        if (childCount > 0) {
            throw new errors_1.ConflictError(errors_1.ErrorCodes.RESOURCE_CONFLICT, `Cannot delete category with ${childCount} child subcategories. Reassign child categories first.`);
        }
        // Non-destructive deactivation
        const previousState = category.toObject();
        const deactivated = await this.repo.update(id, { isActive: false });
        if (!deactivated) {
            throw new errors_1.NotFoundError('Category not found');
        }
        await audit_1.auditService.record({
            actorId,
            actorRole,
            action: 'category.deactivate',
            entityType: 'category',
            entityId: id,
            previousState,
            newState: deactivated.toObject(),
            requestId,
        });
        return (0, category_projection_1.toSafeCategory)(deactivated);
    }
}
exports.CategoryService = CategoryService;
exports.categoryService = new CategoryService();
//# sourceMappingURL=category.service.js.map