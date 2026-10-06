import { Types, ClientSession } from 'mongoose';
import { IPreorder, IPreorderDocument, PreorderFilter, PreorderStatus } from '../types/preorder.types';
import { RepositoryContext } from '../../../common/types';
export declare class PreorderRepository {
    /**
     * Creates a new preorder document atomically.
     */
    create(data: Partial<IPreorder>, ctx?: RepositoryContext): Promise<IPreorderDocument>;
    /**
     * Finds a pre-order by unique public reference.
     */
    findByReference(reference: string, ctx?: RepositoryContext): Promise<IPreorderDocument | null>;
    /**
     * Finds a pre-order by internal ObjectId.
     */
    findById(id: string | Types.ObjectId, ctx?: RepositoryContext): Promise<IPreorderDocument | null>;
    /**
     * Retrieves paginated pre-orders owned by a specific customer.
     */
    findCustomerPreorders(customerId: string | Types.ObjectId, filter: PreorderFilter, pagination: {
        skip: number;
        limit: number;
    }, ctx?: RepositoryContext): Promise<{
        preorders: IPreorderDocument[];
        total: number;
    }>;
    /**
     * Retrieves paginated pre-orders for admin with multi-criteria filtering.
     */
    findAdminPreorders(filter: PreorderFilter, pagination: {
        skip: number;
        limit: number;
    }, ctx?: RepositoryContext): Promise<{
        preorders: IPreorderDocument[];
        total: number;
    }>;
    /**
     * Atomically updates preorder status and fields with optimistic version checking.
     */
    updateStatusWithVersion(reference: string, fromStatus: PreorderStatus | PreorderStatus[], toStatus: PreorderStatus, updateData: Partial<IPreorder>, expectedVersion?: number, ctx?: RepositoryContext): Promise<IPreorderDocument | null>;
    /**
     * Updates an existing preorder by ID with session support.
     */
    updateById(id: string | Types.ObjectId, updateData: Partial<IPreorder>, ctx?: RepositoryContext): Promise<IPreorderDocument | null>;
    /**
     * Counts active (non-terminal) pre-orders for a given product and variant.
     */
    countActiveByProductAndVariant(productId: Types.ObjectId, variantId?: string | null, session?: ClientSession): Promise<number>;
}
export declare const preorderRepository: PreorderRepository;
