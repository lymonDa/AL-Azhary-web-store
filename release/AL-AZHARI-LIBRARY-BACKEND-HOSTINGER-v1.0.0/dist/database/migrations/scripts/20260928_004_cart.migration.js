"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cartMigration = void 0;
const registry_1 = require("../registry");
exports.cartMigration = {
    id: '20260928_004_cart',
    description: 'Ensure carts collection and blueprint indexes (user uniqueness, session uniqueness, TTL)',
    up: async (context) => {
        const db = context.connection.db;
        if (!db)
            return;
        // 1. Ensure carts collection exists
        const cartsExists = await db.listCollections({ name: 'carts' }).toArray();
        if (cartsExists.length === 0) {
            await db.createCollection('carts');
        }
        const cartsCol = db.collection('carts');
        // 2. Active user cart uniqueness index
        await cartsCol.createIndex({ userId: 1 }, {
            unique: true,
            partialFilterExpression: { ownerType: 'user' },
            name: 'idx_carts_user_unique',
            background: true,
        });
        // 3. Active guest cart session uniqueness index
        await cartsCol.createIndex({ sessionId: 1 }, {
            unique: true,
            partialFilterExpression: { ownerType: 'guest' },
            name: 'idx_carts_session_unique',
            background: true,
        });
        // 4. Guest cart TTL expiration index
        await cartsCol.createIndex({ expiresAt: 1 }, {
            expireAfterSeconds: 0,
            name: 'idx_carts_expires_ttl',
            background: true,
        });
    },
    down: async (context) => {
        const db = context.connection.db;
        if (!db)
            return;
        const safeDrop = async (collectionName, indexName) => {
            try {
                await db.collection(collectionName).dropIndex(indexName);
            }
            catch {
                // Silently ignore if index does not exist
            }
        };
        await safeDrop('carts', 'idx_carts_user_unique');
        await safeDrop('carts', 'idx_carts_session_unique');
        await safeDrop('carts', 'idx_carts_expires_ttl');
    },
};
(0, registry_1.registerMigration)(exports.cartMigration);
//# sourceMappingURL=20260928_004_cart.migration.js.map