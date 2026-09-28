import mongoose, { Types } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { InventoryReservationModel } from '../../src/modules/inventory/models/inventory-reservation.model';
import { InventoryTransactionModel } from '../../src/modules/inventory/models/inventory-transaction.model';

describe('Inventory Schema, Invariants & Immutability Unit Tests', () => {
  let mongod: MongoMemoryServer;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri, { dbName: 'test_inventory_schema' });
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongod.stop();
  });

  beforeEach(async () => {
    await InventoryReservationModel.deleteMany({});
    await InventoryTransactionModel.deleteMany({}, { bypassLedgerImmutability: true });
  });

  describe('InventoryReservationModel', () => {
    it('creates a valid reservation document', async () => {
      const res = await InventoryReservationModel.create({
        orderId: new Types.ObjectId(),
        orderItemId: 'item_123',
        productId: new Types.ObjectId(),
        variantId: 'var_456',
        quantity: 2,
        status: 'active',
      });

      expect(res._id).toBeDefined();
      expect(res.status).toBe('active');
      expect(res.quantity).toBe(2);
    });

    it('rejects invalid reservation status', async () => {
      await expect(
        InventoryReservationModel.create({
          orderId: new Types.ObjectId(),
          orderItemId: 'item_124',
          productId: new Types.ObjectId(),
          quantity: 1,
          status: 'invalid_status',
        }),
      ).rejects.toThrow();
    });

    it('rejects non-positive reservation quantity', async () => {
      await expect(
        InventoryReservationModel.create({
          orderId: new Types.ObjectId(),
          orderItemId: 'item_125',
          productId: new Types.ObjectId(),
          quantity: 0,
          status: 'active',
        }),
      ).rejects.toThrow();
    });

    it('enforces strict schema: rejects untrusted arbitrary fields', async () => {
      await expect(
        InventoryReservationModel.create({
          orderId: new Types.ObjectId(),
          orderItemId: 'item_126',
          productId: new Types.ObjectId(),
          quantity: 1,
          status: 'active',
          arbitraryInjection: 'malicious',
        } as unknown as Record<string, unknown>),
      ).rejects.toThrow();
    });
  });

  describe('InventoryTransactionModel (Ledger)', () => {
    it('creates an append-only ledger transaction document', async () => {
      const tx = await InventoryTransactionModel.create({
        productId: new Types.ObjectId(),
        variantId: null,
        type: 'RESERVATION',
        quantityDelta: 2,
        stockTotalBefore: 10,
        stockTotalAfter: 10,
        stockReservedBefore: 0,
        stockReservedAfter: 2,
        sourceType: 'order',
        sourceId: 'ord_999',
        actorRole: 'admin',
        reason: 'Order reservation',
      });

      expect(tx._id).toBeDefined();
      expect(tx.type).toBe('RESERVATION');
      expect(tx.quantityDelta).toBe(2);
    });

    it('rejects update operations on ledger records (immutability hook)', async () => {
      const tx = await InventoryTransactionModel.create({
        productId: new Types.ObjectId(),
        variantId: null,
        type: 'RESERVATION',
        quantityDelta: 1,
        stockTotalBefore: 5,
        stockTotalAfter: 5,
        stockReservedBefore: 0,
        stockReservedAfter: 1,
        sourceType: 'order',
        sourceId: 'ord_100',
        actorRole: 'admin',
        reason: 'Order reservation',
      });

      await expect(
        InventoryTransactionModel.updateOne({ _id: tx._id }, { $set: { reason: 'Tampered' } }),
      ).rejects.toThrow('Inventory ledger records are strictly append-only');

      await expect(
        InventoryTransactionModel.findOneAndUpdate({ _id: tx._id }, { $set: { quantityDelta: 99 } }),
      ).rejects.toThrow('Inventory ledger records are strictly append-only');
    });

    it('rejects delete operations on ledger records (immutability hook)', async () => {
      const tx = await InventoryTransactionModel.create({
        productId: new Types.ObjectId(),
        variantId: null,
        type: 'ADJUSTMENT',
        quantityDelta: 5,
        stockTotalBefore: 10,
        stockTotalAfter: 15,
        stockReservedBefore: 0,
        stockReservedAfter: 0,
        sourceType: 'manual',
        sourceId: 'adj_001',
        actorRole: 'admin',
        reason: 'Restock',
      });

      await expect(
        InventoryTransactionModel.deleteOne({ _id: tx._id }),
      ).rejects.toThrow('Inventory ledger records are strictly append-only');

      await expect(
        InventoryTransactionModel.findOneAndDelete({ _id: tx._id }),
      ).rejects.toThrow('Inventory ledger records are strictly append-only');
    });
  });
});
