import mongoose, { ClientSession } from 'mongoose';

/**
 * Execute an operation within a MongoDB transaction.
 * Ensures the session is properly managed, committed on success, or aborted on error.
 */
export async function withTransaction<T>(
  operation: (session: ClientSession) => Promise<T>,
): Promise<T> {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const result = await operation(session);
    await session.commitTransaction();
    return result;
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    throw error;
  } finally {
    await session.endSession();
  }
}
