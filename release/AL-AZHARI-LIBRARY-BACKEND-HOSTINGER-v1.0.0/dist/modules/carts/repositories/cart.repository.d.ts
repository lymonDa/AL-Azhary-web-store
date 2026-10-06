import { Types, UpdateQuery, ClientSession } from 'mongoose';
import { ICart, ICartDocument, CartOwnerContext } from '../types/cart.types';
export declare class CartRepository {
    findById(id: string | Types.ObjectId, session?: ClientSession): Promise<ICartDocument | null>;
    findByUserId(userId: string | Types.ObjectId, session?: ClientSession): Promise<ICartDocument | null>;
    findBySessionId(sessionId: string, session?: ClientSession): Promise<ICartDocument | null>;
    findActiveByOwner(owner: CartOwnerContext, session?: ClientSession): Promise<ICartDocument | null>;
    create(data: Partial<ICart>, session?: ClientSession): Promise<ICartDocument>;
    /**
     * Performs an atomic update with optimistic version locking.
     * Ensures cart._id, ownership, and expectedVersion match before applying mutations.
     */
    updateWithVersion(cartId: string | Types.ObjectId, expectedVersion: number, update: UpdateQuery<ICartDocument>, ownerFilter?: Partial<{
        userId: Types.ObjectId;
        sessionId: string;
        ownerType: string;
    }>, session?: ClientSession): Promise<ICartDocument | null>;
    deleteById(id: string | Types.ObjectId): Promise<boolean>;
    deleteBySessionId(sessionId: string): Promise<boolean>;
}
export declare const cartRepository: CartRepository;
