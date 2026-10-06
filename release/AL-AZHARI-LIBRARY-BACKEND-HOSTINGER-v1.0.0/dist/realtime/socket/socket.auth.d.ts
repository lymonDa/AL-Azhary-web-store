import { Socket } from 'socket.io';
import { AuthenticatedPrincipal } from '../../modules/auth/types/auth.types';
export interface AuthenticatedSocket extends Socket {
    data: {
        user: AuthenticatedPrincipal;
    };
}
export declare function resetSocketHandshakeRateLimits(): void;
/**
 * Socket.IO Handshake Authentication Middleware.
 * Validates JWT access token, checks user active status, verifies session version, and enforces handshake rate limits.
 */
export declare function socketAuthMiddleware(socket: Socket, next: (err?: Error) => void): Promise<void>;
