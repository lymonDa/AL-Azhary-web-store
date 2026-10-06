import { ClientSession } from 'mongoose';
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
export declare function withTransaction<T>(operation: (session: ClientSession) => Promise<T>, options?: TransactionHelperOptions): Promise<T>;
