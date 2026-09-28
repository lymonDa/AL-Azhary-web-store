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

  const maxRetries = 5;
  let attempt = 0;

  while (attempt < maxRetries) {
    attempt++;
    const session = await mongoose.startSession();

    try {
      session.startTransaction(options?.transactionOptions);
      const result = await operation(session);
      await session.commitTransaction();
      return result;
    } catch (error: unknown) {
      if (session.inTransaction()) {
        try {
          await session.abortTransaction();
        } catch (abortError) {
          logger.error({ err: abortError }, 'Failed to abort transaction cleanly');
        }
      }

      const mongoErr = error as {
        hasErrorLabel?: (label: string) => boolean;
        message?: string;
        code?: number;
      };

      const isTransient =
        (typeof mongoErr.hasErrorLabel === 'function' &&
          (mongoErr.hasErrorLabel('TransientTransactionError') ||
            mongoErr.hasErrorLabel('UnknownTransactionCommitResult'))) ||
        mongoErr.message?.includes('catalog changes') ||
        mongoErr.message?.includes('Write conflict') ||
        mongoErr.message?.includes('temporarily unavailable');

      if (isTransient && attempt < maxRetries) {
        logger.warn(
          { attempt, err: mongoErr.message },
          'Transient transaction error encountered; retrying transaction...',
        );
        // Exponential backoff with small jitter: 50ms, 100ms, 200ms...
        await new Promise((res) => setTimeout(res, 50 * Math.pow(2, attempt - 1)));
        continue;
      }

      const errMessage = (error as { message?: string })?.message || '';
      if (
        errMessage.includes('Transaction numbers are only allowed on a replica set member') ||
        errMessage.includes('replica set')
      ) {
        logger.warn(
          'Transactions not supported on standalone MongoDB instance; executing without transaction session',
        );
        return operation(session);
      }
      throw error;
    } finally {
      await session.endSession();
    }
  }

  throw new Error('Transaction failed after maximum retry attempts');
}
