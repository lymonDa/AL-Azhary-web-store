import { Migration } from '../types';
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
export declare const servicesQuotationsMigration: Migration;
