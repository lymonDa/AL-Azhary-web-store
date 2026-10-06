import { Server as SocketIOServer } from 'socket.io';
export declare const SocketEvents: {
    readonly NOTIFICATION_CREATED: "notification.created";
    readonly ORDER_STATUS_CHANGED: "order.status_changed";
    readonly PAYMENT_PROOF_SUBMITTED: "payment.proof_submitted";
    readonly SERVICE_REQUEST_CREATED: "service.request_created";
    readonly SERVICE_QUOTATION_SENT: "service.quotation_sent";
    readonly ADMIN_QUEUE_CHANGED: "admin.queue_changed";
};
export type SocketEventName = (typeof SocketEvents)[keyof typeof SocketEvents];
export declare class RealtimeService {
    private io;
    setServer(io: SocketIOServer): void;
    getServer(): SocketIOServer | null;
    /**
     * Sanitizes payload to ensure only minimal, safe display data is emitted.
     * Never transmits passwords, tokens, payment proof URLs, or sensitive PII.
     */
    private sanitizePayload;
    /**
     * Emit event to a specific authenticated user's room.
     */
    emitToUser(userId: string, event: SocketEventName | string, payload: Record<string, unknown>): boolean;
    /**
     * Emit event to an order room (accessible by order owner and authorized admin).
     */
    emitToOrder(orderId: string, event: SocketEventName | string, payload: Record<string, unknown>): boolean;
    /**
     * Emit event to a service room (accessible by service request owner and authorized admin).
     */
    emitToService(serviceId: string, event: SocketEventName | string, payload: Record<string, unknown>): boolean;
    /**
     * Emit event to the admin operational room (permission-gated).
     */
    emitToAdmin(event: SocketEventName | string, payload: Record<string, unknown>): boolean;
}
export declare const realtimeService: RealtimeService;
