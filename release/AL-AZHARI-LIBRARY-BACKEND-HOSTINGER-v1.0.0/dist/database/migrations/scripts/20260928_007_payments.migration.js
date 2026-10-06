"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentsMigration = void 0;
const registry_1 = require("../registry");
exports.paymentsMigration = {
    id: '20260928_007_payments',
    description: 'Ensure payments and paymentProofs collections and blueprint indexes (owner uniqueness, status queues, submission number uniqueness)',
    up: async (context) => {
        const db = context.connection.db;
        if (!db)
            return;
        // 1. Ensure payments collection exists
        const paymentsExists = await db.listCollections({ name: 'payments' }).toArray();
        if (paymentsExists.length === 0) {
            await db.createCollection('payments');
        }
        const paymentsCol = db.collection('payments');
        // Owner uniqueness index (one payment record per order/quotation)
        await paymentsCol.createIndex({ ownerType: 1, ownerId: 1 }, {
            unique: true,
            name: 'idx_payments_owner_unique',
            background: true,
        });
        // Status queue index
        await paymentsCol.createIndex({ status: 1, updatedAt: 1 }, {
            name: 'idx_payments_status_updated',
            background: true,
        });
        // Customer query index
        await paymentsCol.createIndex({ customerId: 1, createdAt: -1 }, {
            name: 'idx_payments_customer_created',
            background: true,
        });
        // 2. Ensure paymentProofs collection exists
        const proofsExists = await db.listCollections({ name: 'paymentProofs' }).toArray();
        if (proofsExists.length === 0) {
            await db.createCollection('paymentProofs');
        }
        const proofsCol = db.collection('paymentProofs');
        // Unique compound index on (paymentId, submissionNumber)
        await proofsCol.createIndex({ paymentId: 1, submissionNumber: 1 }, {
            unique: true,
            name: 'idx_payment_proofs_submission_unique',
            background: true,
        });
        // Proof review queue index
        await proofsCol.createIndex({ status: 1, createdAt: 1 }, {
            name: 'idx_payment_proofs_status_created',
            background: true,
        });
        // Owner query index
        await proofsCol.createIndex({ ownerType: 1, ownerId: 1, createdAt: -1 }, {
            name: 'idx_payment_proofs_owner_created',
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
        await safeDrop('payments', 'idx_payments_owner_unique');
        await safeDrop('payments', 'idx_payments_status_updated');
        await safeDrop('payments', 'idx_payments_customer_created');
        await safeDrop('paymentProofs', 'idx_payment_proofs_submission_unique');
        await safeDrop('paymentProofs', 'idx_payment_proofs_status_created');
        await safeDrop('paymentProofs', 'idx_payment_proofs_owner_created');
    },
};
(0, registry_1.registerMigration)(exports.paymentsMigration);
//# sourceMappingURL=20260928_007_payments.migration.js.map