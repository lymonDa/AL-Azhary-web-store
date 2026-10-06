"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.realtimeService = exports.RealtimeService = exports.SocketEvents = void 0;
const logger_1 = require("../../config/logger");
exports.SocketEvents = {
    NOTIFICATION_CREATED: 'notification.created',
    ORDER_STATUS_CHANGED: 'order.status_changed',
    PAYMENT_PROOF_SUBMITTED: 'payment.proof_submitted',
    SERVICE_REQUEST_CREATED: 'service.request_created',
    SERVICE_QUOTATION_SENT: 'service.quotation_sent',
    ADMIN_QUEUE_CHANGED: 'admin.queue_changed',
};
class RealtimeService {
    io = null;
    setServer(io) {
        this.io = io;
    }
    getServer() {
        return this.io;
    }
    /**
     * Sanitizes payload to ensure only minimal, safe display data is emitted.
     * Never transmits passwords, tokens, payment proof URLs, or sensitive PII.
     */
    sanitizePayload(payload) {
        const sanitized = { ...payload };
        const forbiddenKeys = [
            'password',
            'passwordHash',
            'token',
            'accessToken',
            'refreshToken',
            'proofUrl',
            'secureUrl',
            'cloudinaryPublicId',
            'cvv',
            'cardNumber',
        ];
        for (const key of Object.keys(sanitized)) {
            if (forbiddenKeys.some((f) => key.toLowerCase().includes(f.toLowerCase()))) {
                delete sanitized[key];
            }
        }
        return sanitized;
    }
    /**
     * Emit event to a specific authenticated user's room.
     */
    emitToUser(userId, event, payload) {
        if (!this.io) {
            logger_1.logger.debug({ userId, event }, 'Realtime emission skipped: Socket.IO server not initialized');
            return false;
        }
        try {
            const cleanPayload = this.sanitizePayload(payload);
            this.io.to(`user:${userId}`).emit(event, cleanPayload);
            return true;
        }
        catch (err) {
            logger_1.logger.warn({ err, userId, event }, 'Failed to emit realtime event to user room');
            return false;
        }
    }
    /**
     * Emit event to an order room (accessible by order owner and authorized admin).
     */
    emitToOrder(orderId, event, payload) {
        if (!this.io)
            return false;
        try {
            const cleanPayload = this.sanitizePayload(payload);
            this.io.to(`order:${orderId}`).emit(event, cleanPayload);
            return true;
        }
        catch (err) {
            logger_1.logger.warn({ err, orderId, event }, 'Failed to emit realtime event to order room');
            return false;
        }
    }
    /**
     * Emit event to a service room (accessible by service request owner and authorized admin).
     */
    emitToService(serviceId, event, payload) {
        if (!this.io)
            return false;
        try {
            const cleanPayload = this.sanitizePayload(payload);
            this.io.to(`service:${serviceId}`).emit(event, cleanPayload);
            return true;
        }
        catch (err) {
            logger_1.logger.warn({ err, serviceId, event }, 'Failed to emit realtime event to service room');
            return false;
        }
    }
    /**
     * Emit event to the admin operational room (permission-gated).
     */
    emitToAdmin(event, payload) {
        if (!this.io)
            return false;
        try {
            const cleanPayload = this.sanitizePayload(payload);
            this.io.to('admin:operational').emit(event, cleanPayload);
            return true;
        }
        catch (err) {
            logger_1.logger.warn({ err, event }, 'Failed to emit realtime event to admin room');
            return false;
        }
    }
}
exports.RealtimeService = RealtimeService;
exports.realtimeService = new RealtimeService();
//# sourceMappingURL=socket.events.js.map