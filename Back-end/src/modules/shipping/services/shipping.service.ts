import { ShippingRuleModel } from '../models/shipping-rule.model';
import {
  IShippingRuleDocument,
  ShippingEstimateInput,
  ShippingEstimateResult,
} from '../types/shipping.types';
import { BusinessRuleViolationError } from '../../../common/errors';
import { ErrorCodes } from '../../../common/errors/errorCodes';

export class ShippingService {
  /**
   * Matches configured shipping rules according to hierarchy:
   * 1. area
   * 2. city
   * 3. governorate
   * 4. default (all null)
   *
   * Within the same scope, highest active priority wins.
   * If method is pickup, cost is 0 and returns configured library pickup location.
   */
  async estimateShipping(input: ShippingEstimateInput): Promise<ShippingEstimateResult> {
    if (input.method === 'pickup') {
      return {
        costMinor: 0,
        currency: 'EGP',
        serviceable: true,
        scope: 'pickup',
        pickupLocation: {
          ar: 'مكتبة الأزهري - قنا',
          en: 'Al-Azhari Library - Qena',
          address: 'شارع المحطة، بجوار مسجد سيدي عبد الرحيم القنائي، قنا، مصر',
        },
      };
    }

    const now = new Date();

    // Query all currently active rules
    const rules = await ShippingRuleModel.find({
      isActive: true,
      $and: [
        {
          $or: [
            { effectiveFrom: null },
            { effectiveFrom: { $lte: now } },
          ],
        },
        {
          $or: [
            { effectiveTo: null },
            { effectiveTo: { $gte: now } },
          ],
        },
      ],
    })
      .sort({ priority: -1 })
      .exec();

    const normalizedGov = input.governorate?.trim().toLowerCase();
    const normalizedCity = input.city?.trim().toLowerCase();
    const normalizedArea = input.area?.trim().toLowerCase();

    let matchedRule: IShippingRuleDocument | null = null;
    let scope: 'area' | 'city' | 'governorate' | 'default' = 'default';

    // 1. Area match
    if (normalizedArea && normalizedCity && normalizedGov) {
      matchedRule =
        rules.find(
          (r) =>
            r.area?.trim().toLowerCase() === normalizedArea &&
            r.city?.trim().toLowerCase() === normalizedCity &&
            r.governorate?.trim().toLowerCase() === normalizedGov,
        ) || null;
      if (matchedRule) scope = 'area';
    }

    // 2. City match
    if (!matchedRule && normalizedCity && normalizedGov) {
      matchedRule =
        rules.find(
          (r) =>
            !r.area &&
            r.city?.trim().toLowerCase() === normalizedCity &&
            r.governorate?.trim().toLowerCase() === normalizedGov,
        ) || null;
      if (matchedRule) scope = 'city';
    }

    // 3. Governorate match
    if (!matchedRule && normalizedGov) {
      matchedRule =
        rules.find(
          (r) =>
            !r.area &&
            !r.city &&
            r.governorate?.trim().toLowerCase() === normalizedGov,
        ) || null;
      if (matchedRule) scope = 'governorate';
    }

    // 4. Default match
    if (!matchedRule) {
      matchedRule = rules.find((r) => !r.area && !r.city && !r.governorate) || null;
      if (matchedRule) scope = 'default';
    }

    if (!matchedRule) {
      throw new BusinessRuleViolationError(
        ErrorCodes.SHIPPING_CONFIGURATION_UNAVAILABLE,
        'Shipping configuration is unavailable for the requested destination',
      );
    }

    return {
      costMinor: matchedRule.costMinor,
      currency: 'EGP',
      serviceable: matchedRule.serviceable,
      matchedRuleId: matchedRule._id.toString(),
      scope,
      pickupLocation: null,
    };
  }
}

export const shippingService = new ShippingService();
