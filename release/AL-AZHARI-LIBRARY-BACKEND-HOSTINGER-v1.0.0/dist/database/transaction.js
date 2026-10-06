"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.withTransaction = withTransaction;
const mongoose_1 = __importDefault(require("mongoose"));
const logger_1 = require("../config/logger");
/**
 * Executes a callback within a managed MongoDB transaction session.
 *
 * Rules:
 * - If an existingSession is provided, delegates to it directly to allow nested participation.
 * - If a new session is created, commits on success, aborts on failure, and always ends the session.
 * - Multi-document authoritative operations must propagate the session to all repository queries.
 */
async function withTransaction(operation, options) {
    // If already participating in an outer transaction session, reuse it
    if (options?.existingSession) {
        return operation(options.existingSession);
    }
    const maxRetries = 5;
    let attempt = 0;
    while (attempt < maxRetries) {
        attempt++;
        const session = await mongoose_1.default.startSession();
        try {
            session.startTransaction(options?.transactionOptions);
            const result = await operation(session);
            await session.commitTransaction();
            return result;
        }
        catch (error) {
            if (session.inTransaction()) {
                try {
                    await session.abortTransaction();
                }
                catch (abortError) {
                    logger_1.logger.error({ err: abortError }, 'Failed to abort transaction cleanly');
                }
            }
            const mongoErr = error;
            const isTransient = (typeof mongoErr.hasErrorLabel === 'function' &&
                (mongoErr.hasErrorLabel('TransientTransactionError') ||
                    mongoErr.hasErrorLabel('UnknownTransactionCommitResult'))) ||
                mongoErr.message?.includes('catalog changes') ||
                mongoErr.message?.includes('Write conflict') ||
                mongoErr.message?.includes('temporarily unavailable');
            if (isTransient && attempt < maxRetries) {
                logger_1.logger.warn({ attempt, err: mongoErr.message }, 'Transient transaction error encountered; retrying transaction...');
                // Exponential backoff with small jitter: 50ms, 100ms, 200ms...
                await new Promise((res) => setTimeout(res, 50 * Math.pow(2, attempt - 1)));
                continue;
            }
            const errMessage = error?.message || '';
            if (errMessage.includes('Transaction numbers are only allowed on a replica set member') ||
                errMessage.includes('replica set')) {
                logger_1.logger.warn('Transactions not supported on standalone MongoDB instance; executing without transaction session');
                return operation(session);
            }
            throw error;
        }
        finally {
            await session.endSession();
        }
    }
    throw new Error('Transaction failed after maximum retry attempts');
}
//# sourceMappingURL=transaction.js.map