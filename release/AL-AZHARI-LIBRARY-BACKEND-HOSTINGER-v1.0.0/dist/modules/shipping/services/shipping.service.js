"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shippingService = exports.ShippingService = void 0;
const shipping_repository_1 = require("../repositories/shipping.repository");
const errors_1 = require("../../../common/errors");
const errorCodes_1 = require("../../../common/errors/errorCodes");
const audit_service_1 = require("../../audit/services/audit.service");
class ShippingService {
    repo;
    audit;
    constructor(repo = shipping_repository_1.shippingRepository, audit = audit_service_1.auditService) {
        this.repo = repo;
        this.audit = audit;
    }
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
    async estimateShipping(input, session) {
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
            throw new errors_1.BusinessRuleViolationError(errorCodes_1.ErrorCodes.INVALID_FULFILLMENT, `Invalid fulfillment method: ${input.method}`);
        }
        if (!input.governorate || input.governorate.trim().length === 0) {
            throw new errors_1.ValidationError('Governorate is required for delivery fulfillment');
        }
        const now = new Date();
        const rules = await this.repo.findActiveRules(now, session);
        const normalizedGov = input.governorate.trim().toLowerCase();
        const normalizedCity = input.city?.trim().toLowerCase();
        const normalizedArea = input.area?.trim().toLowerCase();
        let matchedRule = null;
        let scope = 'default';
        // 1. Area match
        if (normalizedArea && normalizedCity && normalizedGov) {
            matchedRule =
                rules.find((r) => r.area?.trim().toLowerCase() === normalizedArea &&
                    r.city?.trim().toLowerCase() === normalizedCity &&
                    r.governorate?.trim().toLowerCase() === normalizedGov) || null;
            if (matchedRule)
                scope = 'area';
        }
        // 2. City match
        if (!matchedRule && normalizedCity && normalizedGov) {
            matchedRule =
                rules.find((r) => !r.area &&
                    r.city?.trim().toLowerCase() === normalizedCity &&
                    r.governorate?.trim().toLowerCase() === normalizedGov) || null;
            if (matchedRule)
                scope = 'city';
        }
        // 3. Governorate match
        if (!matchedRule && normalizedGov) {
            matchedRule =
                rules.find((r) => !r.area &&
                    !r.city &&
                    r.governorate?.trim().toLowerCase() === normalizedGov) || null;
            if (matchedRule)
                scope = 'governorate';
        }
        // 4. Default match
        if (!matchedRule) {
            matchedRule = rules.find((r) => !r.area && !r.city && !r.governorate) || null;
            if (matchedRule)
                scope = 'default';
        }
        if (!matchedRule) {
            throw new errors_1.BusinessRuleViolationError(errorCodes_1.ErrorCodes.SHIPPING_CONFIGURATION_UNAVAILABLE, 'Shipping configuration is unavailable for the requested destination');
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
    async createRule(input, actor) {
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
    async updateRule(id, input, actor) {
        const existing = await this.repo.findById(id);
        if (!existing) {
            throw new errors_1.NotFoundError(`Shipping rule not found: ${id}`, errorCodes_1.ErrorCodes.SHIPPING_RULE_NOT_FOUND);
        }
        const updateFields = {};
        if (input.governorate !== undefined)
            updateFields.governorate = input.governorate ? input.governorate.trim() : null;
        if (input.city !== undefined)
            updateFields.city = input.city ? input.city.trim() : null;
        if (input.area !== undefined)
            updateFields.area = input.area ? input.area.trim() : null;
        if (input.costMinor !== undefined)
            updateFields.costMinor = input.costMinor;
        if (input.priority !== undefined)
            updateFields.priority = input.priority;
        if (input.isActive !== undefined)
            updateFields.isActive = input.isActive;
        if (input.effectiveFrom !== undefined)
            updateFields.effectiveFrom = input.effectiveFrom;
        if (input.effectiveTo !== undefined)
            updateFields.effectiveTo = input.effectiveTo;
        if (input.serviceable !== undefined)
            updateFields.serviceable = input.serviceable;
        if (input.label !== undefined)
            updateFields.label = input.label;
        const updated = await this.repo.update(id, { $set: updateFields });
        if (!updated) {
            throw new errors_1.NotFoundError(`Shipping rule not found: ${id}`, errorCodes_1.ErrorCodes.SHIPPING_RULE_NOT_FOUND);
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
    async deleteRule(id, actor) {
        const existing = await this.repo.findById(id);
        if (!existing) {
            throw new errors_1.NotFoundError(`Shipping rule not found: ${id}`, errorCodes_1.ErrorCodes.SHIPPING_RULE_NOT_FOUND);
        }
        const updated = await this.repo.update(id, { $set: { isActive: false } });
        if (!updated) {
            throw new errors_1.NotFoundError(`Shipping rule not found: ${id}`, errorCodes_1.ErrorCodes.SHIPPING_RULE_NOT_FOUND);
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
    async getRuleById(id) {
        const rule = await this.repo.findById(id);
        if (!rule) {
            throw new errors_1.NotFoundError(`Shipping rule not found: ${id}`, errorCodes_1.ErrorCodes.SHIPPING_RULE_NOT_FOUND);
        }
        return rule;
    }
    async listRules(filter) {
        const query = {};
        if (filter.isActive !== undefined)
            query.isActive = filter.isActive;
        if (filter.serviceable !== undefined)
            query.serviceable = filter.serviceable;
        if (filter.governorate)
            query.governorate = filter.governorate.trim();
        if (filter.city)
            query.city = filter.city.trim();
        if (filter.area)
            query.area = filter.area.trim();
        return this.repo.findWithPagination(query, filter.page, filter.limit);
    }
}
exports.ShippingService = ShippingService;
exports.shippingService = new ShippingService();
//# sourceMappingURL=shipping.service.js.map