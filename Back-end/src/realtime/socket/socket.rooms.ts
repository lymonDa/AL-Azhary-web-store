import { Types } from 'mongoose';
import { AuthenticatedSocket } from './socket.auth';
import { OrderModel } from '../../modules/orders/models/order.model';
import { ServiceRequestModel } from '../../modules/services/models/service-request.model';
import { rolesService } from '../../modules/users/services/roles.service';
import { logger } from '../../config/logger';

export type RoomAckCallback = (response: { success: boolean; room?: string; error?: string }) => void;

function isValidObjectId(id: string): boolean {
  return Types.ObjectId.isValid(id) && new Types.ObjectId(id).toString() === id;
}

export function registerSocketRooms(socket: AuthenticatedSocket): void {
  const user = socket.data.user;
  const userRoom = `user:${user.userId}`;

  // Automatically join personal user room upon connection
  socket.join(userRoom);
  logger.debug({ socketId: socket.id, userId: user.userId }, 'Socket joined personal user room');

  // 1. Join Order Room
  socket.on('join:order', async (data: { orderId: string }, callback?: RoomAckCallback) => {
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

      const order = await OrderModel.findOne(query).select('customerId reference').lean().exec();

      // Authorization check: owner OR authorized staff
      const isOwner = Boolean(order?.customerId && order.customerId.toString() === user.userId);
      const hasStaffPermission = await rolesService.hasPermission(user.role, 'orders.read');

      if (order && (isOwner || hasStaffPermission)) {
        const roomName = `order:${order._id.toString()}`;
        socket.join(roomName);
        const res = { success: true, room: roomName };
        callback?.(res);
      } else {
        // Return generic forbidden without leaking existence
        const res = { success: false, error: 'FORBIDDEN_ROOM' };
        socket.emit('room:error', res);
        callback?.(res);
      }
    } catch (err) {
      logger.error({ err, orderId: data?.orderId }, 'Error joining order room');
      const res = { success: false, error: 'FORBIDDEN_ROOM' };
      socket.emit('room:error', res);
      callback?.(res);
    }
  });

  // 2. Join Service Room
  socket.on('join:service', async (data: { serviceId: string }, callback?: RoomAckCallback) => {
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

      const serviceReq = await ServiceRequestModel.findOne(query)
        .select('customerId reference')
        .lean()
        .exec();

      const isOwner = Boolean(serviceReq?.customerId && serviceReq.customerId.toString() === user.userId);
      const hasStaffPermission = await rolesService.hasPermission(user.role, 'services.read');

      if (serviceReq && (isOwner || hasStaffPermission)) {
        const roomName = `service:${serviceReq._id.toString()}`;
        socket.join(roomName);
        const res = { success: true, room: roomName };
        callback?.(res);
      } else {
        const res = { success: false, error: 'FORBIDDEN_ROOM' };
        socket.emit('room:error', res);
        callback?.(res);
      }
    } catch (err) {
      logger.error({ err, serviceId: data?.serviceId }, 'Error joining service room');
      const res = { success: false, error: 'FORBIDDEN_ROOM' };
      socket.emit('room:error', res);
      callback?.(res);
    }
  });

  // 3. Join Admin Operational Room (permission-gated)
  socket.on('join:admin_operational', async (_data: unknown, callback?: RoomAckCallback) => {
    try {
      const hasAccess =
        (await rolesService.hasPermission(user.role, 'orders.read')) ||
        (await rolesService.hasPermission(user.role, 'realtime.admin'));

      if (hasAccess) {
        socket.join('admin:operational');
        const res = { success: true, room: 'admin:operational' };
        callback?.(res);
      } else {
        const res = { success: false, error: 'FORBIDDEN_ROOM' };
        socket.emit('room:error', res);
        callback?.(res);
      }
    } catch (err) {
      logger.error({ err }, 'Error joining admin operational room');
      const res = { success: false, error: 'FORBIDDEN_ROOM' };
      socket.emit('room:error', res);
      callback?.(res);
    }
  });

  // 4. Leave Room
  socket.on('leave:room', (data: { room: string }, callback?: RoomAckCallback) => {
    if (data?.room && typeof data.room === 'string') {
      socket.leave(data.room);
      callback?.({ success: true, room: data.room });
    }
  });
}
