import { Migration, MigrationContext } from '../types';
import { registerMigration } from '../registry';

export const addressesMigration: Migration = {
  id: '20260927_002_addresses',
  description:
    'Ensure addresses collection indexes (userId + isDefault partial unique, and userId + createdAt)',
  up: async (context: MigrationContext): Promise<void> => {
    const db = context.connection.db;
    if (!db) return;

    const collections = await db.listCollections({ name: 'addresses' }).toArray();
    if (collections.length === 0) {
      await db.createCollection('addresses');
    }

    const addressesCollection = db.collection('addresses');

    // Partial unique index ensures at most one default address per customer
    await addressesCollection.createIndex(
      { userId: 1, isDefault: 1 },
      {
        unique: true,
        partialFilterExpression: { isDefault: true },
        name: 'idx_addresses_user_default_unique',
        background: true,
      },
    );

    // Compound index for sorted customer listing
    await addressesCollection.createIndex(
      { userId: 1, createdAt: -1 },
      {
        name: 'idx_addresses_user_created',
        background: true,
      },
    );
  },
  down: async (context: MigrationContext): Promise<void> => {
    const db = context.connection.db;
    if (!db) return;

    const addressesCollection = db.collection('addresses');
    try {
      await addressesCollection.dropIndex('idx_addresses_user_default_unique');
    } catch {
      // Silently ignore if already absent
    }
    try {
      await addressesCollection.dropIndex('idx_addresses_user_created');
    } catch {
      // Silently ignore if already absent
    }
  },
};

registerMigration(addressesMigration);
