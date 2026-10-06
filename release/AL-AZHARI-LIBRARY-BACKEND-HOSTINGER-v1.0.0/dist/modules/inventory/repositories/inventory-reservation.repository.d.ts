import { Types } from 'mongoose';
import { IInventoryReservation, IInventoryReservationDocument, ReservationStatus } from '../types/inventory.types';
import { RepositoryContext } from '../../../common/types';
export declare class InventoryReservationRepository {
    create(data: Partial<IInventoryReservation>, ctx?: RepositoryContext): Promise<IInventoryReservationDocument>;
    findById(id: string | Types.ObjectId, ctx?: RepositoryContext): Promise<IInventoryReservationDocument | null>;
    findByOrderId(orderId: string | Types.ObjectId, ctx?: RepositoryContext): Promise<IInventoryReservationDocument[]>;
    findActiveByOrderItemId(orderItemId: string, ctx?: RepositoryContext): Promise<IInventoryReservationDocument | null>;
    updateStatus(id: string | Types.ObjectId, currentStatus: ReservationStatus, newStatus: ReservationStatus, ctx?: RepositoryContext): Promise<IInventoryReservationDocument | null>;
}
export declare const inventoryReservationRepository: InventoryReservationRepository;
