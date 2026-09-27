import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { catalogMigration } from '../../src/database/migrations/scripts/20260927_003_catalog.migration';

describe('Catalog Database Migration', () => {
  let mongod: MongoMemoryServer;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri, { dbName: 'test_catalog_migration' });
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongod.stop();
  });

  it('runs up migration to create categories, products, contentModules and auditLogs indexes idempotently', async () => {
    await catalogMigration.up({ connection: mongoose.connection });

    const db = mongoose.connection.db;
    expect(db).toBeDefined();

    const categoryIndexes = (await db!.collection('categories').indexes()).map((idx) => idx.name);
    expect(categoryIndexes).toContain('idx_categories_slug_unique');
    expect(categoryIndexes).toContain('idx_categories_public_browse');

    const productIndexes = (await db!.collection('products').indexes()).map((idx) => idx.name);
    expect(productIndexes).toContain('idx_products_slug_unique');
    expect(productIndexes).toContain('idx_products_category_published_display');
    expect(productIndexes).toContain('idx_products_availability_published');
    expect(productIndexes).toContain('idx_products_published_search');
    expect(productIndexes).toContain('idx_products_isbn_sparse_unique');

    const contentIndexes = (await db!.collection('contentModules').indexes()).map((idx) => idx.name);
    expect(contentIndexes).toContain('idx_content_modules_key_unique');
    expect(contentIndexes).toContain('idx_content_modules_active_display');

    const auditIndexes = (await db!.collection('auditLogs').indexes()).map((idx) => idx.name);
    expect(auditIndexes).toContain('idx_audit_logs_entity');
    expect(auditIndexes).toContain('idx_audit_logs_actor');

    // Idempotency check: running up again does not throw
    await expect(
      catalogMigration.up({ connection: mongoose.connection }),
    ).resolves.not.toThrow();
  });

  it('runs down migration to drop created indexes cleanly', async () => {
    if (catalogMigration.down) {
      await catalogMigration.down({ connection: mongoose.connection });

      const db = mongoose.connection.db;
      const categoryIndexes = (await db!.collection('categories').indexes()).map((idx) => idx.name);
      expect(categoryIndexes).not.toContain('idx_categories_slug_unique');
      expect(categoryIndexes).not.toContain('idx_categories_public_browse');
    }
  });
});
