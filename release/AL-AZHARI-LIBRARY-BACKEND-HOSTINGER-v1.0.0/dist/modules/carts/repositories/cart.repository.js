"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cartRepository = exports.CartRepository = void 0;
const mongoose_1 = require("mongoose");
const cart_model_1 = require("../models/cart.model");
class CartRepository {
    async findById(id, session) {
        const objectId = typeof id === 'string' ? new mongoose_1.Types.ObjectId(id) : id;
        const query = cart_model_1.CartModel.findById(objectId);
        if (session)
            query.session(session);
        return query;
    }
    async findByUserId(userId, session) {
        const objectId = typeof userId === 'string' ? new mongoose_1.Types.ObjectId(userId) : userId;
        const query = cart_model_1.CartModel.findOne({
            ownerType: 'user',
            userId: objectId,
        });
        if (session)
            query.session(session);
        return query;
    }
    async findBySessionId(sessionId, session) {
        const query = cart_model_1.CartModel.findOne({
            ownerType: 'guest',
            sessionId: sessionId.trim(),
        });
        if (session)
            query.session(session);
        const cart = await query;
        if (!cart)
            return null;
        // Application-level TTL safety check: do not return expired guest carts
        if (cart.expiresAt && cart.expiresAt.getTime() <= Date.now()) {
            return null;
        }
        return cart;
    }
    async findActiveByOwner(owner, session) {
        if (owner.ownerType === 'user') {
            return this.findByUserId(owner.userId, session);
        }
        return this.findBySessionId(owner.sessionId, session);
    }
    async create(data, session) {
        if (session) {
            const docs = await cart_model_1.CartModel.create([data], { session });
            return docs[0];
        }
        return cart_model_1.CartModel.create(data);
    }
    /**
     * Performs an atomic update with optimistic version locking.
     * Ensures cart._id, ownership, and expectedVersion match before applying mutations.
     */
    async updateWithVersion(cartId, expectedVersion, update, ownerFilter, session) {
        const objectId = typeof cartId === 'string' ? new mongoose_1.Types.ObjectId(cartId) : cartId;
        const query = {
            _id: objectId,
            version: expectedVersion,
        };
        if (ownerFilter) {
            Object.assign(query, ownerFilter);
        }
        const mQuery = cart_model_1.CartModel.findOneAndUpdate(query, update, {
            new: true,
            runValidators: true,
        });
        if (session)
            mQuery.session(session);
        return mQuery;
    }
    async deleteById(id) {
        const objectId = typeof id === 'string' ? new mongoose_1.Types.ObjectId(id) : id;
        const result = await cart_model_1.CartModel.deleteOne({ _id: objectId });
        return result.deletedCount > 0;
    }
    async deleteBySessionId(sessionId) {
        const result = await cart_model_1.CartModel.deleteOne({
            ownerType: 'guest',
            sessionId: sessionId.trim(),
        });
        return result.deletedCount > 0;
    }
}
exports.CartRepository = CartRepository;
exports.cartRepository = new CartRepository();
//# sourceMappingURL=cart.repository.js.map