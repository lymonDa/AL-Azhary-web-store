"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InventoryReservationModel = exports.inventoryReservationSchema = void 0;
const mongoose_1 = require("mongoose");
const options_1 = require("../../../database/options");
const integerValidator = {
    validator: Number.isInteger,
    message: '{PATH} must be an integer',
};
exports.inventoryReservationSchema = new mongoose_1.Schema({
    orderId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Order',
        required: [true, 'orderId is required'],
        index: true,
    },
    orderItemId: {
        type: String,
        required: [true, 'orderItemId is required'],
        trim: true,
    },
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
    quantity: {
        type: Number,
        required: [true, 'quantity is required'],
        min: [1, 'quantity must be at least 1'],
        validate: integerValidator,
    },
    status: {
        type: String,
        enum: ['active', 'released', 'consumed'],
        default: 'active',
        required: true,
        index: true,
    },
}, {
    ...options_1.defaultSchemaOptions,
    collection: 'inventoryReservations',
});
// Indexes according to authoritative MongoDB blueprint:
// 1. Unique active reservation per order item (prevents duplicate active reservations for one line)
exports.inventoryReservationSchema.index({ orderItemId: 1 }, {
    unique: true,
    partialFilterExpression: { status: 'active' },
    name: 'idx_inventory_reservations_active_order_item_unique',
});
// 2. Order query index
exports.inventoryReservationSchema.index({ orderId: 1, createdAt: -1 }, { name: 'idx_inventory_reservations_order_created' });
// 3. Product & variant reservation lookup
exports.inventoryReservationSchema.index({ productId: 1, variantId: 1, status: 1 }, { name: 'idx_inventory_reservations_prod_variant_status' });
// 4. Status and lifecycle querying
exports.inventoryReservationSchema.index({ status: 1, createdAt: -1 }, { name: 'idx_inventory_reservations_status_created' });
exports.InventoryReservationModel = (0, mongoose_1.model)('InventoryReservation', exports.inventoryReservationSchema);
//# sourceMappingURL=inventory-reservation.model.js.map