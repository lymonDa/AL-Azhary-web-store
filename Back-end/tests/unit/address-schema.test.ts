import {
  createAddressSchema,
  updateAddressSchema,
  addressIdParamSchema,
} from '../../src/modules/addresses/schemas/address.schema';

describe('Address Zod Schemas', () => {
  const validAddressData = {
    label: 'Home',
    recipientName: 'Ahmed Mahmoud',
    recipientPhone: '01012345678',
    governorate: 'Qena',
    city: 'Qena',
    area: 'Omar Effendi',
    street: 'Al-Gamil Street',
    buildingNumber: '12A',
    floor: '3rd',
    apartment: '5',
    landmark: 'Behind Al-Azhari Mosque',
    notes: 'Please ring bell twice',
    isDefault: false,
  };

  describe('createAddressSchema', () => {
    it('validates a complete valid address payload successfully', async () => {
      const parsed = await createAddressSchema.parseAsync(validAddressData);
      expect(parsed.recipientName).toBe('Ahmed Mahmoud');
      expect(parsed.governorate).toBe('Qena');
      expect(parsed.buildingNumber).toBe('12A');
      expect(parsed.isDefault).toBe(false);
    });

    it('accepts Arabic address text correctly', async () => {
      const arabicData = {
        label: 'المنزل',
        recipientName: 'أحمد محمود عبد الله',
        recipientPhone: '+201012345678',
        governorate: 'قنا',
        city: 'قنا',
        area: 'عمر أفندي',
        street: 'شارع الجميل',
        buildingNumber: 'عمارة 14 ب',
        floor: 'أرضي',
        apartment: 'شقة 2',
        landmark: 'بجوار مسجد الأزهري',
        notes: 'يرجى الاتصال قبل الوصول',
        isDefault: true,
      };

      const parsed = await createAddressSchema.parseAsync(arabicData);
      expect(parsed.recipientName).toBe('أحمد محمود عبد الله');
      expect(parsed.governorate).toBe('قنا');
      expect(parsed.floor).toBe('أرضي');
      expect(parsed.isDefault).toBe(true);
    });

    it('accepts minimal address with only required fields', async () => {
      const minimalData = {
        recipientName: 'Sara Ali',
        recipientPhone: '01122334455',
        governorate: 'Cairo',
        city: 'Nasr City',
        area: 'Zone 1',
        street: 'Abbas El-Akkad',
        buildingNumber: '45',
      };

      const parsed = await createAddressSchema.parseAsync(minimalData);
      expect(parsed.recipientName).toBe('Sara Ali');
      expect(parsed.isDefault).toBe(false); // default value
      expect(parsed.label).toBeUndefined();
      expect(parsed.floor).toBeUndefined();
    });

    it('rejects payload missing recipientName', async () => {
      const invalid = { ...validAddressData };
      delete (invalid as Record<string, unknown>).recipientName;
      await expect(createAddressSchema.parseAsync(invalid)).rejects.toThrow();
    });

    it('rejects payload missing governorate', async () => {
      const invalid = { ...validAddressData };
      delete (invalid as Record<string, unknown>).governorate;
      await expect(createAddressSchema.parseAsync(invalid)).rejects.toThrow();
    });

    it('rejects payload missing buildingNumber', async () => {
      const invalid = { ...validAddressData };
      delete (invalid as Record<string, unknown>).buildingNumber;
      await expect(createAddressSchema.parseAsync(invalid)).rejects.toThrow();
    });

    it('rejects invalid recipient phone number', async () => {
      const invalid = { ...validAddressData, recipientPhone: 'not-a-phone' };
      await expect(createAddressSchema.parseAsync(invalid)).rejects.toThrow(
        /Invalid phone number format/,
      );
    });

    it('rejects unknown fields strictly (e.g. mapPin, latitude, shippingCost, userId)', async () => {
      const withUnknown = {
        ...validAddressData,
        latitude: 30.0444,
        longitude: 31.2357,
        mapPin: { lat: 30.0, lng: 31.0 },
        shippingCost: 50,
        userId: '507f1f77bcf86cd799439011',
      };

      await expect(createAddressSchema.parseAsync(withUnknown)).rejects.toThrow(
        /Unknown fields are not permitted/,
      );
    });
  });

  describe('updateAddressSchema', () => {
    it('validates partial update payload successfully', async () => {
      const updateData = {
        street: 'Updated Street 99',
        isDefault: true,
      };

      const parsed = await updateAddressSchema.parseAsync(updateData);
      expect(parsed.street).toBe('Updated Street 99');
      expect(parsed.isDefault).toBe(true);
    });

    it('rejects empty update payload {}', async () => {
      await expect(updateAddressSchema.parseAsync({})).rejects.toThrow(
        /At least one field must be provided for update/,
      );
    });

    it('rejects unknown fields strictly in update payload', async () => {
      await expect(
        updateAddressSchema.parseAsync({
          street: 'Valid Street',
          _id: '507f1f77bcf86cd799439011',
        }),
      ).rejects.toThrow(/Unknown fields are not permitted/);
    });

    it('rejects empty string for required field updates', async () => {
      await expect(
        updateAddressSchema.parseAsync({
          street: '   ',
        }),
      ).rejects.toThrow(/Street cannot be empty/);
    });
  });

  describe('addressIdParamSchema', () => {
    it('validates a valid 24-character hexadecimal ObjectId', async () => {
      const valid = { id: '507f1f77bcf86cd799439011' };
      const parsed = await addressIdParamSchema.parseAsync(valid);
      expect(parsed.id).toBe('507f1f77bcf86cd799439011');
    });

    it('rejects non-hex or invalid-length ID', async () => {
      await expect(addressIdParamSchema.parseAsync({ id: 'invalid-id-format' })).rejects.toThrow(
        /must be a valid 24-character hexadecimal ObjectId/,
      );
    });
  });
});
