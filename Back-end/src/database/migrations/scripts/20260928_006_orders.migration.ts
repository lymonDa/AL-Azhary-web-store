import { Migration, MigrationContext } from '../types';
import { registerMigration } from '../registry';

export const ordersMigration: Migration = {
  id: '20260928_006_orders',
  description:
    'Ensure orders and shippingRules collections and blueprint indexes (reference uniqueness, customer query, status query, idempotency key unique partial, shipping priority)',
  up: async (context: MigrationContext): Promise<void> => {
    const db = context.connection.db;
    if (!db) return;

    // 1. Ensure orders collection exists
    const ordersExists = await db.listCollections({ name: 'orders' }).toArray();
    if (ordersExists.length === 0) {
      await db.createCollection('orders');
    }
    const ordersCol = db.collection('orders');

    // Reference uniqueness index
    await ordersCol.createIndex(
      { reference: 1 },
      {
        unique: true,
        name: 'idx_orders_reference_unique',
        background: true,
      },
    );

    // Customer ownership & history query index
    await ordersCol.createIndex(
      { customerId: 1, submittedAt: -1 },
      {
        name: 'idx_orders_customer_submitted',
        background: true,
      },
    );

    // Status & submitted date query index
    await ordersCol.createIndex(
      { status: 1, submittedAt: 1 },
      {
        name: 'idx_orders_status_submitted',
        background: true,
      },
    );

    // Governorate & submitted date query index
    await ordersCol.createIndex(
      { 'fulfillment.addressSnapshot.governorate': 1, submittedAt: -1 },
      {
        name: 'idx_orders_governorate_submitted',
        background: true,
      },
    );

    // Idempotency key uniqueness partial index (for string idempotency keys)
    await ordersCol.createIndex(
      { idempotencyKey: 1 },
      {
        unique: true,
        partialFilterExpression: { idempotencyKey: { $type: 'string' } },
        name: 'idx_orders_idempotency_key_unique',
        background: true,
      },
    );

    // Guest token hash index
    await ordersCol.createIndex(
      { guestAccessTokenHash: 1 },
      {
        name: 'idx_orders_guest_token_hash',
        background: true,
      },
    );

    // 2. Ensure shippingRules collection exists
    const shippingRulesExists = await db.listCollections({ name: 'shippingRules' }).toArray();
    if (shippingRulesExists.length === 0) {
      await db.createCollection('shippingRules');
    }
    const shippingRulesCol = db.collection('shippingRules');

    // Active rules sorted by priority descending
    await shippingRulesCol.createIndex(
      { isActive: 1, priority: -1 },
      {
        name: 'idx_shipping_rules_active_priority',
        background: true,
      },
    );

    // Location hierarchy match index
    await shippingRulesCol.createIndex(
      { governorate: 1, city: 1, area: 1 },
      {
        name: 'idx_shipping_rules_location_hierarchy',
        background: true,
      },
    );
  },
  down: async (context: MigrationContext): Promise<void> => {
    const db = context.connection.db;
    if (!db) return;

    const safeDrop = async (collectionName: string, indexName: string) => {
      try {
        await db.collection(collectionName).dropIndex(indexName);
      } catch {
        // Silently ignore if index does not exist
      }
    };

    await safeDrop('orders', 'idx_orders_reference_unique');
    await safeDrop('orders', 'idx_orders_customer_submitted');
    await safeDrop('orders', 'idx_orders_status_submitted');
    await safeDrop('orders', 'idx_orders_governorate_submitted');
    await safeDrop('orders', 'idx_orders_idempotency_key_unique');
    await safeDrop('orders', 'idx_orders_guest_token_hash');

    await safeDrop('shippingRules', 'idx_shipping_rules_active_priority');
    await safeDrop('shippingRules', 'idx_shipping_rules_location_hierarchy');
  },
};

registerMigration(ordersMigration);
