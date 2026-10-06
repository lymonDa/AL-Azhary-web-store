"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.inventoryTransactionRepository = exports.InventoryTransactionRepository = void 0;
const mongoose_1 = require("mongoose");
const inventory_transaction_model_1 = require("../models/inventory-transaction.model");
class InventoryTransactionRepository {
    async create(data, ctx) {
        const docs = await inventory_transaction_model_1.InventoryTransactionModel.create([data], { session: ctx?.session || undefined });
        return docs[0];
    }
    async findByProduct(productId, variantId, options = {}, ctx) {
        const objectId = typeof productId === 'string' ? new mongoose_1.Types.ObjectId(productId) : productId;
        const filter = { productId: objectId };
        if (variantId !== undefined) {
            filter.variantId = variantId;
        }
        const page = Math.max(1, options.page || 1);
        const limit = Math.min(100, Math.max(1, options.limit || 20));
        const skip = (page - 1) * limit;
        const query = inventory_transaction_model_1.InventoryTransactionModel.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        const countQuery = inventory_transaction_model_1.InventoryTransactionModel.countDocuments(filter);
        if (ctx?.session) {
            query.session(ctx.session);
            countQuery.session(ctx.session);
        }
        const [items, total] = await Promise.all([query.exec(), countQuery.exec()]);
        return {
            items,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit) || 1,
        };
    }
}
exports.InventoryTransactionRepository = InventoryTransactionRepository;
exports.inventoryTransactionRepository = new InventoryTransactionRepository();
//# sourceMappingURL=inventory-transaction.repository.js.map