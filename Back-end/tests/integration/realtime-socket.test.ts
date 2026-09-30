import { Types } from 'mongoose';
import { Socket, Server as SocketIOServer } from 'socket.io';
import { startTestDb, stopTestDb, clearTestDb } from '../helpers/test-db';
import { UserModel } from '../../src/modules/users/models/user.model';
import { OrderModel } from '../../src/modules/orders/models/order.model';
import { ServiceRequestModel } from '../../src/modules/services/models/service-request.model';
import { ServiceCategoryModel } from '../../src/modules/services/models/service-category.model';
import { jwtService } from '../../src/modules/auth/services/jwt.service';
import { socketAuthMiddleware, AuthenticatedSocket } from '../../src/realtime/socket/socket.auth';
import { registerSocketRooms, RoomAckCallback } from '../../src/realtime/socket/socket.rooms';
import { realtimeService, SocketEvents } from '../../src/realtime/events/socket.events';
import { rolesService } from '../../src/modules/users/services/roles.service';

describe('Phase 13 Socket.IO Realtime & Room Authorization Integration Tests', () => {
  let customer1Id: Types.ObjectId;
  let customer2Id: Types.ObjectId;
  let adminId: Types.ObjectId;
  let suspendedUserId: Types.ObjectId;

  let customer1Token: string;
  let customer2Token: string;
  let adminToken: string;
  let suspendedUserToken: string;

  let testOrderId: Types.ObjectId;
  let testOrderRef: string;
  let testServiceId: Types.ObjectId;
  let testServiceRef: string;

  beforeAll(async () => {
    await startTestDb();
  });

  afterAll(async () => {
    await stopTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();
    await rolesService.ensureSystemRoles();

    // Customer 1
    const user1 = await UserModel.create({
      email: 'cust1@example.com',
      phone: '+201011111111',
      name: 'Customer One',
      passwordHash: 'argon_hash',
      role: 'customer',
      status: 'active',
      emailVerifiedAt: new Date(),
      refreshTokenVersion: 1,
    });
    customer1Id = user1._id;
    customer1Token = jwtService.issueAccessToken({
      sub: customer1Id.toString(),
      role: 'customer',
      sessionId: 'sess-1',
      tokenVersion: 1,
    });

    // Customer 2
    const user2 = await UserModel.create({
      email: 'cust2@example.com',
      phone: '+201022222222',
      name: 'Customer Two',
      passwordHash: 'argon_hash',
      role: 'customer',
      status: 'active',
      emailVerifiedAt: new Date(),
      refreshTokenVersion: 1,
    });
    customer2Id = user2._id;
    customer2Token = jwtService.issueAccessToken({
      sub: customer2Id.toString(),
      role: 'customer',
      sessionId: 'sess-2',
      tokenVersion: 1,
    });

    // Admin
    const admin = await UserModel.create({
      email: 'admin@example.com',
      phone: '+201033333333',
      name: 'Store Admin',
      passwordHash: 'argon_hash',
      role: 'admin',
      status: 'active',
      emailVerifiedAt: new Date(),
      refreshTokenVersion: 1,
    });
    adminId = admin._id;
    adminToken = jwtService.issueAccessToken({
      sub: adminId.toString(),
      role: 'admin',
      sessionId: 'sess-admin',
      tokenVersion: 1,
    });

    // Suspended User
    const suspended = await UserModel.create({
      email: 'suspended@example.com',
      phone: '+201044444444',
      name: 'Suspended User',
      passwordHash: 'argon_hash',
      role: 'customer',
      status: 'suspended',
      emailVerifiedAt: new Date(),
      refreshTokenVersion: 1,
    });
    suspendedUserId = suspended._id;
    suspendedUserToken = jwtService.issueAccessToken({
      sub: suspendedUserId.toString(),
      role: 'customer',
      sessionId: 'sess-suspended',
      tokenVersion: 1,
    });

    // Order belonging to Customer 1
    testOrderRef = 'ORD-20260930-111111';
    const order = await OrderModel.create({
      reference: testOrderRef,
      customerId: customer1Id,
      customerSnapshot: {
        name: 'Customer One',
        email: 'cust1@example.com',
        phone: '+201011111111',
      },
      totals: {
        productSubtotalMinor: 10000,
        shippingEstimateMinor: 0,
        shippingFinalMinor: 0,
        discountMinor: 0,
        totalMinor: 10000,
        currency: 'EGP',
      },
      status: 'pending_review',
      paymentMethodKey: 'cod',
      fulfillment: {
        method: 'delivery',
        shippingStatus: 'pending',
        addressSnapshot: {
          governorate: 'Cairo',
          city: 'Cairo',
          street: 'Test St',
        },
      },
      items: [
        {
          productId: new Types.ObjectId(),
          variantId: null,
          nameSnapshot: { ar: 'كتاب تجريبي' },
          unitPriceMinor: 10000,
          lineTotalMinor: 10000,
          quantity: 1,
          availabilityAtSubmission: 'in_stock',
          stockItemKey: 'item-1',
        },
      ],
      submittedAt: new Date(),
      version: 1,
      idempotencyKey: 'idemp-1',
    });
    testOrderId = order._id;

    // Service category & service request belonging to Customer 1
    const category = await ServiceCategoryModel.create({
      name: { ar: 'خدمات طباعة', en: 'Printing Services' },
      slug: 'printing-services',
      description: { ar: 'طباعة' },
      kind: 'printing',
      formVersion: 1,
      fields: [],
      isActive: true,
    });

    testServiceRef = 'SRV-20260930-111111';
    const srv = await ServiceRequestModel.create({
      reference: testServiceRef,
      serviceCategoryId: category._id,
      serviceCategorySnapshot: {
        slug: category.slug,
        name: category.name,
        formVersion: 1,
      },
      customerId: customer1Id,
      customerSnapshot: {
        name: 'Customer One',
        phone: '+201011111111',
        email: 'cust1@example.com',
      },
      description: 'Test printing',
      submittedFields: { pages: 50 },
      status: 'submitted',
      statusHistory: [{ status: 'submitted', changedAt: new Date() }],
      version: 1,
    });
    testServiceId = srv._id;
  });

  describe('Socket.IO Handshake Authentication', () => {
    function createMockSocket(auth?: Record<string, unknown>, headers?: Record<string, unknown>): Socket {
      return {
        handshake: {
          auth: auth ?? {},
          headers: headers ?? {},
        },
        data: {},
      } as unknown as Socket;
    }

    it('authenticates valid handshake using auth.token', async () => {
      const mockSocket = createMockSocket({ token: customer1Token });
      let nextError: Error | undefined;

      await socketAuthMiddleware(mockSocket, (err) => {
        nextError = err;
      });

      expect(nextError).toBeUndefined();
      expect((mockSocket as AuthenticatedSocket).data.user).toBeDefined();
      expect((mockSocket as AuthenticatedSocket).data.user.userId).toBe(customer1Id.toString());
      expect((mockSocket as AuthenticatedSocket).data.user.role).toBe('customer');
    });

    it('authenticates Customer 2 successfully with customer2Token', async () => {
      const mockSocket = createMockSocket({ token: customer2Token });
      let nextError: Error | undefined;

      await socketAuthMiddleware(mockSocket, (err) => {
        nextError = err;
      });

      expect(nextError).toBeUndefined();
      expect((mockSocket as AuthenticatedSocket).data.user.userId).toBe(customer2Id.toString());
    });

    it('authenticates valid handshake using Authorization header with Bearer scheme', async () => {
      const mockSocket = createMockSocket({}, { authorization: `Bearer ${adminToken}` });
      let nextError: Error | undefined;

      await socketAuthMiddleware(mockSocket, (err) => {
        nextError = err;
      });

      expect(nextError).toBeUndefined();
      expect((mockSocket as AuthenticatedSocket).data.user.userId).toBe(adminId.toString());
      expect((mockSocket as AuthenticatedSocket).data.user.role).toBe('admin');
    });

    it('rejects connection when no token is supplied', async () => {
      const mockSocket = createMockSocket();
      let nextError: Error | undefined;

      await socketAuthMiddleware(mockSocket, (err) => {
        nextError = err;
      });

      expect(nextError).toBeDefined();
      expect(nextError?.message).toBe('SOCKET_AUTHENTICATION_REQUIRED');
    });

    it('rejects connection with forged/invalid token', async () => {
      const mockSocket = createMockSocket({ token: 'invalid.jwt.token' });
      let nextError: Error | undefined;

      await socketAuthMiddleware(mockSocket, (err) => {
        nextError = err;
      });

      expect(nextError).toBeDefined();
      expect(nextError?.message).toBe('SOCKET_AUTHENTICATION_FAILED');
    });

    it('rejects connection if user account is suspended', async () => {
      const mockSocket = createMockSocket({ token: suspendedUserToken });
      let nextError: Error | undefined;

      await socketAuthMiddleware(mockSocket, (err) => {
        nextError = err;
      });

      expect(nextError).toBeDefined();
      expect(nextError?.message).toBe('SOCKET_AUTHENTICATION_FAILED');
    });

    it('rejects connection if session was revoked (tokenVersion mismatch)', async () => {
      // Invalidate customer 1's refresh token version
      await UserModel.findByIdAndUpdate(customer1Id, { $inc: { refreshTokenVersion: 1 } });

      const mockSocket = createMockSocket({ token: customer1Token });
      let nextError: Error | undefined;

      await socketAuthMiddleware(mockSocket, (err) => {
        nextError = err;
      });

      expect(nextError).toBeDefined();
      expect(nextError?.message).toBe('SESSION_REVOKED');
    });
  });

  describe('Socket.IO Room Authorization', () => {
    function createMockAuthenticatedSocket(userId: string, role: string) {
      const joinedRooms = new Set<string>();
      const listeners: Record<string, (data: unknown, ack?: RoomAckCallback) => Promise<void>> = {};
      const emittedEvents: Array<{ event: string; data: unknown }> = [];

      const socket = {
        id: `mock-sock-${userId}`,
        data: {
          user: {
            userId,
            role,
            sessionId: 'sess-test',
            tokenVersion: 1,
          },
        },
        join: (room: string) => {
          joinedRooms.add(room);
        },
        leave: (room: string) => {
          joinedRooms.delete(room);
        },
        on: (event: string, handler: (data: unknown, ack?: RoomAckCallback) => Promise<void>) => {
          listeners[event] = handler;
        },
        emit: (event: string, data: unknown) => {
          emittedEvents.push({ event, data });
        },
      } as unknown as AuthenticatedSocket;

      return { socket, joinedRooms, listeners, emittedEvents };
    }

    it('automatically joins personal user room on registration', () => {
      const { socket, joinedRooms } = createMockAuthenticatedSocket(customer1Id.toString(), 'customer');
      registerSocketRooms(socket);

      expect(joinedRooms.has(`user:${customer1Id.toString()}`)).toBe(true);
    });

    it('authorizes order owner to join order room by ID or reference', async () => {
      const { socket, joinedRooms, listeners } = createMockAuthenticatedSocket(
        customer1Id.toString(),
        'customer',
      );
      registerSocketRooms(socket);

      // Join by ObjectId
      let ackResult: { success: boolean; room?: string; error?: string } | undefined;
      await listeners['join:order']({ orderId: testOrderId.toString() }, (res) => {
        ackResult = res;
      });

      expect(ackResult?.success).toBe(true);
      expect(ackResult?.room).toBe(`order:${testOrderId.toString()}`);
      expect(joinedRooms.has(`order:${testOrderId.toString()}`)).toBe(true);

      // Join by Reference
      await listeners['join:order']({ orderId: testOrderRef }, (res) => {
        ackResult = res;
      });
      expect(ackResult?.success).toBe(true);
    });

    it('prevents non-owner customer from joining another customer order room without leaking existence', async () => {
      const { socket, joinedRooms, listeners, emittedEvents } = createMockAuthenticatedSocket(
        customer2Id.toString(),
        'customer',
      );
      registerSocketRooms(socket);

      let ackResult: { success: boolean; room?: string; error?: string } | undefined;
      await listeners['join:order']({ orderId: testOrderId.toString() }, (res) => {
        ackResult = res;
      });

      expect(ackResult?.success).toBe(false);
      expect(ackResult?.error).toBe('FORBIDDEN_ROOM');
      expect(joinedRooms.has(`order:${testOrderId.toString()}`)).toBe(false);
      expect(emittedEvents.some((e) => e.event === 'room:error')).toBe(true);
    });

    it('allows Admin with orders.read permission to join any order room', async () => {
      const { socket, joinedRooms, listeners } = createMockAuthenticatedSocket(
        adminId.toString(),
        'admin',
      );
      registerSocketRooms(socket);

      let ackResult: { success: boolean; room?: string; error?: string } | undefined;
      await listeners['join:order']({ orderId: testOrderId.toString() }, (res) => {
        ackResult = res;
      });

      expect(ackResult?.success).toBe(true);
      expect(joinedRooms.has(`order:${testOrderId.toString()}`)).toBe(true);
    });

    it('authorizes service request owner and rejects non-owner for service room', async () => {
      // Owner
      const { socket: ownerSocket, joinedRooms: ownerRooms, listeners: ownerListeners } =
        createMockAuthenticatedSocket(customer1Id.toString(), 'customer');
      registerSocketRooms(ownerSocket);

      let ackResult: { success: boolean; room?: string; error?: string } | undefined;
      await ownerListeners['join:service']({ serviceId: testServiceId.toString() }, (res) => {
        ackResult = res;
      });
      expect(ackResult?.success).toBe(true);
      expect(ownerRooms.has(`service:${testServiceId.toString()}`)).toBe(true);

      // Non-owner
      const { socket: nonOwnerSocket, joinedRooms: nonOwnerRooms, listeners: nonOwnerListeners } =
        createMockAuthenticatedSocket(customer2Id.toString(), 'customer');
      registerSocketRooms(nonOwnerSocket);

      await nonOwnerListeners['join:service']({ serviceId: testServiceId.toString() }, (res) => {
        ackResult = res;
      });
      expect(ackResult?.success).toBe(false);
      expect(ackResult?.error).toBe('FORBIDDEN_ROOM');
      expect(nonOwnerRooms.has(`service:${testServiceId.toString()}`)).toBe(false);
    });

    it('authorizes Admin/Owner to join admin:operational room and rejects customers', async () => {
      // Admin
      const { socket: adminSocket, joinedRooms: adminRooms, listeners: adminListeners } =
        createMockAuthenticatedSocket(adminId.toString(), 'admin');
      registerSocketRooms(adminSocket);

      let ackAdmin: { success: boolean; room?: string; error?: string } | undefined;
      await adminListeners['join:admin_operational']({}, (res) => {
        ackAdmin = res;
      });
      expect(ackAdmin?.success).toBe(true);
      expect(adminRooms.has('admin:operational')).toBe(true);

      // Customer
      const { socket: custSocket, joinedRooms: custRooms, listeners: custListeners } =
        createMockAuthenticatedSocket(customer1Id.toString(), 'customer');
      registerSocketRooms(custSocket);

      let ackCust: { success: boolean; room?: string; error?: string } | undefined;
      await custListeners['join:admin_operational']({}, (res) => {
        ackCust = res;
      });
      expect(ackCust?.success).toBe(false);
      expect(ackCust?.error).toBe('FORBIDDEN_ROOM');
      expect(custRooms.has('admin:operational')).toBe(false);
    });
  });

  describe('Realtime Events and Payload Sanitization', () => {
    it('sanitizes sensitive data like passwords, tokens, and proof URLs from emitted payloads', () => {
      const emitted: Array<{ room: string; event: string; payload: Record<string, unknown> }> = [];

      const mockIo = {
        to: (room: string) => ({
          emit: (event: string, payload: Record<string, unknown>) => {
            emitted.push({ room, event, payload });
          },
        }),
      };

      realtimeService.setServer(mockIo as unknown as SocketIOServer);

      realtimeService.emitToUser('user-123', SocketEvents.ORDER_STATUS_CHANGED, {
        orderReference: 'ORD-123',
        status: 'confirmed',
        password: 'leak_password',
        accessToken: 'leak_jwt',
        proofUrl: 'https://leak.url/proof.jpg',
      });

      expect(emitted).toHaveLength(1);
      const data = emitted[0];
      expect(data.room).toBe('user:user-123');
      expect(data.event).toBe(SocketEvents.ORDER_STATUS_CHANGED);
      expect(data.payload.orderReference).toBe('ORD-123');
      expect(data.payload.password).toBeUndefined();
      expect(data.payload.accessToken).toBeUndefined();
      expect(data.payload.proofUrl).toBeUndefined();
    });

    it('gracefully handles emissions when Socket.IO server is not attached without throwing', () => {
      realtimeService.setServer(null as unknown as SocketIOServer);

      expect(() => {
        const res = realtimeService.emitToUser('u-1', SocketEvents.NOTIFICATION_CREATED, { id: '1' });
        expect(res).toBe(false);
      }).not.toThrow();
    });
  });
});
