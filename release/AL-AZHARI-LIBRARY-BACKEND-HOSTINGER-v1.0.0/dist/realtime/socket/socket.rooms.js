"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerSocketRooms = registerSocketRooms;
const mongoose_1 = require("mongoose");
const order_model_1 = require("../../modules/orders/models/order.model");
const service_request_model_1 = require("../../modules/services/models/service-request.model");
const roles_service_1 = require("../../modules/users/services/roles.service");
const logger_1 = require("../../config/logger");
function isValidObjectId(id) {
    return mongoose_1.Types.ObjectId.isValid(id) && new mongoose_1.Types.ObjectId(id).toString() === id;
}
function registerSocketRooms(socket) {
    const user = socket.data.user;
    const userRoom = `user:${user.userId}`;
    // Automatically join personal user room upon connection
    socket.join(userRoom);
    logger_1.logger.debug({ socketId: socket.id, userId: user.userId }, 'Socket joined personal user room');
    // 1. Join Order Room
    socket.on('join:order', async (data, callback) => {
        try {
            if (!data?.orderId || typeof data.orderId !== 'string') {
                const res = { success: false, error: 'FORBIDDEN_ROOM' };
                socket.emit('room:error', res);
                callback?.(res);
                return;
            }
            const idOrRef = data.orderId.trim();
            const query = isValidObjectId(idOrRef)
                ? { $or: [{ _id: idOrRef }, { reference: idOrRef }] }
                : { reference: idOrRef };
            const order = await order_model_1.OrderModel.findOne(query).select('customerId reference').lean().exec();
            // Authorization check: owner OR authorized staff
            const isOwner = Boolean(order?.customerId && order.customerId.toString() === user.userId);
            const hasStaffPermission = await roles_service_1.rolesService.hasPermission(user.role, 'orders.read');
            if (order && (isOwner || hasStaffPermission)) {
                const roomName = `order:${order._id.toString()}`;
                socket.join(roomName);
                const res = { success: true, room: roomName };
                callback?.(res);
            }
            else {
                // Return generic forbidden without leaking existence
                const res = { success: false, error: 'FORBIDDEN_ROOM' };
                socket.emit('room:error', res);
                callback?.(res);
            }
        }
        catch (err) {
            logger_1.logger.error({ err, orderId: data?.orderId }, 'Error joining order room');
            const res = { success: false, error: 'FORBIDDEN_ROOM' };
            socket.emit('room:error', res);
            callback?.(res);
        }
    });
    // 2. Join Service Room
    socket.on('join:service', async (data, callback) => {
        try {
            if (!data?.serviceId || typeof data.serviceId !== 'string') {
                const res = { success: false, error: 'FORBIDDEN_ROOM' };
                socket.emit('room:error', res);
                callback?.(res);
                return;
            }
            const idOrRef = data.serviceId.trim();
            const query = isValidObjectId(idOrRef)
                ? { $or: [{ _id: idOrRef }, { reference: idOrRef }] }
                : { reference: idOrRef };
            const serviceReq = await service_request_model_1.ServiceRequestModel.findOne(query)
                .select('customerId reference')
                .lean()
                .exec();
            const isOwner = Boolean(serviceReq?.customerId && serviceReq.customerId.toString() === user.userId);
            const hasStaffPermission = await roles_service_1.rolesService.hasPermission(user.role, 'services.read');
            if (serviceReq && (isOwner || hasStaffPermission)) {
                const roomName = `service:${serviceReq._id.toString()}`;
                socket.join(roomName);
                const res = { success: true, room: roomName };
                callback?.(res);
            }
            else {
                const res = { success: false, error: 'FORBIDDEN_ROOM' };
                socket.emit('room:error', res);
                callback?.(res);
            }
        }
        catch (err) {
            logger_1.logger.error({ err, serviceId: data?.serviceId }, 'Error joining service room');
            const res = { success: false, error: 'FORBIDDEN_ROOM' };
            socket.emit('room:error', res);
            callback?.(res);
        }
    });
    // 3. Join Admin Operational Room (permission-gated)
    socket.on('join:admin_operational', async (_data, callback) => {
        try {
            const hasAccess = (await roles_service_1.rolesService.hasPermission(user.role, 'orders.read')) ||
                (await roles_service_1.rolesService.hasPermission(user.role, 'realtime.admin'));
            if (hasAccess) {
                socket.join('admin:operational');
                const res = { success: true, room: 'admin:operational' };
                callback?.(res);
            }
            else {
                const res = { success: false, error: 'FORBIDDEN_ROOM' };
                socket.emit('room:error', res);
                callback?.(res);
            }
        }
        catch (err) {
            logger_1.logger.error({ err }, 'Error joining admin operational room');
            const res = { success: false, error: 'FORBIDDEN_ROOM' };
            socket.emit('room:error', res);
            callback?.(res);
        }
    });
    // 4. Leave Room
    socket.on('leave:room', (data, callback) => {
        if (data?.room && typeof data.room === 'string') {
            socket.leave(data.room);
            callback?.({ success: true, room: data.room });
        }
    });
}
//# sourceMappingURL=socket.rooms.js.map