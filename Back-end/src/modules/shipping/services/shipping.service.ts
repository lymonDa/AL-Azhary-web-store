import { ClientSession } from 'mongoose';
import { shippingRepository, ShippingRepository } from '../repositories/shipping.repository';
import {
  CreateShippingRuleInput,
  IShippingRuleDocument,
  ShippingEstimateInput,
  ShippingEstimateResult,
  ShippingRuleQueryFilter,
  UpdateShippingRuleInput,
} from '../types/shipping.types';
import { BusinessRuleViolationError, NotFoundError, ValidationError } from '../../../common/errors';
import { ErrorCodes } from '../../../common/errors/errorCodes';
import { auditService, AuditService } from '../../audit/services/audit.service';

export class ShippingService {
  constructor(
    private readonly repo: ShippingRepository = shippingRepository,
    private readonly audit: AuditService = auditService,
  ) {}

  /**
   * Matches configured shipping rules according to hierarchy:
   * 1. area
   * 2. city
   * 3. governorate
   * 4. default (all null)
   *
   * Within the same scope, highest active priority wins.
   * If method is pickup, cost is always 0 and returns configured library pickup location.
   */
  async estimateShipping(
    input: ShippingEstimateInput,
    session?: ClientSession,
  ): Promise<ShippingEstimateResult> {
    if (input.method === 'pickup') {
      return {
        costMinor: 0,
        currency: 'EGP',
        serviceable: true,
        scope: 'pickup',
        pickupLocation: {
          ar: 'مكتبة الأزهري - قنا',
          en: 'Al-Azhary Library - Qena',
          address: 'شارع المحطة، بجوار مسجد سيدي عبد الرحيم القنائي، قنا، مصر',
        },
      };
    }

    if (input.method !== 'delivery') {
      throw new BusinessRuleViolationError(
        ErrorCodes.INVALID_FULFILLMENT,
        `Invalid fulfillment method: ${input.method}`,
      );
    }

    if (!input.governorate || input.governorate.trim().length === 0) {
      throw new ValidationError('Governorate is required for delivery fulfillment');
    }

    const now = new Date();
    const rules = await this.repo.findActiveRules(now, session);

    const normalizedGov = input.governorate.trim().toLowerCase();
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

  /**
   * Admin: Create a new shipping rule.
   */
  async createRule(
    input: CreateShippingRuleInput,
    actor: { id: string; role: string },
  ): Promise<IShippingRuleDocument> {
    const rule = await this.repo.create({
      governorate: input.governorate ? input.governorate.trim() : null,
      city: input.city ? input.city.trim() : null,
      area: input.area ? input.area.trim() : null,
      costMinor: input.costMinor,
      priority: input.priority ?? 0,
      isActive: input.isActive !== undefined ? input.isActive : true,
      effectiveFrom: input.effectiveFrom ?? null,
      effectiveTo: input.effectiveTo ?? null,
      serviceable: input.serviceable !== undefined ? input.serviceable : true,
      label: input.label,
    });

    await this.audit.record({
      actorId: actor.id,
      actorRole: actor.role,
      action: 'shipping.rule_created',
      entityType: 'ShippingRule',
      entityId: rule._id.toString(),
      newState: {
        governorate: rule.governorate,
        city: rule.city,
        area: rule.area,
        costMinor: rule.costMinor,
        priority: rule.priority,
        serviceable: rule.serviceable,
      },
    });

    return rule;
  }

  /**
   * Admin: Update shipping rule.
   */
  async updateRule(
    id: string,
    input: UpdateShippingRuleInput,
    actor: { id: string; role: string },
  ): Promise<IShippingRuleDocument> {
    const existing = await this.repo.findById(id);
    if (!existing) {
      throw new NotFoundError(`Shipping rule not found: ${id}`, ErrorCodes.SHIPPING_RULE_NOT_FOUND);
    }

    const updateFields: Record<string, unknown> = {};
    if (input.governorate !== undefined) updateFields.governorate = input.governorate ? input.governorate.trim() : null;
    if (input.city !== undefined) updateFields.city = input.city ? input.city.trim() : null;
    if (input.area !== undefined) updateFields.area = input.area ? input.area.trim() : null;
    if (input.costMinor !== undefined) updateFields.costMinor = input.costMinor;
    if (input.priority !== undefined) updateFields.priority = input.priority;
    if (input.isActive !== undefined) updateFields.isActive = input.isActive;
    if (input.effectiveFrom !== undefined) updateFields.effectiveFrom = input.effectiveFrom;
    if (input.effectiveTo !== undefined) updateFields.effectiveTo = input.effectiveTo;
    if (input.serviceable !== undefined) updateFields.serviceable = input.serviceable;
    if (input.label !== undefined) updateFields.label = input.label;

    const updated = await this.repo.update(id, { $set: updateFields });
    if (!updated) {
      throw new NotFoundError(`Shipping rule not found: ${id}`, ErrorCodes.SHIPPING_RULE_NOT_FOUND);
    }

    await this.audit.record({
      actorId: actor.id,
      actorRole: actor.role,
      action: 'shipping.rule_changed',
      entityType: 'ShippingRule',
      entityId: id,
      previousState: {
        costMinor: existing.costMinor,
        serviceable: existing.serviceable,
        isActive: existing.isActive,
      },
      newState: {
        costMinor: updated.costMinor,
        serviceable: updated.serviceable,
        isActive: updated.isActive,
      },
    });

    return updated;
  }

  /**
   * Admin: Soft deactivate or remove rule.
   */
  async deleteRule(id: string, actor: { id: string; role: string }): Promise<IShippingRuleDocument> {
    const existing = await this.repo.findById(id);
    if (!existing) {
      throw new NotFoundError(`Shipping rule not found: ${id}`, ErrorCodes.SHIPPING_RULE_NOT_FOUND);
    }

    const updated = await this.repo.update(id, { $set: { isActive: false } });
    if (!updated) {
      throw new NotFoundError(`Shipping rule not found: ${id}`, ErrorCodes.SHIPPING_RULE_NOT_FOUND);
    }

    await this.audit.record({
      actorId: actor.id,
      actorRole: actor.role,
      action: 'shipping.rule_deactivated',
      entityType: 'ShippingRule',
      entityId: id,
      previousState: { isActive: existing.isActive },
      newState: { isActive: false },
    });

    return updated;
  }

  async getRuleById(id: string): Promise<IShippingRuleDocument> {
    const rule = await this.repo.findById(id);
    if (!rule) {
      throw new NotFoundError(`Shipping rule not found: ${id}`, ErrorCodes.SHIPPING_RULE_NOT_FOUND);
    }
    return rule;
  }

  async listRules(filter: ShippingRuleQueryFilter) {
    const query: Record<string, unknown> = {};
    if (filter.isActive !== undefined) query.isActive = filter.isActive;
    if (filter.serviceable !== undefined) query.serviceable = filter.serviceable;
    if (filter.governorate) query.governorate = filter.governorate.trim();
    if (filter.city) query.city = filter.city.trim();
    if (filter.area) query.area = filter.area.trim();

    return this.repo.findWithPagination(query, filter.page, filter.limit);
  }
}

export const shippingService = new ShippingService();
