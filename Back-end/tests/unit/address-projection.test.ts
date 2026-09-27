import { Types } from 'mongoose';
import {
  toSafeAddress,
  toAddressSnapshot,
} from '../../src/modules/addresses/utils/address.projection';

describe('Address Projection & Snapshot Utilities', () => {
  const sampleDoc = {
    _id: new Types.ObjectId('507f1f77bcf86cd799439011'),
    userId: new Types.ObjectId('507f1f77bcf86cd799439022'),
    label: 'Home',
    recipientName: 'Omar Khaled',
    recipientPhone: '+201012345678',
    governorate: 'Qena',
    city: 'Qena',
    area: 'Omar Effendi',
    street: 'Al-Gamil Street',
    buildingNumber: '12',
    floor: '2',
    apartment: '4',
    landmark: 'Near pharmacy',
    notes: 'Call before delivery',
    isDefault: true,
    createdAt: new Date('2026-09-27T10:00:00Z'),
    updatedAt: new Date('2026-09-27T10:00:00Z'),
    __v: 0,
  };

  describe('toSafeAddress', () => {
    it('projects document into SafeAddress shape with string id', () => {
      const safe = toSafeAddress(sampleDoc);

      expect(safe.id).toBe('507f1f77bcf86cd799439011');
      expect(safe.recipientName).toBe('Omar Khaled');
      expect(safe.recipientPhone).toBe('+201012345678');
      expect(safe.governorate).toBe('Qena');
      expect(safe.city).toBe('Qena');
      expect(safe.area).toBe('Omar Effendi');
      expect(safe.street).toBe('Al-Gamil Street');
      expect(safe.buildingNumber).toBe('12');
      expect(safe.floor).toBe('2');
      expect(safe.apartment).toBe('4');
      expect(safe.landmark).toBe('Near pharmacy');
      expect(safe.notes).toBe('Call before delivery');
      expect(safe.isDefault).toBe(true);

      // Verifies internal metadata is excluded
      expect((safe as unknown as Record<string, unknown>)._id).toBeUndefined();
      expect((safe as unknown as Record<string, unknown>).__v).toBeUndefined();
      expect((safe as unknown as Record<string, unknown>).userId).toBeUndefined();
    });
  });

  describe('toAddressSnapshot', () => {
    it('creates pure, deterministic snapshot without mutation or MongoDB dependency', () => {
      const snapshot = toAddressSnapshot(toSafeAddress(sampleDoc));

      expect(snapshot).toEqual({
        governorate: 'Qena',
        city: 'Qena',
        area: 'Omar Effendi',
        street: 'Al-Gamil Street',
        buildingNumber: '12',
        floor: '2',
        apartment: '4',
        landmark: 'Near pharmacy',
        recipientName: 'Omar Khaled',
        recipientPhone: '+201012345678',
        notes: 'Call before delivery',
      });

      // Does not contain id, userId, or isDefault (which are account-level fields, not delivery fulfillment fields)
      expect((snapshot as unknown as Record<string, unknown>).id).toBeUndefined();
      expect((snapshot as unknown as Record<string, unknown>).userId).toBeUndefined();
      expect((snapshot as unknown as Record<string, unknown>).isDefault).toBeUndefined();
    });
  });
});
