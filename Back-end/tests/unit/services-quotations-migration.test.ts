import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { servicesQuotationsMigration } from '../../src/database/migrations/scripts/20260928_009_services_quotations.migration';

describe('Phase 11 Services & Quotations Database Migration (009)', () => {
  let mongod: MongoMemoryServer;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri, { dbName: 'test_services_quotations_migration' });
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongod.stop();
  });

  it('should have valid metadata with sequence 20260928_009_services_quotations', () => {
    expect(servicesQuotationsMigration.id).toBe('20260928_009_services_quotations');
    expect(servicesQuotationsMigration.description).toBeDefined();
  });

  it('runs up migration to create collections, blueprint indexes, and seed confirmed categories', async () => {
    await servicesQuotationsMigration.up({ connection: mongoose.connection });

    const db = mongoose.connection.db!;

    // 1. serviceCategories indexes and seeds
    const catIndexes = (await db.collection('serviceCategories').indexes()).map((idx) => idx.name);
    expect(catIndexes).toContain('idx_service_categories_slug_unique');
    expect(catIndexes).toContain('idx_service_categories_active');

    const categories = await db.collection('serviceCategories').find().toArray();
    expect(categories.length).toBe(6);

    const slugs = categories.map((c) => c.slug);
    expect(slugs).toContain('printing');
    expect(slugs).toContain('photocopying');
    expect(slugs).toContain('binding');
    expect(slugs).toContain('applications-transfers');
    expect(slugs).toContain('research-formatting');
    expect(slugs).toContain('other-admin');

    // Verify OD-12, OD-13, OD-14 preservation on seeded categories
    for (const cat of categories) {
      expect(cat.fields).toEqual([]); // OD-12: no mandatory fields invented
      expect(cat.turnaroundText).toBeNull(); // OD-13: turnaround remains null
      expect(cat.codAllowed).toBeNull(); // OD-14: COD remains null
    }

    // 2. serviceRequests indexes
    const reqIndexes = (await db.collection('serviceRequests').indexes()).map((idx) => idx.name);
    expect(reqIndexes).toContain('idx_service_requests_reference_unique');
    expect(reqIndexes).toContain('idx_service_requests_customer_created');
    expect(reqIndexes).toContain('idx_service_requests_status_created');

    // 3. quotations indexes
    const quoteIndexes = (await db.collection('quotations').indexes()).map((idx) => idx.name);
    expect(quoteIndexes).toContain('idx_quotations_request_version');
    expect(quoteIndexes).toContain('idx_quotations_customer_created');
    expect(quoteIndexes).toContain('idx_quotations_status');

    // Idempotency: running up again must not throw or duplicate
    await expect(
      servicesQuotationsMigration.up({ connection: mongoose.connection }),
    ).resolves.not.toThrow();

    const categoriesAfter = await db.collection('serviceCategories').find().toArray();
    expect(categoriesAfter.length).toBe(6);
  });

  it('runs down migration to drop created indexes without dropping collection data', async () => {
    if (servicesQuotationsMigration.down) {
      await servicesQuotationsMigration.down({ connection: mongoose.connection });

      const db = mongoose.connection.db!;

      // Collections and data must still exist
      const catCount = await db.collection('serviceCategories').countDocuments();
      expect(catCount).toBe(6);

      // Indexes dropped
      const catIndexes = (await db.collection('serviceCategories').indexes()).map((idx) => idx.name);
      expect(catIndexes).not.toContain('idx_service_categories_slug_unique');
      expect(catIndexes).not.toContain('idx_service_categories_active');

      const reqIndexes = (await db.collection('serviceRequests').indexes()).map((idx) => idx.name);
      expect(reqIndexes).not.toContain('idx_service_requests_reference_unique');
      expect(reqIndexes).not.toContain('idx_service_requests_customer_created');
      expect(reqIndexes).not.toContain('idx_service_requests_status_created');

      const quoteIndexes = (await db.collection('quotations').indexes()).map((idx) => idx.name);
      expect(quoteIndexes).not.toContain('idx_quotations_request_version');
      expect(quoteIndexes).not.toContain('idx_quotations_customer_created');
      expect(quoteIndexes).not.toContain('idx_quotations_status');
    }
  });
});
