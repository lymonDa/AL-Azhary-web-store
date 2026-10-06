"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.inventoryReservationRepository = exports.InventoryReservationRepository = void 0;
const mongoose_1 = require("mongoose");
const inventory_reservation_model_1 = require("../models/inventory-reservation.model");
class InventoryReservationRepository {
    async create(data, ctx) {
        const docs = await inventory_reservation_model_1.InventoryReservationModel.create([data], { session: ctx?.session || undefined });
        return docs[0];
    }
    async findById(id, ctx) {
        const objectId = typeof id === 'string' ? new mongoose_1.Types.ObjectId(id) : id;
        const query = inventory_reservation_model_1.InventoryReservationModel.findById(objectId);
        if (ctx?.session) {
            query.session(ctx.session);
        }
        return query;
    }
    async findByOrderId(orderId, ctx) {
        const objectId = typeof orderId === 'string' ? new mongoose_1.Types.ObjectId(orderId) : orderId;
        const query = inventory_reservation_model_1.InventoryReservationModel.find({ orderId: objectId });
        if (ctx?.session) {
            query.session(ctx.session);
        }
        return query;
    }
    async findActiveByOrderItemId(orderItemId, ctx) {
        const query = inventory_reservation_model_1.InventoryReservationModel.findOne({
            orderItemId,
            status: 'active',
        });
        if (ctx?.session) {
            query.session(ctx.session);
        }
        return query;
    }
    async updateStatus(id, currentStatus, newStatus, ctx) {
        const objectId = typeof id === 'string' ? new mongoose_1.Types.ObjectId(id) : id;
        const query = inventory_reservation_model_1.InventoryReservationModel.findOneAndUpdate({ _id: objectId, status: currentStatus }, { $set: { status: newStatus } }, { new: true, runValidators: true });
        if (ctx?.session) {
            query.session(ctx.session);
        }
        return query;
    }
}
exports.InventoryReservationRepository = InventoryReservationRepository;
exports.inventoryReservationRepository = new InventoryReservationRepository();
//# sourceMappingURL=inventory-reservation.repository.js.map