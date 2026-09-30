import { Migration, MigrationContext } from '../types';
import { registerMigration } from '../registry';

/**
 * Phase 11 — Services & Quotations migration.
 *
 * Ensures the three Phase 11 collections exist with required indexes:
 *   - serviceCategories: unique slug, active status index, seeds confirmed service categories
 *   - serviceRequests: unique reference, customer history, status queues
 *   - quotations: compound request/version index, customer history, status queue
 *
 * Idempotent: createIndex with a named index is safe no-op if the index exists.
 * Non-destructive: no collection drops or data deletion.
 *
 * Open decisions (OD-12, OD-13, OD-14) are strictly preserved:
 *   - No mandatory dynamic fields invented for categories (OD-12)
 *   - turnaroundText remains null (OD-13)
 *   - codAllowed remains null (OD-14)
 */
export const servicesQuotationsMigration: Migration = {
  id: '20260928_009_services_quotations',
  description:
    'Ensure serviceCategories, serviceRequests, and quotations collections with Phase 11 blueprint indexes and default categories',
  up: async (context: MigrationContext): Promise<void> => {
    const db = context.connection.db;
    if (!db) return;

    // ─── 1. serviceCategories ──────────────────────────────────────────────────

    const categoriesExists = await db.listCollections({ name: 'serviceCategories' }).toArray();
    if (categoriesExists.length === 0) {
      await db.createCollection('serviceCategories');
    }
    const categoriesCol = db.collection('serviceCategories');

    // Unique slug
    await categoriesCol.createIndex(
      { slug: 1 },
      { unique: true, name: 'idx_service_categories_slug_unique', background: true },
    );

    // Active status filter
    await categoriesCol.createIndex(
      { isActive: 1 },
      { name: 'idx_service_categories_active', background: true },
    );

    // Seed confirmed service categories idempotently
    const confirmedCategories = [
      {
        slug: 'printing',
        name: { ar: 'خدمات الطباعة', en: 'Printing Services' },
        description: {
          ar: 'طباعة المستندات والأبحاث والمذكرات الدراسية بجودة عالية.',
          en: 'High-quality document, research, and study notes printing.',
        },
        kind: 'printing',
        isActive: true,
        formVersion: 1,
        fields: [],
        communicationChannels: ['whatsapp', 'telegram'],
        pricingMode: 'quotation',
        turnaroundText: null,
        codAllowed: null,
      },
      {
        slug: 'photocopying',
        name: { ar: 'تصوير المستندات', en: 'Photocopying Services' },
        description: {
          ar: 'تصوير الأوراق والمذكرات والكتب الدراسية بسرعة ودقة.',
          en: 'Fast and accurate photocopying of documents, notes, and books.',
        },
        kind: 'photocopying',
        isActive: true,
        formVersion: 1,
        fields: [],
        communicationChannels: ['whatsapp', 'telegram'],
        pricingMode: 'quotation',
        turnaroundText: null,
        codAllowed: null,
      },
      {
        slug: 'binding',
        name: { ar: 'تجليد وتغليف', en: 'Binding & Finishing' },
        description: {
          ar: 'تجليد حلزوني، حراري، وسلك فاخر للكتب والأبحاث.',
          en: 'Spiral, thermal, and wire binding for books and research.',
        },
        kind: 'binding',
        isActive: true,
        formVersion: 1,
        fields: [],
        communicationChannels: ['whatsapp', 'telegram'],
        pricingMode: 'quotation',
        turnaroundText: null,
        codAllowed: null,
      },
      {
        slug: 'applications-transfers',
        name: { ar: 'التقديمات والتحويلات الجامعية', en: 'Applications & University Transfers' },
        description: {
          ar: 'القيام بإجراءات التقديم والتحويلات نيابة عن الطالب.',
          en: 'Administrative assistance for university applications and transfers.',
        },
        kind: 'applications_transfers',
        isActive: true,
        formVersion: 1,
        fields: [],
        communicationChannels: ['whatsapp', 'telegram'],
        pricingMode: 'quotation',
        turnaroundText: null,
        codAllowed: null,
      },
      {
        slug: 'research-formatting',
        name: { ar: 'تنسيق الأبحاث والرسائل', en: 'Research & Thesis Formatting' },
        description: {
          ar: 'تنسيق الأبحاث وفقاً للمعايير الأكاديمية المعتمدة.',
          en: 'Academic research and thesis formatting help.',
        },
        kind: 'research_formatting',
        isActive: true,
        formVersion: 1,
        fields: [],
        communicationChannels: ['whatsapp', 'telegram'],
        pricingMode: 'quotation',
        turnaroundText: null,
        codAllowed: null,
      },
      {
        slug: 'other-admin',
        name: { ar: 'خدمات إدارية أخرى', en: 'Other Administrative Services' },
        description: {
          ar: 'خدمات إدارية وطلابية متنوعة ومعتمدة من المكتبة.',
          en: 'Approved student administrative and support services.',
        },
        kind: 'other_admin',
        isActive: true,
        formVersion: 1,
        fields: [],
        communicationChannels: ['whatsapp', 'telegram'],
        pricingMode: 'quotation',
        turnaroundText: null,
        codAllowed: null,
      },
    ];

    const now = new Date();
    for (const cat of confirmedCategories) {
      await categoriesCol.updateOne(
        { slug: cat.slug },
        {
          $setOnInsert: {
            ...cat,
            createdAt: now,
            updatedAt: now,
          },
        },
        { upsert: true },
      );
    }

    // ─── 2. serviceRequests ────────────────────────────────────────────────────

    const requestsExists = await db.listCollections({ name: 'serviceRequests' }).toArray();
    if (requestsExists.length === 0) {
      await db.createCollection('serviceRequests');
    }
    const requestsCol = db.collection('serviceRequests');

    // Unique reference
    await requestsCol.createIndex(
      { reference: 1 },
      { unique: true, name: 'idx_service_requests_reference_unique', background: true },
    );

    // Customer history index
    await requestsCol.createIndex(
      { customerId: 1, createdAt: -1 },
      { name: 'idx_service_requests_customer_created', background: true },
    );

    // Status queue index
    await requestsCol.createIndex(
      { status: 1, createdAt: 1 },
      { name: 'idx_service_requests_status_created', background: true },
    );

    // ─── 3. quotations ─────────────────────────────────────────────────────────

    const quotesExists = await db.listCollections({ name: 'quotations' }).toArray();
    if (quotesExists.length === 0) {
      await db.createCollection('quotations');
    }
    const quotesCol = db.collection('quotations');

    // Service request and version index
    await quotesCol.createIndex(
      { serviceRequestId: 1, version: -1 },
      { name: 'idx_quotations_request_version', background: true },
    );

    // Customer history index
    await quotesCol.createIndex(
      { customerId: 1, createdAt: -1 },
      { name: 'idx_quotations_customer_created', background: true },
    );

    // Status queue index
    await quotesCol.createIndex(
      { status: 1 },
      { name: 'idx_quotations_status', background: true },
    );
  },

  down: async (context: MigrationContext): Promise<void> => {
    const db = context.connection.db;
    if (!db) return;

    const safeDrop = async (collectionName: string, indexName: string): Promise<void> => {
      try {
        await db.collection(collectionName).dropIndex(indexName);
      } catch {
        // Silently ignore if index does not exist
      }
    };

    await safeDrop('serviceCategories', 'idx_service_categories_slug_unique');
    await safeDrop('serviceCategories', 'idx_service_categories_active');

    await safeDrop('serviceRequests', 'idx_service_requests_reference_unique');
    await safeDrop('serviceRequests', 'idx_service_requests_customer_created');
    await safeDrop('serviceRequests', 'idx_service_requests_status_created');

    await safeDrop('quotations', 'idx_quotations_request_version');
    await safeDrop('quotations', 'idx_quotations_customer_created');
    await safeDrop('quotations', 'idx_quotations_status');
  },
};

registerMigration(servicesQuotationsMigration);
