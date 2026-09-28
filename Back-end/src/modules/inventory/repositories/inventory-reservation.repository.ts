import { Types } from 'mongoose';
import { InventoryReservationModel } from '../models/inventory-reservation.model';
import {
  IInventoryReservation,
  IInventoryReservationDocument,
  ReservationStatus,
} from '../types/inventory.types';
import { RepositoryContext } from '../../../common/types';

export class InventoryReservationRepository {
  async create(
    data: Partial<IInventoryReservation>,
    ctx?: RepositoryContext,
  ): Promise<IInventoryReservationDocument> {
    const docs = await InventoryReservationModel.create([data], { session: ctx?.session || undefined });
    return docs[0];
  }

  async findById(
    id: string | Types.ObjectId,
    ctx?: RepositoryContext,
  ): Promise<IInventoryReservationDocument | null> {
    const objectId = typeof id === 'string' ? new Types.ObjectId(id) : id;
    const query = InventoryReservationModel.findById(objectId);
    if (ctx?.session) {
      query.session(ctx.session);
    }
    return query;
  }

  async findByOrderId(
    orderId: string | Types.ObjectId,
    ctx?: RepositoryContext,
  ): Promise<IInventoryReservationDocument[]> {
    const objectId = typeof orderId === 'string' ? new Types.ObjectId(orderId) : orderId;
    const query = InventoryReservationModel.find({ orderId: objectId });
    if (ctx?.session) {
      query.session(ctx.session);
    }
    return query;
  }

  async findActiveByOrderItemId(
    orderItemId: string,
    ctx?: RepositoryContext,
  ): Promise<IInventoryReservationDocument | null> {
    const query = InventoryReservationModel.findOne({
      orderItemId,
      status: 'active',
    });
    if (ctx?.session) {
      query.session(ctx.session);
    }
    return query;
  }

  async updateStatus(
    id: string | Types.ObjectId,
    currentStatus: ReservationStatus,
    newStatus: ReservationStatus,
    ctx?: RepositoryContext,
  ): Promise<IInventoryReservationDocument | null> {
    const objectId = typeof id === 'string' ? new Types.ObjectId(id) : id;
    const query = InventoryReservationModel.findOneAndUpdate(
      { _id: objectId, status: currentStatus },
      { $set: { status: newStatus } },
      { new: true, runValidators: true },
    );
    if (ctx?.session) {
      query.session(ctx.session);
    }
    return query;
  }
}

export const inventoryReservationRepository = new InventoryReservationRepository();
