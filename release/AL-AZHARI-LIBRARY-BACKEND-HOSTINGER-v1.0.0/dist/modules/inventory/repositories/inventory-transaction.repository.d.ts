import { Types } from 'mongoose';
import { IInventoryTransaction, IInventoryTransactionDocument } from '../types/inventory.types';
import { RepositoryContext } from '../../../common/types';
export interface LedgerQueryOptions {
    page?: number;
    limit?: number;
}
export declare class InventoryTransactionRepository {
    create(data: Partial<IInventoryTransaction>, ctx?: RepositoryContext): Promise<IInventoryTransactionDocument>;
    findByProduct(productId: string | Types.ObjectId, variantId?: string | null, options?: LedgerQueryOptions, ctx?: RepositoryContext): Promise<{
        items: IInventoryTransactionDocument[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
}
export declare const inventoryTransactionRepository: InventoryTransactionRepository;
