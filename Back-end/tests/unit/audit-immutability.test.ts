import mongoose from 'mongoose';
import { startTestDb, stopTestDb, clearTestDb } from '../helpers/test-db';
import { auditService } from '../../src/modules/audit/services/audit.service';
import { AuditLogModel } from '../../src/modules/audit/models/audit-log.model';
import { withTransaction } from '../../src/database/transaction';

describe('Audit Immutability & Transactional Integrity Unit Tests', () => {
  beforeAll(async () => {
    await startTestDb();
  });

  afterAll(async () => {
    await stopTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();
  });

  describe('Model-Level Immutability Hooks', () => {
    it('prevents updateOne operations on audit logs', async () => {
      await auditService.record({
        action: 'order.accepted',
        entityType: 'Order',
        entityId: 'ORD-IMMUTABLE-1',
      });

      await expect(
        AuditLogModel.updateOne(
          { entityId: 'ORD-IMMUTABLE-1' },
          { $set: { action: 'hacked.action' } },
        ).exec(),
      ).rejects.toThrow('Audit logs are immutable and cannot be updated');
    });

    it('prevents updateMany operations on audit logs', async () => {
      await expect(
        AuditLogModel.updateMany({}, { $set: { action: 'tampered' } }).exec(),
      ).rejects.toThrow('Audit logs are immutable and cannot be updated');
    });

    it('prevents findOneAndUpdate operations on audit logs', async () => {
      await expect(
        AuditLogModel.findOneAndUpdate(
          { entityId: 'ORD-IMMUTABLE-1' },
          { $set: { action: 'tampered' } },
        ).exec(),
      ).rejects.toThrow('Audit logs are immutable and cannot be updated');
    });

    it('prevents deleteOne operations on audit logs', async () => {
      await expect(
        AuditLogModel.deleteOne({ entityId: 'ORD-IMMUTABLE-1' }).exec(),
      ).rejects.toThrow('Audit logs are immutable and cannot be deleted');
    });

    it('prevents deleteMany operations on audit logs', async () => {
      await expect(
        AuditLogModel.deleteMany({}).exec(),
      ).rejects.toThrow('Audit logs are immutable and cannot be deleted');
    });

    it('prevents findOneAndDelete operations on audit logs', async () => {
      await expect(
        AuditLogModel.findOneAndDelete({ entityId: 'ORD-IMMUTABLE-1' }).exec(),
      ).rejects.toThrow('Audit logs are immutable and cannot be deleted');
    });
  });

  describe('Deduplication & Idempotency', () => {
    it('prevents duplicate audit records when same dedupeKey is used on retry', async () => {
      const dedupeKey = 'order:accepted:ORD-RETRY-1:v2';

      await auditService.record({
        action: 'order.accepted',
        entityType: 'Order',
        entityId: 'ORD-RETRY-1',
        dedupeKey,
      });

      // Simulated retry
      await auditService.record({
        action: 'order.accepted',
        entityType: 'Order',
        entityId: 'ORD-RETRY-1',
        dedupeKey,
      });

      // Verify only 1 audit record exists in the collection
      const count = await AuditLogModel.countDocuments({ dedupeKey }).exec();
      expect(count).toBe(1);
    });

    it('records multiple legitimate transitions with different dedupeKeys', async () => {
      await auditService.record({
        action: 'order.accepted',
        entityType: 'Order',
        entityId: 'ORD-MULTI-1',
        dedupeKey: 'order:accepted:ORD-MULTI-1:v2',
      });

      await auditService.record({
        action: 'order.status_updated',
        entityType: 'Order',
        entityId: 'ORD-MULTI-1',
        dedupeKey: 'order:preparing:ORD-MULTI-1:v3',
      });

      const count = await AuditLogModel.countDocuments({ entityId: 'ORD-MULTI-1' }).exec();
      expect(count).toBe(2);
    });
  });

  describe('Transactional Atomicity', () => {
    it('persists audit log if MongoDB transaction commits successfully', async () => {
      await withTransaction(async (session: mongoose.ClientSession) => {
        await auditService.record(
          {
            action: 'payment.confirmed',
            entityType: 'Payment',
            entityId: 'PAY-TX-SUCCESS',
          },
          { session },
        );
      });

      const found = await AuditLogModel.findOne({ entityId: 'PAY-TX-SUCCESS' }).lean().exec();
      expect(found).not.toBeNull();
    });

    it('aborts audit log persistence when MongoDB transaction is aborted', async () => {
      try {
        await withTransaction(async (session: mongoose.ClientSession) => {
          await auditService.record(
            {
              action: 'payment.confirmed',
              entityType: 'Payment',
              entityId: 'PAY-TX-FAIL',
            },
            { session },
          );

          // Simulate an error inside transaction
          throw new Error('Transaction aborted intentionally');
        });
      } catch {
        // Expected error
      }

      const found = await AuditLogModel.findOne({ entityId: 'PAY-TX-FAIL' }).lean().exec();
      expect(found).toBeNull();
    });
  });
});
