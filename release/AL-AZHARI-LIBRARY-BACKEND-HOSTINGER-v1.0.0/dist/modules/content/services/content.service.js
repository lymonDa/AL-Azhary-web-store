"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.contentService = exports.ContentService = void 0;
exports.toSafeAdminContentModule = toSafeAdminContentModule;
const mongoose_1 = require("mongoose");
const content_repository_1 = require("../repositories/content.repository");
const product_repository_1 = require("../../products/repositories/product.repository");
const category_repository_1 = require("../../categories/repositories/category.repository");
const product_projection_1 = require("../../products/utils/product.projection");
const category_projection_1 = require("../../categories/utils/category.projection");
const errors_1 = require("../../../common/errors");
const audit_1 = require("../../audit");
function toSafeAdminContentModule(module) {
    const record = module;
    const rawId = record._id ?? record.id;
    const id = typeof rawId === 'object' && rawId !== null ? rawId.toString() : String(rawId);
    const rawProductIds = Array.isArray(record.productIds) ? record.productIds : [];
    const rawCategoryIds = Array.isArray(record.categoryIds) ? record.categoryIds : [];
    return {
        id,
        key: String(record.key ?? ''),
        title: record.title ?? { ar: '' },
        body: record.body ?? null,
        moduleType: record.moduleType,
        productIds: rawProductIds.map((p) => (typeof p === 'object' && p !== null ? p.toString() : String(p))),
        categoryIds: rawCategoryIds.map((c) => (typeof c === 'object' && c !== null ? c.toString() : String(c))),
        startsAt: record.startsAt ?? null,
        endsAt: record.endsAt ?? null,
        displayOrder: typeof record.displayOrder === 'number' ? record.displayOrder : 0,
        active: Boolean(record.active),
        updatedBy: record.updatedBy ? record.updatedBy.toString() : null,
        createdAt: record.createdAt ?? new Date(),
        updatedAt: record.updatedAt ?? new Date(),
    };
}
class ContentService {
    repo;
    productRepo;
    categoryRepo;
    constructor(repo = content_repository_1.contentRepository, productRepo = product_repository_1.productRepository, categoryRepo = category_repository_1.categoryRepository) {
        this.repo = repo;
        this.productRepo = productRepo;
        this.categoryRepo = categoryRepo;
    }
    async getHomeContent() {
        const activeModules = await this.repo.findActive(new Date());
        const result = [];
        for (const mod of activeModules) {
            // Resolve product references (only published products with active + MVP-enabled categories)
            let safeProducts = [];
            if (mod.productIds && mod.productIds.length > 0) {
                const rawProducts = await this.productRepo.findPublishedByIds(mod.productIds);
                // Filter out any products whose category is not active/MVP-enabled
                const validProducts = [];
                for (const prod of rawProducts) {
                    const cat = await this.categoryRepo.findById(prod.categoryId);
                    if (cat && cat.isActive && cat.isMvpEnabled) {
                        validProducts.push((0, product_projection_1.toSafePublicProduct)(prod));
                    }
                }
                safeProducts = validProducts;
            }
            // Resolve category references (only active + MVP-enabled categories)
            let safeCategories = [];
            if (mod.categoryIds && mod.categoryIds.length > 0) {
                const categories = [];
                for (const catId of mod.categoryIds) {
                    const cat = await this.categoryRepo.findById(catId);
                    if (cat && cat.isActive && cat.isMvpEnabled) {
                        categories.push((0, category_projection_1.toSafeCategory)(cat));
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
    async listAdminContent() {
        const modules = await this.repo.findAllAdmin();
        return modules.map(toSafeAdminContentModule);
    }
    async getContentById(id) {
        const module = await this.repo.findById(id);
        if (!module) {
            throw new errors_1.NotFoundError('Content module not found');
        }
        return toSafeAdminContentModule(module);
    }
    async createContent(input, actorId, actorRole, requestId) {
        const existing = await this.repo.findByKey(input.key);
        if (existing) {
            throw new errors_1.ConflictError(errors_1.ErrorCodes.RESOURCE_CONFLICT, `Content module with key "${input.key}" already exists`);
        }
        // Validate referenced products
        const productObjectIds = [];
        if (input.productIds && input.productIds.length > 0) {
            for (const pId of input.productIds) {
                const p = await this.productRepo.findById(pId);
                if (!p) {
                    throw new errors_1.BadRequestError(`Referenced product ID "${pId}" not found`);
                }
                productObjectIds.push(new mongoose_1.Types.ObjectId(pId));
            }
        }
        // Validate referenced categories
        const categoryObjectIds = [];
        if (input.categoryIds && input.categoryIds.length > 0) {
            for (const cId of input.categoryIds) {
                const c = await this.categoryRepo.findById(cId);
                if (!c) {
                    throw new errors_1.BadRequestError(`Referenced category ID "${cId}" not found`);
                }
                categoryObjectIds.push(new mongoose_1.Types.ObjectId(cId));
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
            updatedBy: actorId ? new mongoose_1.Types.ObjectId(actorId) : null,
        });
        await audit_1.auditService.record({
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
    async updateContent(id, input, actorId, actorRole, requestId) {
        const module = await this.repo.findById(id);
        if (!module) {
            throw new errors_1.NotFoundError('Content module not found');
        }
        if (input.key && input.key.toLowerCase().trim() !== module.key) {
            const existing = await this.repo.findByKey(input.key);
            if (existing && existing._id.toString() !== id) {
                throw new errors_1.ConflictError(errors_1.ErrorCodes.RESOURCE_CONFLICT, `Content module with key "${input.key}" already exists`);
            }
        }
        const updateData = {
            updatedBy: actorId ? new mongoose_1.Types.ObjectId(actorId) : null,
        };
        if (input.key !== undefined)
            updateData.key = input.key.toLowerCase().trim();
        if (input.title !== undefined)
            updateData.title = input.title;
        if (input.body !== undefined)
            updateData.body = input.body;
        if (input.moduleType !== undefined)
            updateData.moduleType = input.moduleType;
        if (input.productIds !== undefined) {
            const pIds = [];
            for (const pId of input.productIds) {
                const p = await this.productRepo.findById(pId);
                if (!p) {
                    throw new errors_1.BadRequestError(`Referenced product ID "${pId}" not found`);
                }
                pIds.push(new mongoose_1.Types.ObjectId(pId));
            }
            updateData.productIds = pIds;
        }
        if (input.categoryIds !== undefined) {
            const cIds = [];
            for (const cId of input.categoryIds) {
                const c = await this.categoryRepo.findById(cId);
                if (!c) {
                    throw new errors_1.BadRequestError(`Referenced category ID "${cId}" not found`);
                }
                cIds.push(new mongoose_1.Types.ObjectId(cId));
            }
            updateData.categoryIds = cIds;
        }
        if (input.startsAt !== undefined) {
            updateData.startsAt = input.startsAt ? new Date(input.startsAt) : null;
        }
        if (input.endsAt !== undefined) {
            updateData.endsAt = input.endsAt ? new Date(input.endsAt) : null;
        }
        if (input.displayOrder !== undefined)
            updateData.displayOrder = input.displayOrder;
        if (input.active !== undefined)
            updateData.active = input.active;
        const previousState = module.toObject();
        const updated = await this.repo.update(id, updateData);
        if (!updated) {
            throw new errors_1.NotFoundError('Content module not found');
        }
        await audit_1.auditService.record({
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
    async deleteContent(id, actorId, actorRole, requestId) {
        const module = await this.repo.findById(id);
        if (!module) {
            throw new errors_1.NotFoundError('Content module not found');
        }
        await this.repo.delete(id);
        await audit_1.auditService.record({
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
exports.ContentService = ContentService;
exports.contentService = new ContentService();
//# sourceMappingURL=content.service.js.map