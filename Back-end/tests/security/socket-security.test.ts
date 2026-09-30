import { Socket } from 'socket.io';
import { startTestDb, stopTestDb, clearTestDb } from '../helpers/test-db';
import { UserModel } from '../../src/modules/users/models/user.model';
import {
  socketAuthMiddleware,
  AuthenticatedSocket,
  resetSocketHandshakeRateLimits,
} from '../../src/realtime/socket/socket.auth';
import { registerSocketRooms } from '../../src/realtime/socket/socket.rooms';
import { jwtService } from '../../src/modules/auth/services/jwt.service';
import { passwordService } from '../../src/modules/auth/services/password.service';
import { rolesService } from '../../src/modules/users/services/roles.service';

describe('Phase 17 — Socket.IO Realtime Security & Room Authorization', () => {
  beforeAll(async () => {
    await startTestDb();
  });

  afterAll(async () => {
    await stopTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();
    await rolesService.ensureSystemRoles();
    resetSocketHandshakeRateLimits();
  });

  it('rejects handshake without authentication token', async () => {
    const fakeSocket = {
      handshake: { headers: {}, auth: {} },
      data: {},
    } as unknown as Socket;

    let error: Error | undefined;
    await socketAuthMiddleware(fakeSocket, (err) => {
      error = err;
    });

    expect(error).toBeDefined();
    expect(error?.message).toBe('SOCKET_AUTHENTICATION_REQUIRED');
  });

  it('rejects handshake with invalid token', async () => {
    const fakeSocket = {
      handshake: { headers: {}, auth: { token: 'invalid_jwt_token_string' } },
      data: {},
    } as unknown as Socket;

    let error: Error | undefined;
    await socketAuthMiddleware(fakeSocket, (err) => {
      error = err;
    });

    expect(error).toBeDefined();
    expect(error?.message).toBe('SOCKET_AUTHENTICATION_FAILED');
  });

  it('rejects handshake when user session has been revoked (tokenVersion mismatch)', async () => {
    const passwordHash = await passwordService.hashPassword('Pass123!');
    const user = await UserModel.create({
      name: 'Socket User',
      email: 'socket@al-azhari.com',
      phone: '01012341234',
      passwordHash,
      role: 'customer',
      status: 'active',
      refreshTokenVersion: 2, // Current DB version is 2
    });

    // Generate token with stale version 1
    const staleToken = jwtService.issueAccessToken({
      sub: user._id.toString(),
      role: user.role,
      sessionId: 'sess_1',
      tokenVersion: 1,
    });

    const fakeSocket = {
      handshake: { headers: {}, auth: { token: staleToken } },
      data: {},
    } as unknown as Socket;

    let error: Error | undefined;
    await socketAuthMiddleware(fakeSocket, (err) => {
      error = err;
    });

    expect(error).toBeDefined();
    expect(error?.message).toBe('SESSION_REVOKED');
  });

  it('blocks socket handshake flooding with rate limit', async () => {
    const fakeSocket = {
      handshake: { headers: {}, auth: {}, address: '192.168.1.100' },
      data: {},
    } as unknown as Socket;

    // Send 31 handshakes (default RATE_LIMIT_SOCKET_PER_MINUTE is 30)
    let lastError: Error | undefined;
    for (let i = 0; i < 32; i++) {
      await socketAuthMiddleware(fakeSocket, (err) => {
        lastError = err;
      });
    }

    expect(lastError).toBeDefined();
    expect(lastError?.message).toBe('RATE_LIMITED');
  });

  it('prevents customer from joining admin operational room', async () => {
    const customerUser = {
      userId: '507f1f77bcf86cd799439011',
      role: 'customer',
      sessionId: 'sess_cust',
      tokenVersion: 1,
    };

    const joinedRooms = new Set<string>();
    const emittedEvents: Array<{ event: string; data: unknown }> = [];

    let handlerPromise: Promise<unknown> | null = null;
    const mockSocket = {
      id: 'socket_123',
      data: { user: customerUser },
      join: (room: string) => joinedRooms.add(room),
      emit: (event: string, data: unknown) => emittedEvents.push({ event, data }),
      on: function (event: string, handler: Function) {
        if (event === 'join:admin_operational') {
          handlerPromise = handler({}, (_res: unknown) => {});
        }
      },
    } as unknown as AuthenticatedSocket;

    registerSocketRooms(mockSocket);
    if (handlerPromise) {
      await handlerPromise;
    }

    // Operational room must NOT be joined
    expect(joinedRooms.has('admin:operational')).toBe(false);
    expect(emittedEvents.some((e) => e.event === 'room:error')).toBe(true);
  });
});
