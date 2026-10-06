"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initRealtime = initRealtime;
const socket_auth_1 = require("./socket/socket.auth");
const socket_rooms_1 = require("./socket/socket.rooms");
const socket_events_1 = require("./events/socket.events");
const logger_1 = require("../config/logger");
__exportStar(require("./events/socket.events"), exports);
__exportStar(require("./socket/socket.auth"), exports);
__exportStar(require("./socket/socket.rooms"), exports);
/**
 * Initializes Socket.IO with authentication middleware, room boundaries, and event dispatchers.
 */
function initRealtime(io) {
    socket_events_1.realtimeService.setServer(io);
    // Attach handshake authentication
    io.use(socket_auth_1.socketAuthMiddleware);
    // Handle authenticated socket connections
    io.on('connection', (rawSocket) => {
        const socket = rawSocket;
        logger_1.logger.info({ socketId: socket.id, userId: socket.data?.user?.userId, role: socket.data?.user?.role }, 'Realtime client connected successfully');
        // Register room join/leave listeners
        (0, socket_rooms_1.registerSocketRooms)(socket);
        socket.on('disconnect', (reason) => {
            logger_1.logger.info({ socketId: socket.id, reason }, 'Realtime client disconnected');
        });
    });
    logger_1.logger.info('Socket.IO realtime server initialized with authentication and room guards');
}
//# sourceMappingURL=index.js.map