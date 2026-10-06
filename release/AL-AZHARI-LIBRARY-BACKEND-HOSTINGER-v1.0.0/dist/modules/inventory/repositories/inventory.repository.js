"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.inventoryRepository = exports.InventoryRepository = void 0;
const mongoose_1 = require("mongoose");
const product_model_1 = require("../../products/models/product.model");
class InventoryRepository {
    /**
     * Find product by ID with optional session.
     */
    async findProductById(productId, ctx) {
        const objectId = typeof productId === 'string' ? new mongoose_1.Types.ObjectId(productId) : productId;
        const query = product_model_1.ProductModel.findById(objectId);
        if (ctx?.session) {
            query.session(ctx.session);
        }
        return query;
    }
    /**
     * Conditionally reserve stock for a non-variant product.
     * Atomic condition: (stockTotal - stockReserved) >= quantity.
     */
    async reserveProductStock(productId, quantity, ctx) {
        const objectId = typeof productId === 'string' ? new mongoose_1.Types.ObjectId(productId) : productId;
        const res = await product_model_1.ProductModel.updateOne({
            _id: objectId,
            hasVariants: false,
            $expr: {
                $gte: [{ $subtract: ['$stockTotal', '$stockReserved'] }, quantity],
            },
        }, {
            $inc: {
                stockReserved: quantity,
                inventoryVersion: 1,
            },
        }, { session: ctx?.session || undefined });
        return res.modifiedCount === 1;
    }
    /**
     * Conditionally reserve stock for an embedded variant product.
     * Atomic condition: variant exists and (variant.stockTotal - variant.stockReserved) >= quantity.
     */
    async reserveVariantStock(productId, variantId, quantity, ctx) {
        const objectId = typeof productId === 'string' ? new mongoose_1.Types.ObjectId(productId) : productId;
        const res = await product_model_1.ProductModel.updateOne({
            _id: objectId,
            hasVariants: true,
            'variants.variantId': variantId,
            $expr: {
                $gt: [
                    {
                        $size: {
                            $filter: {
                                input: '$variants',
                                as: 'v',
                                cond: {
                                    $and: [
                                        { $eq: ['$$v.variantId', variantId] },
                                        {
                                            $gte: [
                                                { $subtract: ['$$v.stockTotal', '$$v.stockReserved'] },
                                                quantity,
                                            ],
                                        },
                                    ],
                                },
                            },
                        },
                    },
                    0,
                ],
            },
        }, {
            $inc: {
                'variants.$.stockReserved': quantity,
                'variants.$.inventoryVersion': 1,
                inventoryVersion: 1,
            },
        }, { session: ctx?.session || undefined });
        return res.modifiedCount === 1;
    }
    /**
     * Conditionally release reserved stock for a non-variant product.
     * Atomic condition: stockReserved >= quantity.
     */
    async releaseProductStock(productId, quantity, ctx) {
        const objectId = typeof productId === 'string' ? new mongoose_1.Types.ObjectId(productId) : productId;
        const res = await product_model_1.ProductModel.updateOne({
            _id: objectId,
            hasVariants: false,
            stockReserved: { $gte: quantity },
        }, {
            $inc: {
                stockReserved: -quantity,
                inventoryVersion: 1,
            },
        }, { session: ctx?.session || undefined });
        return res.modifiedCount === 1;
    }
    /**
     * Conditionally release reserved stock for an embedded variant product.
     * Atomic condition: variant exists and variant.stockReserved >= quantity.
     */
    async releaseVariantStock(productId, variantId, quantity, ctx) {
        const objectId = typeof productId === 'string' ? new mongoose_1.Types.ObjectId(productId) : productId;
        const res = await product_model_1.ProductModel.updateOne({
            _id: objectId,
            hasVariants: true,
            'variants.variantId': variantId,
            'variants.stockReserved': { $gte: quantity },
        }, {
            $inc: {
                'variants.$.stockReserved': -quantity,
                'variants.$.inventoryVersion': 1,
                inventoryVersion: 1,
            },
        }, { session: ctx?.session || undefined });
        return res.modifiedCount === 1;
    }
    /**
     * Conditionally deduct total and reserved stock upon fulfillment for a non-variant product.
     * Invariants: stockTotal >= quantity AND stockReserved >= quantity.
     */
    async deductProductStock(productId, quantity, ctx) {
        const objectId = typeof productId === 'string' ? new mongoose_1.Types.ObjectId(productId) : productId;
        const res = await product_model_1.ProductModel.updateOne({
            _id: objectId,
            hasVariants: false,
            stockTotal: { $gte: quantity },
            stockReserved: { $gte: quantity },
        }, {
            $inc: {
                stockTotal: -quantity,
                stockReserved: -quantity,
                inventoryVersion: 1,
            },
        }, { session: ctx?.session || undefined });
        return res.modifiedCount === 1;
    }
    /**
     * Conditionally deduct total and reserved stock upon fulfillment for a variant product.
     * Invariants: variant.stockTotal >= quantity AND variant.stockReserved >= quantity.
     */
    async deductVariantStock(productId, variantId, quantity, ctx) {
        const objectId = typeof productId === 'string' ? new mongoose_1.Types.ObjectId(productId) : productId;
        const res = await product_model_1.ProductModel.updateOne({
            _id: objectId,
            hasVariants: true,
            'variants.variantId': variantId,
            'variants.stockTotal': { $gte: quantity },
            'variants.stockReserved': { $gte: quantity },
        }, {
            $inc: {
                'variants.$.stockTotal': -quantity,
                'variants.$.stockReserved': -quantity,
                'variants.$.inventoryVersion': 1,
                inventoryVersion: 1,
            },
        }, { session: ctx?.session || undefined });
        return res.modifiedCount === 1;
    }
    /**
     * Restores total stock for a non-variant product upon return approval.
     */
    async restoreProductStock(productId, quantity, ctx) {
        const objectId = typeof productId === 'string' ? new mongoose_1.Types.ObjectId(productId) : productId;
        const res = await product_model_1.ProductModel.updateOne({
            _id: objectId,
            hasVariants: false,
        }, {
            $inc: {
                stockTotal: quantity,
                inventoryVersion: 1,
            },
        }, { session: ctx?.session || undefined });
        return res.modifiedCount === 1;
    }
    /**
     * Restores total stock for an embedded variant product upon return approval.
     */
    async restoreVariantStock(productId, variantId, quantity, ctx) {
        const objectId = typeof productId === 'string' ? new mongoose_1.Types.ObjectId(productId) : productId;
        const res = await product_model_1.ProductModel.updateOne({
            _id: objectId,
            hasVariants: true,
            'variants.variantId': variantId,
        }, {
            $inc: {
                'variants.$.stockTotal': quantity,
                'variants.$.inventoryVersion': 1,
                inventoryVersion: 1,
            },
        }, { session: ctx?.session || undefined });
        return res.modifiedCount === 1;
    }
    /**
     * Optimistically adjust stock for a non-variant product with version checking.
     */
    async adjustProductStockWithVersion(productId, expectedVersion, deltaStockTotal, deltaStockReserved, ctx) {
        const objectId = typeof productId === 'string' ? new mongoose_1.Types.ObjectId(productId) : productId;
        const query = {
            _id: objectId,
            hasVariants: false,
            inventoryVersion: expectedVersion,
        };
        // Prevent negative stock invariants in the filter
        if (deltaStockTotal < 0) {
            query.stockTotal = { $gte: Math.abs(deltaStockTotal) };
        }
        if (deltaStockReserved < 0) {
            query.stockReserved = { $gte: Math.abs(deltaStockReserved) };
        }
        const res = await product_model_1.ProductModel.updateOne(query, {
            $inc: {
                stockTotal: deltaStockTotal,
                stockReserved: deltaStockReserved,
                inventoryVersion: 1,
            },
        }, { session: ctx?.session || undefined });
        return res.modifiedCount === 1;
    }
    /**
     * Optimistically adjust stock for a variant with version checking.
     */
    async adjustVariantStockWithVersion(productId, variantId, expectedVersion, deltaStockTotal, deltaStockReserved, ctx) {
        const objectId = typeof productId === 'string' ? new mongoose_1.Types.ObjectId(productId) : productId;
        const elemFilter = {
            variantId,
            inventoryVersion: expectedVersion,
        };
        if (deltaStockTotal < 0) {
            elemFilter.stockTotal = { $gte: Math.abs(deltaStockTotal) };
        }
        if (deltaStockReserved < 0) {
            elemFilter.stockReserved = { $gte: Math.abs(deltaStockReserved) };
        }
        const res = await product_model_1.ProductModel.updateOne({
            _id: objectId,
            hasVariants: true,
            variants: {
                $elemMatch: elemFilter,
            },
        }, {
            $inc: {
                'variants.$.stockTotal': deltaStockTotal,
                'variants.$.stockReserved': deltaStockReserved,
                'variants.$.inventoryVersion': 1,
                inventoryVersion: 1,
            },
        }, { session: ctx?.session || undefined });
        return res.modifiedCount === 1;
    }
}
exports.InventoryRepository = InventoryRepository;
exports.inventoryRepository = new InventoryRepository();
//# sourceMappingURL=inventory.repository.js.map