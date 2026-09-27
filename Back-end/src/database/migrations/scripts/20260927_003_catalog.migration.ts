import { Migration, MigrationContext } from '../types';

export const catalogMigration: Migration = {
  id: '20260927_003_catalog',
  description:
    'Ensure categories, products, contentModules and auditLogs collection indexes',
  up: async (context: MigrationContext): Promise<void> => {
    const db = context.connection.db;
    if (!db) return;

    // 1. Categories collection
    const categoriesExists = await db.listCollections({ name: 'categories' }).toArray();
    if (categoriesExists.length === 0) {
      await db.createCollection('categories');
    }
    const categoriesCol = db.collection('categories');

    await categoriesCol.createIndex(
      { slug: 1 },
      { unique: true, name: 'idx_categories_slug_unique', background: true },
    );
    await categoriesCol.createIndex(
      { isActive: 1, isMvpEnabled: 1, isBooksCore: -1, displayOrder: 1 },
      { name: 'idx_categories_public_browse', background: true },
    );

    // 2. Products collection
    const productsExists = await db.listCollections({ name: 'products' }).toArray();
    if (productsExists.length === 0) {
      await db.createCollection('products');
    }
    const productsCol = db.collection('products');

    await productsCol.createIndex(
      { slug: 1 },
      { unique: true, name: 'idx_products_slug_unique', background: true },
    );
    await productsCol.createIndex(
      { categoryId: 1, isPublished: 1, displayOrder: 1 },
      { name: 'idx_products_category_published_display', background: true },
    );
    await productsCol.createIndex(
      { availability: 1, isPublished: 1 },
      { name: 'idx_products_availability_published', background: true },
    );
    await productsCol.createIndex(
      { isPublished: 1, searchText: 1 },
      { name: 'idx_products_published_search', background: true },
    );
    await productsCol.createIndex(
      { 'metadata.isbn': 1 },
      {
        unique: true,
        partialFilterExpression: { 'metadata.isbn': { $type: 'string' } },
        name: 'idx_products_isbn_sparse_unique',
        background: true,
      },
    );

    // 3. ContentModules collection
    const contentExists = await db.listCollections({ name: 'contentModules' }).toArray();
    if (contentExists.length === 0) {
      await db.createCollection('contentModules');
    }
    const contentCol = db.collection('contentModules');

    await contentCol.createIndex(
      { key: 1 },
      { unique: true, name: 'idx_content_modules_key_unique', background: true },
    );
    await contentCol.createIndex(
      { active: 1, displayOrder: 1, startsAt: 1, endsAt: 1 },
      { name: 'idx_content_modules_active_display', background: true },
    );

    // 4. AuditLogs collection
    const auditExists = await db.listCollections({ name: 'auditLogs' }).toArray();
    if (auditExists.length === 0) {
      await db.createCollection('auditLogs');
    }
    const auditCol = db.collection('auditLogs');

    await auditCol.createIndex(
      { entityType: 1, entityId: 1, createdAt: -1 },
      { name: 'idx_audit_logs_entity', background: true },
    );
    await auditCol.createIndex(
      { actorId: 1, createdAt: -1 },
      { name: 'idx_audit_logs_actor', background: true },
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

    await safeDrop('categories', 'idx_categories_slug_unique');
    await safeDrop('categories', 'idx_categories_public_browse');
    await safeDrop('products', 'idx_products_slug_unique');
    await safeDrop('products', 'idx_products_category_published_display');
    await safeDrop('products', 'idx_products_availability_published');
    await safeDrop('products', 'idx_products_published_search');
    await safeDrop('products', 'idx_products_isbn_sparse_unique');
    await safeDrop('contentModules', 'idx_content_modules_key_unique');
    await safeDrop('contentModules', 'idx_content_modules_active_display');
    await safeDrop('auditLogs', 'idx_audit_logs_entity');
    await safeDrop('auditLogs', 'idx_audit_logs_actor');
  },
};
