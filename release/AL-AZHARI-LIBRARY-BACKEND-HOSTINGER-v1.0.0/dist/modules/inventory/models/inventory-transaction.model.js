"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InventoryTransactionModel = exports.inventoryTransactionSchema = void 0;
const mongoose_1 = require("mongoose");
const options_1 = require("../../../database/options");
const integerValidator = {
    validator: Number.isInteger,
    message: '{PATH} must be an integer',
};
exports.inventoryTransactionSchema = new mongoose_1.Schema({
    productId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Product',
        required: [true, 'productId is required'],
        index: true,
    },
    variantId: {
        type: String,
        default: null,
        trim: true,
    },
    type: {
        type: String,
        enum: ['RESERVATION', 'RELEASE', 'DEDUCTION', 'ADJUSTMENT'],
        required: [true, 'transaction type is required'],
        index: true,
    },
    quantityDelta: {
        type: Number,
        required: [true, 'quantityDelta is required'],
        validate: integerValidator,
    },
    stockTotalBefore: {
        type: Number,
        required: [true, 'stockTotalBefore is required'],
        min: [0, 'stockTotalBefore must be non-negative'],
        validate: integerValidator,
    },
    stockTotalAfter: {
        type: Number,
        required: [true, 'stockTotalAfter is required'],
        min: [0, 'stockTotalAfter must be non-negative'],
        validate: integerValidator,
    },
    stockReservedBefore: {
        type: Number,
        required: [true, 'stockReservedBefore is required'],
        min: [0, 'stockReservedBefore must be non-negative'],
        validate: integerValidator,
    },
    stockReservedAfter: {
        type: Number,
        required: [true, 'stockReservedAfter is required'],
        min: [0, 'stockReservedAfter must be non-negative'],
        validate: integerValidator,
    },
    sourceType: {
        type: String,
        enum: ['order', 'manual', 'audit', 'cancellation', 'fulfillment'],
        required: [true, 'sourceType is required'],
    },
    sourceId: {
        type: String,
        required: [true, 'sourceId is required'],
        trim: true,
    },
    actorId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
    },
    actorRole: {
        type: String,
        required: [true, 'actorRole is required'],
        trim: true,
    },
    reason: {
        type: String,
        required: [true, 'reason is required'],
        trim: true,
    },
}, {
    ...options_1.defaultSchemaOptions,
    collection: 'inventoryTransactions',
});
// Immutability protection: prevent updates or deletions on ledger records
exports.inventoryTransactionSchema.pre('updateOne', function () {
    if (this.getOptions().bypassLedgerImmutability)
        return;
    throw new Error('Inventory ledger records are strictly append-only and cannot be updated');
});
exports.inventoryTransactionSchema.pre('updateMany', function () {
    if (this.getOptions().bypassLedgerImmutability)
        return;
    throw new Error('Inventory ledger records are strictly append-only and cannot be updated');
});
exports.inventoryTransactionSchema.pre('findOneAndUpdate', function () {
    if (this.getOptions().bypassLedgerImmutability)
        return;
    throw new Error('Inventory ledger records are strictly append-only and cannot be updated');
});
exports.inventoryTransactionSchema.pre('deleteOne', function () {
    if (this.getOptions().bypassLedgerImmutability)
        return;
    throw new Error('Inventory ledger records are strictly append-only and cannot be deleted');
});
exports.inventoryTransactionSchema.pre('deleteMany', function () {
    if (this.getOptions().bypassLedgerImmutability)
        return;
    throw new Error('Inventory ledger records are strictly append-only and cannot be deleted');
});
exports.inventoryTransactionSchema.pre('findOneAndDelete', function () {
    if (this.getOptions().bypassLedgerImmutability)
        return;
    throw new Error('Inventory ledger records are strictly append-only and cannot be deleted');
});
// Indexes according to authoritative MongoDB blueprint:
// 1. (productId, variantId, createdAt DESC)
exports.inventoryTransactionSchema.index({ productId: 1, variantId: 1, createdAt: -1 }, { name: 'idx_inventory_transactions_prod_variant_created' });
// 2. (sourceType, sourceId, createdAt DESC)
exports.inventoryTransactionSchema.index({ sourceType: 1, sourceId: 1, createdAt: -1 }, { name: 'idx_inventory_transactions_source_created' });
// 3. (actorId, createdAt DESC)
exports.inventoryTransactionSchema.index({ actorId: 1, createdAt: -1 }, { name: 'idx_inventory_transactions_actor_created' });
exports.InventoryTransactionModel = (0, mongoose_1.model)('InventoryTransaction', exports.inventoryTransactionSchema);
//# sourceMappingURL=inventory-transaction.model.js.map