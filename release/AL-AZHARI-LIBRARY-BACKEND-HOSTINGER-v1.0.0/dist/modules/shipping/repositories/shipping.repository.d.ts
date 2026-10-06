import { ClientSession, FilterQuery, Types, UpdateQuery } from 'mongoose';
import { IShippingRule, IShippingRuleDocument } from '../types/shipping.types';
export declare class ShippingRepository {
    findActiveRules(now?: Date, session?: ClientSession): Promise<IShippingRuleDocument[]>;
    findById(id: string | Types.ObjectId, session?: ClientSession): Promise<IShippingRuleDocument | null>;
    create(data: Partial<IShippingRule>, session?: ClientSession): Promise<IShippingRuleDocument>;
    update(id: string | Types.ObjectId, update: UpdateQuery<IShippingRuleDocument>, session?: ClientSession): Promise<IShippingRuleDocument | null>;
    delete(id: string | Types.ObjectId, session?: ClientSession): Promise<IShippingRuleDocument | null>;
    findWithPagination(filter: FilterQuery<IShippingRuleDocument>, page?: number, limit?: number): Promise<{
        items: IShippingRuleDocument[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
}
export declare const shippingRepository: ShippingRepository;
