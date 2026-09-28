import { Types, UpdateQuery, ClientSession } from 'mongoose';
import { CartModel } from '../models/cart.model';
import { ICart, ICartDocument, CartOwnerContext } from '../types/cart.types';

export class CartRepository {
  async findById(id: string | Types.ObjectId, session?: ClientSession): Promise<ICartDocument | null> {
    const objectId = typeof id === 'string' ? new Types.ObjectId(id) : id;
    const query = CartModel.findById(objectId);
    if (session) query.session(session);
    return query;
  }

  async findByUserId(userId: string | Types.ObjectId, session?: ClientSession): Promise<ICartDocument | null> {
    const objectId = typeof userId === 'string' ? new Types.ObjectId(userId) : userId;
    const query = CartModel.findOne({
      ownerType: 'user',
      userId: objectId,
    });
    if (session) query.session(session);
    return query;
  }

  async findBySessionId(sessionId: string, session?: ClientSession): Promise<ICartDocument | null> {
    const query = CartModel.findOne({
      ownerType: 'guest',
      sessionId: sessionId.trim(),
    });
    if (session) query.session(session);
    const cart = await query;

    if (!cart) return null;

    // Application-level TTL safety check: do not return expired guest carts
    if (cart.expiresAt && cart.expiresAt.getTime() <= Date.now()) {
      return null;
    }

    return cart;
  }

  async findActiveByOwner(owner: CartOwnerContext, session?: ClientSession): Promise<ICartDocument | null> {
    if (owner.ownerType === 'user') {
      return this.findByUserId(owner.userId, session);
    }
    return this.findBySessionId(owner.sessionId, session);
  }

  async create(data: Partial<ICart>, session?: ClientSession): Promise<ICartDocument> {
    if (session) {
      const docs = await CartModel.create([data], { session });
      return docs[0];
    }
    return CartModel.create(data);
  }

  /**
   * Performs an atomic update with optimistic version locking.
   * Ensures cart._id, ownership, and expectedVersion match before applying mutations.
   */
  async updateWithVersion(
    cartId: string | Types.ObjectId,
    expectedVersion: number,
    update: UpdateQuery<ICartDocument>,
    ownerFilter?: Partial<{ userId: Types.ObjectId; sessionId: string; ownerType: string }>,
    session?: ClientSession,
  ): Promise<ICartDocument | null> {
    const objectId = typeof cartId === 'string' ? new Types.ObjectId(cartId) : cartId;

    const query: Record<string, unknown> = {
      _id: objectId,
      version: expectedVersion,
    };

    if (ownerFilter) {
      Object.assign(query, ownerFilter);
    }

    const mQuery = CartModel.findOneAndUpdate(query, update, {
      new: true,
      runValidators: true,
    });
    if (session) mQuery.session(session);
    return mQuery;
  }

  async deleteById(id: string | Types.ObjectId): Promise<boolean> {
    const objectId = typeof id === 'string' ? new Types.ObjectId(id) : id;
    const result = await CartModel.deleteOne({ _id: objectId });
    return result.deletedCount > 0;
  }

  async deleteBySessionId(sessionId: string): Promise<boolean> {
    const result = await CartModel.deleteOne({
      ownerType: 'guest',
      sessionId: sessionId.trim(),
    });
    return result.deletedCount > 0;
  }
}

export const cartRepository = new CartRepository();
