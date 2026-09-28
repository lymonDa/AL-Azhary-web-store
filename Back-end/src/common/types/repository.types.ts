import { ClientSession } from 'mongoose';

/**
 * Context passed to repository operations participating in transactions and request tracing.
 */
export interface RepositoryContext {
  session?: ClientSession | null;
  requestId?: string;
}
