import { ClientSession } from 'mongoose';
import { ShippingRepository } from '../repositories/shipping.repository';
import { CreateShippingRuleInput, IShippingRuleDocument, ShippingEstimateInput, ShippingEstimateResult, ShippingRuleQueryFilter, UpdateShippingRuleInput } from '../types/shipping.types';
import { AuditService } from '../../audit/services/audit.service';
export declare class ShippingService {
    private readonly repo;
    private readonly audit;
    constructor(repo?: ShippingRepository, audit?: AuditService);
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
    estimateShipping(input: ShippingEstimateInput, session?: ClientSession): Promise<ShippingEstimateResult>;
    /**
     * Admin: Create a new shipping rule.
     */
    createRule(input: CreateShippingRuleInput, actor: {
        id: string;
        role: string;
    }): Promise<IShippingRuleDocument>;
    /**
     * Admin: Update shipping rule.
     */
    updateRule(id: string, input: UpdateShippingRuleInput, actor: {
        id: string;
        role: string;
    }): Promise<IShippingRuleDocument>;
    /**
     * Admin: Soft deactivate or remove rule.
     */
    deleteRule(id: string, actor: {
        id: string;
        role: string;
    }): Promise<IShippingRuleDocument>;
    getRuleById(id: string): Promise<IShippingRuleDocument>;
    listRules(filter: ShippingRuleQueryFilter): Promise<{
        items: IShippingRuleDocument[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
}
export declare const shippingService: ShippingService;
