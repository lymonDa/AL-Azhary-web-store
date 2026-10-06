"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.databaseConfig = void 0;
exports.createDatabaseConfig = createDatabaseConfig;
exports.getSafeDatabaseMetadata = getSafeDatabaseMetadata;
const env_1 = require("./env");
function createDatabaseConfig(overrides) {
    return {
        uri: overrides?.uri ?? env_1.env.MONGODB_URI,
        dbName: overrides?.dbName ?? env_1.env.MONGODB_DB_NAME,
        options: {
            maxPoolSize: overrides?.options?.maxPoolSize ?? 50,
            minPoolSize: overrides?.options?.minPoolSize ?? 10,
            serverSelectionTimeoutMS: overrides?.options?.serverSelectionTimeoutMS ?? 10000,
            socketTimeoutMS: overrides?.options?.socketTimeoutMS ?? 45000,
            connectTimeoutMS: overrides?.options?.connectTimeoutMS ?? 10000,
            heartbeatFrequencyMS: overrides?.options?.heartbeatFrequencyMS ?? 10000,
            autoIndex: overrides?.options?.autoIndex ?? (env_1.env.NODE_ENV !== 'production'),
            retryWrites: overrides?.options?.retryWrites ?? true,
            retryReads: overrides?.options?.retryReads ?? true,
            ...overrides?.options,
        },
    };
}
exports.databaseConfig = createDatabaseConfig();
/**
 * Returns safe metadata about the database configuration without exposing credentials.
 */
function getSafeDatabaseMetadata(config = exports.databaseConfig) {
    return {
        dbName: config.dbName,
        maxPoolSize: config.options.maxPoolSize,
        minPoolSize: config.options.minPoolSize,
        autoIndex: config.options.autoIndex,
    };
}
//# sourceMappingURL=database.js.map