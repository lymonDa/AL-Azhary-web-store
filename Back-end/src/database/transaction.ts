import mongoose, { ClientSession } from 'mongoose';
import { logger } from '../config/logger';

export type TransactionOptions = Parameters<ClientSession['startTransaction']>[0];

export interface TransactionHelperOptions {
  existingSession?: ClientSession | null;
  transactionOptions?: TransactionOptions;
}

/**
 * Executes a callback within a managed MongoDB transaction session.
 *
 * Rules:
 * - If an existingSession is provided, delegates to it directly to allow nested participation.
 * - If a new session is created, commits on success, aborts on failure, and always ends the session.
 * - Multi-document authoritative operations must propagate the session to all repository queries.
 */
export async function withTransaction<T>(
  operation: (session: ClientSession) => Promise<T>,
  options?: TransactionHelperOptions,
): Promise<T> {
  // If already participating in an outer transaction session, reuse it
  if (options?.existingSession) {
    return operation(options.existingSession);
  }

  const session = await mongoose.startSession();

  try {
    session.startTransaction(options?.transactionOptions);
    const result = await operation(session);
    await session.commitTransaction();
    return result;
  } catch (error) {
    if (session.inTransaction()) {
      try {
        await session.abortTransaction();
      } catch (abortError) {
        logger.error({ err: abortError }, 'Failed to abort transaction cleanly');
      }
    }
    throw error;
  } finally {
    await session.endSession();
  }
}
