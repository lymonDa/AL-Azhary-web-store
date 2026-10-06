"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cartService = exports.CartService = void 0;
exports.formatCartResponse = formatCartResponse;
const mongoose_1 = require("mongoose");
const cart_repository_1 = require("../repositories/cart.repository");
const cart_model_1 = require("../models/cart.model");
const product_model_1 = require("../../products/models/product.model");
const category_model_1 = require("../../categories/models/category.model");
const errors_1 = require("../../../common/errors");
const errorCodes_1 = require("../../../common/errors/errorCodes");
const GUEST_CART_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
function formatCartResponse(cart, fallbackOwnerType = 'guest') {
    if (!cart) {
        return {
            id: null,
            ownerType: fallbackOwnerType,
            items: [],
            itemsCount: 0,
            totalQuantity: 0,
            subtotalMinor: 0,
            currency: 'EGP',
            version: 0,
            expiresAt: null,
            createdAt: null,
            updatedAt: null,
        };
    }
    const items = cart.items.map((item) => ({
        id: item._id.toString(),
        productId: item.productId.toString(),
        variantId: item.variantId ?? null,
        quantity: item.quantity,
        unitPriceMinor: item.unitPriceMinor,
        productNameSnapshot: {
            ar: item.productNameSnapshot.ar,
            en: item.productNameSnapshot.en ?? null,
        },
        imageSnapshot: item.imageSnapshot ?? null,
        addedAt: item.addedAt ? item.addedAt.toISOString() : new Date().toISOString(),
    }));
    const itemsCount = items.length;
    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotalMinor = items.reduce((sum, item) => sum + item.quantity * item.unitPriceMinor, 0);
    const createdAt = cart.createdAt;
    const updatedAt = cart.updatedAt;
    return {
        id: cart._id.toString(),
        ownerType: cart.ownerType,
        items,
        itemsCount,
        totalQuantity,
        subtotalMinor,
        currency: cart.currency,
        version: cart.version,
        expiresAt: cart.expiresAt ? cart.expiresAt.toISOString() : null,
        createdAt: createdAt ? createdAt.toISOString() : null,
        updatedAt: updatedAt ? updatedAt.toISOString() : null,
    };
}
class CartService {
    cartRepo;
    constructor(cartRepo = cart_repository_1.cartRepository) {
        this.cartRepo = cartRepo;
    }
    /**
     * Retrieves active cart for owner context.
     * If cart does not exist or expired, returns a clean empty representation without persisting.
     */
    async getCart(owner) {
        const cart = await this.cartRepo.findActiveByOwner(owner);
        return formatCartResponse(cart, owner.ownerType);
    }
    /**
     * Adds an item to the cart, or merges quantities if the same item exists.
     * Strictly validates catalog existence, publication, category active/MVP, and variant validity.
     */
    async addItem(owner, dto) {
        if (!mongoose_1.Types.ObjectId.isValid(dto.productId)) {
            throw new errors_1.ValidationError('Invalid product ID format', undefined, errorCodes_1.ErrorCodes.VALIDATION_ERROR);
        }
        // 1. Load product from catalog
        const product = await product_model_1.ProductModel.findById(dto.productId);
        if (!product) {
            throw new errors_1.NotFoundError('Product not found in catalog', errorCodes_1.ErrorCodes.PRODUCT_NOT_FOUND);
        }
        // 2. Product must be published
        if (!product.isPublished) {
            throw new errors_1.BusinessRuleViolationError(errorCodes_1.ErrorCodes.PRODUCT_NOT_PURCHASABLE, 'Product is not available for purchase');
        }
        // 3. Category must exist, be active, and MVP-enabled
        const category = await category_model_1.CategoryModel.findById(product.categoryId);
        if (!category || !category.isActive || !category.isMvpEnabled) {
            throw new errors_1.BusinessRuleViolationError(errorCodes_1.ErrorCodes.PRODUCT_NOT_PURCHASABLE, 'Product category is inactive or unavailable');
        }
        // 4. Reject services at the cart boundary
        if (category.kind !== 'product') {
            throw new errors_1.BusinessRuleViolationError(errorCodes_1.ErrorCodes.PRODUCT_NOT_PURCHASABLE, 'Services cannot be added to product cart');
        }
        // 5. Product availability check
        if (product.availability === 'out_of_stock') {
            throw new errors_1.BusinessRuleViolationError(errorCodes_1.ErrorCodes.PRODUCT_NOT_PURCHASABLE, 'Product is currently out of stock');
        }
        // 6. Variant resolution & eligibility
        let unitPriceMinor;
        let imageSnapshot = null;
        let resolvedVariantId = null;
        if (product.hasVariants) {
            if (!dto.variantId || dto.variantId.trim() === '') {
                throw new errors_1.BusinessRuleViolationError(errorCodes_1.ErrorCodes.VARIANT_REQUIRED, 'Variant selection is required for this product');
            }
            resolvedVariantId = dto.variantId.trim();
            const variant = product.variants.find((v) => v.variantId === resolvedVariantId);
            if (!variant) {
                throw new errors_1.NotFoundError('Selected variant not found', errorCodes_1.ErrorCodes.VARIANT_NOT_FOUND);
            }
            if (variant.availability === 'out_of_stock') {
                throw new errors_1.BusinessRuleViolationError(errorCodes_1.ErrorCodes.VARIANT_NOT_PURCHASABLE, 'Selected variant is currently out of stock');
            }
            unitPriceMinor = variant.priceMinor;
            imageSnapshot = variant.images?.[0]?.publicId || product.images?.[0]?.publicId || null;
        }
        else {
            if (dto.variantId) {
                throw new errors_1.ValidationError('This product does not have variants; variantId must not be specified', undefined, errorCodes_1.ErrorCodes.VALIDATION_ERROR);
            }
            unitPriceMinor = product.priceMinor;
            imageSnapshot = product.images?.[0]?.publicId || null;
        }
        const quantity = dto.quantity && dto.quantity >= 1 ? Math.floor(dto.quantity) : 1;
        const productNameSnapshot = {
            ar: product.name.ar,
            en: product.name.en || null,
        };
        // 7. Find or create cart for owner
        let cart = await this.cartRepo.findActiveByOwner(owner);
        if (cart && dto.expectedVersion !== undefined) {
            if (cart.version !== dto.expectedVersion) {
                throw new errors_1.ConflictError(errorCodes_1.ErrorCodes.CART_VERSION_CONFLICT, 'Cart version conflict: the cart has been modified', { expectedVersion: dto.expectedVersion, currentVersion: cart.version });
            }
        }
        if (!cart) {
            const expiresAt = owner.ownerType === 'guest' ? new Date(Date.now() + GUEST_CART_TTL_MS) : null;
            cart = await this.cartRepo.create({
                ownerType: owner.ownerType,
                userId: owner.ownerType === 'user' ? new mongoose_1.Types.ObjectId(owner.userId) : null,
                sessionId: owner.ownerType === 'guest' ? owner.sessionId : null,
                items: [],
                currency: 'EGP',
                expiresAt,
                version: 1,
            });
        }
        // 8. Add or combine item
        const existingIndex = cart.items.findIndex((item) => item.productId.toString() === product._id.toString() &&
            (item.variantId || null) === (resolvedVariantId || null));
        if (existingIndex !== -1) {
            cart.items[existingIndex].quantity += quantity;
            cart.items[existingIndex].unitPriceMinor = unitPriceMinor;
            cart.items[existingIndex].productNameSnapshot = productNameSnapshot;
            cart.items[existingIndex].imageSnapshot = imageSnapshot;
        }
        else {
            cart.items.push({
                _id: new mongoose_1.Types.ObjectId(),
                productId: product._id,
                variantId: resolvedVariantId,
                quantity,
                unitPriceMinor,
                productNameSnapshot,
                imageSnapshot,
                addedAt: new Date(),
            });
        }
        cart.version += 1;
        if (owner.ownerType === 'guest') {
            cart.expiresAt = new Date(Date.now() + GUEST_CART_TTL_MS);
        }
        await cart.save();
        return formatCartResponse(cart, owner.ownerType);
    }
    /**
     * Updates quantity of a specific item in the cart.
     * Optimistically checks expectedVersion and atomically increments version.
     */
    async updateItem(owner, itemId, dto) {
        const cart = await this.cartRepo.findActiveByOwner(owner);
        if (!cart) {
            throw new errors_1.NotFoundError('Cart not found', errorCodes_1.ErrorCodes.CART_NOT_FOUND);
        }
        if (cart.version !== dto.expectedVersion) {
            throw new errors_1.ConflictError(errorCodes_1.ErrorCodes.CART_VERSION_CONFLICT, 'Cart version conflict: the cart has been modified', { expectedVersion: dto.expectedVersion, currentVersion: cart.version });
        }
        const item = cart.items.find((i) => i._id.toString() === itemId ||
            (mongoose_1.Types.ObjectId.isValid(itemId) && i.productId.toString() === itemId));
        if (!item) {
            throw new errors_1.NotFoundError('Cart item not found', errorCodes_1.ErrorCodes.CART_ITEM_NOT_FOUND);
        }
        const quantity = Math.floor(dto.quantity);
        if (quantity < 1) {
            throw new errors_1.ValidationError('Item quantity must be an integer >= 1', undefined, errorCodes_1.ErrorCodes.INVALID_QUANTITY);
        }
        // Re-verify against current catalog
        const product = await product_model_1.ProductModel.findById(item.productId);
        if (!product || !product.isPublished) {
            throw new errors_1.BusinessRuleViolationError(errorCodes_1.ErrorCodes.PRODUCT_NOT_PURCHASABLE, 'Product is no longer available for purchase');
        }
        const category = await category_model_1.CategoryModel.findById(product.categoryId);
        if (!category || !category.isActive || !category.isMvpEnabled || category.kind !== 'product') {
            throw new errors_1.BusinessRuleViolationError(errorCodes_1.ErrorCodes.PRODUCT_NOT_PURCHASABLE, 'Product category is inactive or unavailable');
        }
        if (item.variantId) {
            const variant = product.variants.find((v) => v.variantId === item.variantId);
            if (!variant) {
                throw new errors_1.NotFoundError('Selected variant not found', errorCodes_1.ErrorCodes.VARIANT_NOT_FOUND);
            }
            if (variant.availability === 'out_of_stock') {
                throw new errors_1.BusinessRuleViolationError(errorCodes_1.ErrorCodes.VARIANT_NOT_PURCHASABLE, 'Selected variant is currently out of stock');
            }
            item.unitPriceMinor = variant.priceMinor;
            item.imageSnapshot = variant.images?.[0]?.publicId || product.images?.[0]?.publicId || null;
        }
        else {
            if (product.availability === 'out_of_stock') {
                throw new errors_1.BusinessRuleViolationError(errorCodes_1.ErrorCodes.PRODUCT_NOT_PURCHASABLE, 'Product is currently out of stock');
            }
            item.unitPriceMinor = product.priceMinor;
            item.imageSnapshot = product.images?.[0]?.publicId || null;
        }
        item.productNameSnapshot = {
            ar: product.name.ar,
            en: product.name.en || null,
        };
        item.quantity = quantity;
        // Atomic update with optimistic version check
        const expiresAt = owner.ownerType === 'guest' ? new Date(Date.now() + GUEST_CART_TTL_MS) : null;
        const ownerFilter = owner.ownerType === 'user'
            ? { userId: new mongoose_1.Types.ObjectId(owner.userId), ownerType: 'user' }
            : { sessionId: owner.sessionId, ownerType: 'guest' };
        const updated = await this.cartRepo.updateWithVersion(cart._id, dto.expectedVersion, {
            $set: {
                items: cart.items,
                expiresAt,
            },
            $inc: { version: 1 },
        }, ownerFilter);
        if (!updated) {
            const fresh = await this.cartRepo.findById(cart._id);
            throw new errors_1.ConflictError(errorCodes_1.ErrorCodes.CART_VERSION_CONFLICT, 'Cart version conflict: the cart was modified by another operation', { expectedVersion: dto.expectedVersion, currentVersion: fresh?.version });
        }
        return formatCartResponse(updated, owner.ownerType);
    }
    /**
     * Removes an item from the cart idempotently with optimistic version check.
     */
    async removeItem(owner, itemId, dto) {
        const cart = await this.cartRepo.findActiveByOwner(owner);
        if (!cart) {
            throw new errors_1.NotFoundError('Cart not found', errorCodes_1.ErrorCodes.CART_NOT_FOUND);
        }
        if (dto?.expectedVersion !== undefined && cart.version !== dto.expectedVersion) {
            throw new errors_1.ConflictError(errorCodes_1.ErrorCodes.CART_VERSION_CONFLICT, 'Cart version conflict: the cart has been modified', { expectedVersion: dto.expectedVersion, currentVersion: cart.version });
        }
        const itemIndex = cart.items.findIndex((i) => i._id.toString() === itemId ||
            (mongoose_1.Types.ObjectId.isValid(itemId) && i.productId.toString() === itemId));
        // Idempotent: if already removed, succeed silently without version bump
        if (itemIndex === -1) {
            return;
        }
        cart.items.splice(itemIndex, 1);
        const expiresAt = owner.ownerType === 'guest' ? new Date(Date.now() + GUEST_CART_TTL_MS) : null;
        const ownerFilter = owner.ownerType === 'user'
            ? { userId: new mongoose_1.Types.ObjectId(owner.userId), ownerType: 'user' }
            : { sessionId: owner.sessionId, ownerType: 'guest' };
        const expectedVersion = dto?.expectedVersion ?? cart.version;
        const updated = await this.cartRepo.updateWithVersion(cart._id, expectedVersion, {
            $set: {
                items: cart.items,
                expiresAt,
            },
            $inc: { version: 1 },
        }, ownerFilter);
        if (!updated) {
            const fresh = await this.cartRepo.findById(cart._id);
            throw new errors_1.ConflictError(errorCodes_1.ErrorCodes.CART_VERSION_CONFLICT, 'Cart version conflict: the cart was modified by another operation', { expectedVersion, currentVersion: fresh?.version });
        }
    }
    /**
     * Merges a guest cart into a registered user cart.
     * If any item is incompatible with current catalog state or has changed price/availability,
     * returns a structured conflict list without dropping any item.
     */
    async mergeCart(userId, sessionId, options) {
        if (!sessionId || sessionId.trim() === '') {
            const userCart = await this.cartRepo.findByUserId(userId);
            return {
                cart: formatCartResponse(userCart, 'user'),
                conflicts: [],
            };
        }
        const guestCart = await cart_model_1.CartModel.findOne({
            ownerType: 'guest',
            sessionId: sessionId.trim(),
        });
        if (!guestCart || guestCart.items.length === 0) {
            const userCart = await this.cartRepo.findByUserId(userId);
            return {
                cart: formatCartResponse(userCart, 'user'),
                conflicts: [],
            };
        }
        // Expired guest cart check
        if (guestCart.expiresAt && guestCart.expiresAt.getTime() <= Date.now()) {
            const userCart = await this.cartRepo.findByUserId(userId);
            return {
                cart: formatCartResponse(userCart, 'user'),
                conflicts: [],
            };
        }
        // Find or initialize registered user cart
        let userCart = await this.cartRepo.findByUserId(userId);
        if (!userCart) {
            userCart = await this.cartRepo.create({
                ownerType: 'user',
                userId: new mongoose_1.Types.ObjectId(userId),
                sessionId: null,
                items: [],
                currency: 'EGP',
                expiresAt: null,
                version: 1,
            });
        }
        if (options?.expectedUserCartVersion !== undefined &&
            userCart.version !== options.expectedUserCartVersion) {
            throw new errors_1.ConflictError(errorCodes_1.ErrorCodes.CART_VERSION_CONFLICT, 'User cart version conflict', { expectedVersion: options.expectedUserCartVersion, currentVersion: userCart.version });
        }
        const conflicts = [];
        const eligibleToMerge = [];
        // Analyze every guest item against the authoritative catalog
        for (const guestItem of guestCart.items) {
            const product = await product_model_1.ProductModel.findById(guestItem.productId);
            if (!product) {
                conflicts.push({
                    productId: guestItem.productId.toString(),
                    variantId: guestItem.variantId,
                    reason: 'PRODUCT_NOT_FOUND',
                    message: 'Product no longer exists in catalog',
                });
                continue;
            }
            if (!product.isPublished) {
                conflicts.push({
                    productId: guestItem.productId.toString(),
                    variantId: guestItem.variantId,
                    reason: 'PRODUCT_UNPUBLISHED',
                    message: 'Product is not published',
                });
                continue;
            }
            const category = await category_model_1.CategoryModel.findById(product.categoryId);
            if (!category || !category.isActive || !category.isMvpEnabled || category.kind !== 'product') {
                conflicts.push({
                    productId: guestItem.productId.toString(),
                    variantId: guestItem.variantId,
                    reason: 'CATEGORY_INACTIVE',
                    message: 'Product category is inactive or unavailable',
                });
                continue;
            }
            let currentPrice;
            let imageSnapshot = null;
            if (product.hasVariants) {
                if (!guestItem.variantId) {
                    conflicts.push({
                        productId: guestItem.productId.toString(),
                        variantId: null,
                        reason: 'VARIANT_NOT_FOUND',
                        message: 'Variant selection is required for this product',
                    });
                    continue;
                }
                const variant = product.variants.find((v) => v.variantId === guestItem.variantId);
                if (!variant) {
                    conflicts.push({
                        productId: guestItem.productId.toString(),
                        variantId: guestItem.variantId,
                        reason: 'VARIANT_NOT_FOUND',
                        message: 'Variant no longer exists in catalog',
                    });
                    continue;
                }
                if (variant.availability === 'out_of_stock') {
                    conflicts.push({
                        productId: guestItem.productId.toString(),
                        variantId: guestItem.variantId,
                        reason: 'VARIANT_UNAVAILABLE',
                        message: 'Variant is out of stock',
                    });
                    continue;
                }
                currentPrice = variant.priceMinor;
                imageSnapshot = variant.images?.[0]?.publicId || product.images?.[0]?.publicId || null;
            }
            else {
                if (guestItem.variantId) {
                    conflicts.push({
                        productId: guestItem.productId.toString(),
                        variantId: guestItem.variantId,
                        reason: 'VARIANT_NOT_FOUND',
                        message: 'Product does not support variants',
                    });
                    continue;
                }
                if (product.availability === 'out_of_stock') {
                    conflicts.push({
                        productId: guestItem.productId.toString(),
                        variantId: null,
                        reason: 'PRODUCT_UNAVAILABLE',
                        message: 'Product is out of stock',
                    });
                    continue;
                }
                currentPrice = product.priceMinor;
                imageSnapshot = product.images?.[0]?.publicId || null;
            }
            // Check for price snapshot drift
            if (guestItem.unitPriceMinor !== currentPrice) {
                conflicts.push({
                    productId: guestItem.productId.toString(),
                    variantId: guestItem.variantId,
                    reason: 'PRICE_CHANGED',
                    message: `Product price changed from ${guestItem.unitPriceMinor} to ${currentPrice}`,
                    details: {
                        previousPriceMinor: guestItem.unitPriceMinor,
                        currentPriceMinor: currentPrice,
                    },
                });
                continue;
            }
            eligibleToMerge.push({
                guestItem,
                currentPrice,
                productNameSnapshot: {
                    ar: product.name.ar,
                    en: product.name.en || null,
                },
                imageSnapshot,
            });
        }
        // MANDATORY RULE: Never silently drop or modify items with conflicts
        if (conflicts.length > 0) {
            throw new errors_1.ConflictError(errorCodes_1.ErrorCodes.CART_MERGE_CONFLICT, 'Cart merge resulted in conflicts requiring customer review', { conflicts });
        }
        // Merge compatible items into user cart
        for (const eligible of eligibleToMerge) {
            const existing = userCart.items.find((i) => i.productId.toString() === eligible.guestItem.productId.toString() &&
                (i.variantId || null) === (eligible.guestItem.variantId || null));
            if (existing) {
                existing.quantity += eligible.guestItem.quantity;
                existing.unitPriceMinor = eligible.currentPrice;
                existing.productNameSnapshot = eligible.productNameSnapshot;
                existing.imageSnapshot = eligible.imageSnapshot;
            }
            else {
                userCart.items.push({
                    _id: new mongoose_1.Types.ObjectId(),
                    productId: eligible.guestItem.productId,
                    variantId: eligible.guestItem.variantId || null,
                    quantity: eligible.guestItem.quantity,
                    unitPriceMinor: eligible.currentPrice,
                    productNameSnapshot: eligible.productNameSnapshot,
                    imageSnapshot: eligible.imageSnapshot,
                    addedAt: new Date(),
                });
            }
        }
        userCart.version += 1;
        await userCart.save();
        // Clean up guest cart now that all items are safely merged
        await cart_model_1.CartModel.deleteOne({ _id: guestCart._id });
        return {
            cart: formatCartResponse(userCart, 'user'),
            conflicts: [],
        };
    }
}
exports.CartService = CartService;
exports.cartService = new CartService();
//# sourceMappingURL=cart.service.js.map