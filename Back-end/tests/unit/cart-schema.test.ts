import mongoose, { Types } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { CartModel } from '../../src/modules/carts/models/cart.model';

describe('Cart Model & Schema Integrity', () => {
  let mongod: MongoMemoryServer;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri, { dbName: 'test_cart_schema' });
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongod.stop();
  });

  beforeEach(async () => {
    await CartModel.deleteMany({});
  });

  it('creates a valid registered customer cart with default version 1', async () => {
    const userId = new Types.ObjectId();
    const productId = new Types.ObjectId();

    const cart = await CartModel.create({
      ownerType: 'user',
      userId,
      items: [
        {
          productId,
          variantId: 'edition-2026',
          quantity: 2,
          unitPriceMinor: 18500,
          productNameSnapshot: { ar: 'كتاب الفقه' },
          imageSnapshot: 'products/book-1',
          addedAt: new Date(),
        },
      ],
      currency: 'EGP',
    });

    expect(cart._id).toBeDefined();
    expect(cart.ownerType).toBe('user');
    expect(cart.userId?.toString()).toBe(userId.toString());
    expect(cart.sessionId).toBeNull();
    expect(cart.version).toBe(1);
    expect(cart.currency).toBe('EGP');
    expect(cart.items).toHaveLength(1);
    expect(cart.items[0]._id).toBeDefined();
    expect(cart.items[0].productId.toString()).toBe(productId.toString());
    expect(cart.items[0].variantId).toBe('edition-2026');
    expect(cart.items[0].quantity).toBe(2);
    expect(cart.items[0].unitPriceMinor).toBe(18500);
    expect(cart.items[0].productNameSnapshot.ar).toBe('كتاب الفقه');
    expect(cart.items[0].imageSnapshot).toBe('products/book-1');
  });

  it('creates a valid guest cart with sessionId and future expiresAt date', async () => {
    const sessionId = 'guest-session-unpredictable-12345';
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const cart = await CartModel.create({
      ownerType: 'guest',
      sessionId,
      items: [],
      expiresAt,
    });

    expect(cart.ownerType).toBe('guest');
    expect(cart.sessionId).toBe(sessionId);
    expect(cart.userId).toBeNull();
    expect(cart.expiresAt).toEqual(expiresAt);
    expect(cart.version).toBe(1);
  });

  it('rejects items with invalid quantity (< 1 or non-integer)', async () => {
    const productId = new Types.ObjectId();

    await expect(
      CartModel.create({
        ownerType: 'guest',
        sessionId: 'session-zero-qty-12345',
        items: [
          {
            productId,
            quantity: 0,
            unitPriceMinor: 5000,
            productNameSnapshot: { ar: 'كتاب' },
          },
        ],
      }),
    ).rejects.toThrow();

    await expect(
      CartModel.create({
        ownerType: 'guest',
        sessionId: 'session-float-qty-12345',
        items: [
          {
            productId,
            quantity: 1.5,
            unitPriceMinor: 5000,
            productNameSnapshot: { ar: 'كتاب' },
          },
        ],
      }),
    ).rejects.toThrow();
  });

  it('rejects negative or fractional unitPriceMinor', async () => {
    const productId = new Types.ObjectId();

    await expect(
      CartModel.create({
        ownerType: 'guest',
        sessionId: 'session-neg-price-12345',
        items: [
          {
            productId,
            quantity: 1,
            unitPriceMinor: -100,
            productNameSnapshot: { ar: 'كتاب' },
          },
        ],
      }),
    ).rejects.toThrow();

    await expect(
      CartModel.create({
        ownerType: 'guest',
        sessionId: 'session-float-price-12345',
        items: [
          {
            productId,
            quantity: 1,
            unitPriceMinor: 99.99,
            productNameSnapshot: { ar: 'كتاب' },
          },
        ],
      }),
    ).rejects.toThrow();
  });

  it('rejects unauthorized extra fields due to strict schema mode', async () => {
    await expect(
      CartModel.create({
        ownerType: 'guest',
        sessionId: 'session-strict-check-123',
        arbitraryField: 'not-allowed',
      } as unknown as Record<string, unknown>),
    ).rejects.toThrow();
  });

  it('enforces single active cart per registered user via unique index', async () => {
    await CartModel.syncIndexes();
    const userId = new Types.ObjectId();

    await CartModel.create({
      ownerType: 'user',
      userId,
      items: [],
    });

    await expect(
      CartModel.create({
        ownerType: 'user',
        userId,
        items: [],
      }),
    ).rejects.toThrow(/duplicate key|E11000/);
  });

  it('enforces single active cart per guest session via unique index', async () => {
    await CartModel.syncIndexes();
    const sessionId = 'unique-session-check-123456';

    await CartModel.create({
      ownerType: 'guest',
      sessionId,
      items: [],
    });

    await expect(
      CartModel.create({
        ownerType: 'guest',
        sessionId,
        items: [],
      }),
    ).rejects.toThrow(/duplicate key|E11000/);
  });
});
