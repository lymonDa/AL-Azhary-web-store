import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { ShippingRuleModel } from '../../src/modules/shipping/models/shipping-rule.model';
import { ShippingService } from '../../src/modules/shipping/services/shipping.service';
import { BusinessRuleViolationError } from '../../src/common/errors';
import { ErrorCodes } from '../../src/common/errors/errorCodes';

describe('Shipping Service & Rule Hierarchy', () => {
  let mongod: MongoMemoryServer;
  let service: ShippingService;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri, { dbName: 'test_shipping_service' });
    service = new ShippingService();
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongod.stop();
  });

  beforeEach(async () => {
    await ShippingRuleModel.deleteMany({});
  });

  it('returns 0 EGP and library location for pickup fulfillment', async () => {
    const result = await service.estimateShipping({
      method: 'pickup',
    });

    expect(result.costMinor).toBe(0);
    expect(result.currency).toBe('EGP');
    expect(result.serviceable).toBe(true);
    expect(result.scope).toBe('pickup');
    expect(result.pickupLocation).toBeDefined();
    expect(result.pickupLocation?.ar).toContain('مكتبة الأزهري');
  });

  it('resolves delivery hierarchy correctly: area > city > governorate > default', async () => {
    // 1. Default fallback rule
    await ShippingRuleModel.create({
      governorate: null,
      city: null,
      area: null,
      costMinor: 7000,
      priority: 0,
      isActive: true,
      serviceable: true,
      label: { ar: 'افتراضي لكل مصر' },
    });

    // 2. Governorate rule
    await ShippingRuleModel.create({
      governorate: 'Qena',
      city: null,
      area: null,
      costMinor: 4000,
      priority: 0,
      isActive: true,
      serviceable: true,
      label: { ar: 'محافظة قنا' },
    });

    // 3. City rule
    await ShippingRuleModel.create({
      governorate: 'Qena',
      city: 'Qena City',
      area: null,
      costMinor: 3000,
      priority: 0,
      isActive: true,
      serviceable: true,
      label: { ar: 'مدينة قنا' },
    });

    // 4. Area rule
    await ShippingRuleModel.create({
      governorate: 'Qena',
      city: 'Qena City',
      area: 'Al-Mahatta',
      costMinor: 1500,
      priority: 0,
      isActive: true,
      serviceable: true,
      label: { ar: 'منطقة المحطة بقنا' },
    });

    // Test Area match
    const areaResult = await service.estimateShipping({
      method: 'delivery',
      governorate: 'Qena',
      city: 'Qena City',
      area: 'Al-Mahatta',
    });
    expect(areaResult.costMinor).toBe(1500);
    expect(areaResult.scope).toBe('area');

    // Test City match (different area)
    const cityResult = await service.estimateShipping({
      method: 'delivery',
      governorate: 'Qena',
      city: 'Qena City',
      area: 'Different Area',
    });
    expect(cityResult.costMinor).toBe(3000);
    expect(cityResult.scope).toBe('city');

    // Test Governorate match (different city)
    const govResult = await service.estimateShipping({
      method: 'delivery',
      governorate: 'Qena',
      city: 'Nag Hammadi',
    });
    expect(govResult.costMinor).toBe(4000);
    expect(govResult.scope).toBe('governorate');

    // Test Default fallback (different governorate)
    const defaultResult = await service.estimateShipping({
      method: 'delivery',
      governorate: 'Cairo',
      city: 'Nasr City',
    });
    expect(defaultResult.costMinor).toBe(7000);
    expect(defaultResult.scope).toBe('default');
  });

  it('selects higher priority rule within the same scope', async () => {
    await ShippingRuleModel.create({
      governorate: 'Alexandria',
      costMinor: 6000,
      priority: 5,
      isActive: true,
      serviceable: true,
    });

    await ShippingRuleModel.create({
      governorate: 'Alexandria',
      costMinor: 4500, // special promotion rule
      priority: 10, // higher priority
      isActive: true,
      serviceable: true,
    });

    const result = await service.estimateShipping({
      method: 'delivery',
      governorate: 'Alexandria',
    });

    expect(result.costMinor).toBe(4500);
  });

  it('throws SHIPPING_CONFIGURATION_UNAVAILABLE when no active rule matches', async () => {
    // Only inactive rule exists
    await ShippingRuleModel.create({
      governorate: 'Aswan',
      costMinor: 5000,
      isActive: false,
      serviceable: true,
    });

    await expect(
      service.estimateShipping({
        method: 'delivery',
        governorate: 'Aswan',
      }),
    ).rejects.toThrow(BusinessRuleViolationError);

    try {
      await service.estimateShipping({
        method: 'delivery',
        governorate: 'Aswan',
      });
    } catch (err) {
      expect((err as BusinessRuleViolationError).code).toBe(
        ErrorCodes.SHIPPING_CONFIGURATION_UNAVAILABLE,
      );
    }
  });

  it('returns serviceable: false for unserviceable destination rule', async () => {
    await ShippingRuleModel.create({
      governorate: 'North Sinai',
      costMinor: 0,
      isActive: true,
      serviceable: false,
    });

    const result = await service.estimateShipping({
      method: 'delivery',
      governorate: 'North Sinai',
    });

    expect(result.serviceable).toBe(false);
  });
});
