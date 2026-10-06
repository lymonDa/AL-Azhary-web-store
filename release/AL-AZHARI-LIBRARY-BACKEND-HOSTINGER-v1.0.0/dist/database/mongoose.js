"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mongoose = void 0;
exports.connectDatabase = connectDatabase;
exports.disconnectDatabase = disconnectDatabase;
exports.isDatabaseReady = isDatabaseReady;
exports.isDatabaseConnected = isDatabaseConnected;
exports.getDatabaseState = getDatabaseState;
const mongoose_1 = __importDefault(require("mongoose"));
exports.mongoose = mongoose_1.default;
const config_1 = require("../config");
let connectingPromise = null;
let lastError = null;
let listenersInitialized = false;
function initConnectionListeners() {
    if (listenersInitialized)
        return;
    listenersInitialized = true;
    mongoose_1.default.connection.on('connected', () => {
        lastError = null;
        config_1.logger.info({ dbName: mongoose_1.default.connection.name || config_1.databaseConfig.dbName }, 'MongoDB connection established successfully');
    });
    mongoose_1.default.connection.on('error', (err) => {
        lastError = err;
        config_1.logger.error({ err: err.message }, 'MongoDB connection error encountered');
    });
    mongoose_1.default.connection.on('disconnected', () => {
        config_1.logger.warn('MongoDB connection disconnected');
    });
    mongoose_1.default.connection.on('reconnected', () => {
        lastError = null;
        config_1.logger.info('MongoDB connection re-established');
    });
}
/**
 * Connects to MongoDB using validated configuration.
 * Prevents duplicate concurrent connection attempts.
 */
async function connectDatabase(overrides) {
    initConnectionListeners();
    // If already connected, return immediately
    if (mongoose_1.default.connection.readyState === 1) {
        return mongoose_1.default;
    }
    // If connection is already in progress, await existing promise
    if (connectingPromise) {
        return connectingPromise;
    }
    const activeConfig = overrides ? (0, config_1.createDatabaseConfig)(overrides) : config_1.databaseConfig;
    config_1.logger.info({ dbName: activeConfig.dbName }, 'Initiating MongoDB connection...');
    connectingPromise = (async () => {
        try {
            await mongoose_1.default.connect(activeConfig.uri, {
                dbName: activeConfig.dbName,
                ...activeConfig.options,
            });
            lastError = null;
            return mongoose_1.default;
        }
        catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));
            config_1.logger.error({ err: lastError.message, dbName: activeConfig.dbName }, 'Failed to connect to MongoDB');
            throw error;
        }
        finally {
            connectingPromise = null;
        }
    })();
    return connectingPromise;
}
/**
 * Gracefully disconnects from MongoDB if connected or connecting.
 */
async function disconnectDatabase() {
    if (connectingPromise) {
        try {
            await connectingPromise;
        }
        catch {
            // Ignore initial connection failure during disconnect
        }
    }
    if (mongoose_1.default.connection.readyState !== 0) {
        config_1.logger.info('Closing MongoDB connection...');
        await mongoose_1.default.disconnect();
        lastError = null;
        config_1.logger.info('MongoDB connection closed gracefully');
    }
}
/**
 * Returns whether the database connection is currently active and ready for operations.
 */
function isDatabaseReady() {
    return mongoose_1.default.connection.readyState === 1;
}
/**
 * Backward compatibility alias for isDatabaseReady().
 */
function isDatabaseConnected() {
    return isDatabaseReady();
}
/**
 * Returns safe string representation of the current connection state.
 */
function getDatabaseState() {
    if (lastError && mongoose_1.default.connection.readyState === 0) {
        return 'error';
    }
    switch (mongoose_1.default.connection.readyState) {
        case 1:
            return 'connected';
        case 2:
            return 'connecting';
        case 3:
            return 'disconnecting';
        case 0:
        default:
            return 'disconnected';
    }
}
//# sourceMappingURL=mongoose.js.map