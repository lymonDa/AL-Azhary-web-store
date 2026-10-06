import { Types } from 'mongoose';
import { IProductDocument } from '../../products/types/product.types';
import { RepositoryContext } from '../../../common/types';
export declare class InventoryRepository {
    /**
     * Find product by ID with optional session.
     */
    findProductById(productId: string | Types.ObjectId, ctx?: RepositoryContext): Promise<IProductDocument | null>;
    /**
     * Conditionally reserve stock for a non-variant product.
     * Atomic condition: (stockTotal - stockReserved) >= quantity.
     */
    reserveProductStock(productId: string | Types.ObjectId, quantity: number, ctx?: RepositoryContext): Promise<boolean>;
    /**
     * Conditionally reserve stock for an embedded variant product.
     * Atomic condition: variant exists and (variant.stockTotal - variant.stockReserved) >= quantity.
     */
    reserveVariantStock(productId: string | Types.ObjectId, variantId: string, quantity: number, ctx?: RepositoryContext): Promise<boolean>;
    /**
     * Conditionally release reserved stock for a non-variant product.
     * Atomic condition: stockReserved >= quantity.
     */
    releaseProductStock(productId: string | Types.ObjectId, quantity: number, ctx?: RepositoryContext): Promise<boolean>;
    /**
     * Conditionally release reserved stock for an embedded variant product.
     * Atomic condition: variant exists and variant.stockReserved >= quantity.
     */
    releaseVariantStock(productId: string | Types.ObjectId, variantId: string, quantity: number, ctx?: RepositoryContext): Promise<boolean>;
    /**
     * Conditionally deduct total and reserved stock upon fulfillment for a non-variant product.
     * Invariants: stockTotal >= quantity AND stockReserved >= quantity.
     */
    deductProductStock(productId: string | Types.ObjectId, quantity: number, ctx?: RepositoryContext): Promise<boolean>;
    /**
     * Conditionally deduct total and reserved stock upon fulfillment for a variant product.
     * Invariants: variant.stockTotal >= quantity AND variant.stockReserved >= quantity.
     */
    deductVariantStock(productId: string | Types.ObjectId, variantId: string, quantity: number, ctx?: RepositoryContext): Promise<boolean>;
    /**
     * Restores total stock for a non-variant product upon return approval.
     */
    restoreProductStock(productId: string | Types.ObjectId, quantity: number, ctx?: RepositoryContext): Promise<boolean>;
    /**
     * Restores total stock for an embedded variant product upon return approval.
     */
    restoreVariantStock(productId: string | Types.ObjectId, variantId: string, quantity: number, ctx?: RepositoryContext): Promise<boolean>;
    /**
     * Optimistically adjust stock for a non-variant product with version checking.
     */
    adjustProductStockWithVersion(productId: string | Types.ObjectId, expectedVersion: number, deltaStockTotal: number, deltaStockReserved: number, ctx?: RepositoryContext): Promise<boolean>;
    /**
     * Optimistically adjust stock for a variant with version checking.
     */
    adjustVariantStockWithVersion(productId: string | Types.ObjectId, variantId: string, expectedVersion: number, deltaStockTotal: number, deltaStockReserved: number, ctx?: RepositoryContext): Promise<boolean>;
}
export declare const inventoryRepository: InventoryRepository;
