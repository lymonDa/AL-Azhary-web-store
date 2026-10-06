"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = exports.server = void 0;
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const app_1 = require("./app");
const config_1 = require("./config");
const database_1 = require("./database");
const realtime_1 = require("./realtime");
const jobs_1 = require("./jobs");
const server = http_1.default.createServer(app_1.app);
exports.server = server;
// Socket.IO Realtime Server Attachment (Foundation setup)
const io = new socket_io_1.Server(server, {
    path: config_1.env.SOCKET_PATH,
    cors: config_1.corsOptions,
});
exports.io = io;
// Phase 13 Socket.IO Realtime attachment with auth and rooms
(0, realtime_1.initRealtime)(io);
let isShuttingDown = false;
async function startServer() {
    try {
        // 1. Establish database connection before accepting traffic
        try {
            await (0, database_1.connectDatabase)();
        }
        catch (dbError) {
            if (config_1.env.NODE_ENV === 'production') {
                config_1.logger.fatal({ err: dbError instanceof Error ? dbError.message : String(dbError) }, 'Failed to establish database connection on production startup. Terminating.');
                process.exit(1);
            }
            else {
                config_1.logger.warn({ err: dbError instanceof Error ? dbError.message : String(dbError) }, 'MongoDB connection could not be established on startup; /health/live will function, but /health/ready will report disconnected.');
            }
        }
        // 2. Start background outbox workers and maintenance schedulers
        if (config_1.env.NODE_ENV !== 'test') {
            (0, jobs_1.startBackgroundWorkers)();
        }
        // 3. Start HTTP & WebSocket server
        server.listen(config_1.env.PORT, () => {
            config_1.logger.info({
                port: config_1.env.PORT,
                env: config_1.env.NODE_ENV,
                apiBasePath: config_1.env.API_BASE_PATH,
                databaseState: (0, database_1.getDatabaseState)(),
            }, 'AL-AZHARI LIBRARY Backend server started successfully');
        });
    }
    catch (error) {
        config_1.logger.fatal({ error }, 'Failed to start backend server');
        process.exit(1);
    }
}
// Graceful Shutdown Lifecycle:
// Stop accepting new HTTP connections -> Stop Background Workers -> Stop Socket.IO -> Close MongoDB connection -> Exit process
async function gracefulShutdown(signal) {
    if (isShuttingDown)
        return;
    isShuttingDown = true;
    config_1.logger.info({ signal }, 'Graceful shutdown signal received. Closing active resources...');
    // 1. Stop accepting new HTTP connections
    server.close(async (serverErr) => {
        if (serverErr) {
            config_1.logger.error({ err: serverErr }, 'Error while closing HTTP server');
        }
        else {
            config_1.logger.info('HTTP server stopped accepting connections');
        }
        try {
            // 2. Stop Background Workers (drain in-flight outbox deliveries)
            await (0, jobs_1.stopBackgroundWorkers)();
            // 3. Stop Socket.IO
            io.close();
            config_1.logger.info('Socket.IO server closed');
            // 4. Close MongoDB connection
            await (0, database_1.disconnectDatabase)();
            config_1.logger.info('MongoDB connection closed gracefully');
            config_1.logger.info('Graceful shutdown completed successfully');
            process.exit(0);
        }
        catch (err) {
            config_1.logger.error({ err }, 'Error during graceful resource closure');
            process.exit(1);
        }
    });
    // Protection against hanging indefinitely: force exit after 10 seconds
    setTimeout(() => {
        config_1.logger.error('Graceful shutdown timed out after 10s. Forcing termination.');
        process.exit(1);
    }, 10000).unref();
}
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('unhandledRejection', (reason) => {
    config_1.logger.error({ reason }, 'Unhandled Rejection detected');
});
process.on('uncaughtException', (error) => {
    config_1.logger.fatal({ error }, 'Uncaught Exception detected');
    process.exit(1);
});
// Run server when not in test mode
if (process.env.NODE_ENV !== 'test') {
    void startServer();
}
//# sourceMappingURL=server.js.map