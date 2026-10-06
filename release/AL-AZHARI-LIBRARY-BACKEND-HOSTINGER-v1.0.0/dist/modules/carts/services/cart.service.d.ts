import { CartRepository } from '../repositories/cart.repository';
import { AddCartItemDto, CartMergeResult, CartOwnerContext, CartOwnerType, CartResponse, ICartDocument, RemoveCartItemDto, UpdateCartItemDto } from '../types/cart.types';
export declare function formatCartResponse(cart: ICartDocument | null, fallbackOwnerType?: CartOwnerType): CartResponse;
export declare class CartService {
    private readonly cartRepo;
    constructor(cartRepo?: CartRepository);
    /**
     * Retrieves active cart for owner context.
     * If cart does not exist or expired, returns a clean empty representation without persisting.
     */
    getCart(owner: CartOwnerContext): Promise<CartResponse>;
    /**
     * Adds an item to the cart, or merges quantities if the same item exists.
     * Strictly validates catalog existence, publication, category active/MVP, and variant validity.
     */
    addItem(owner: CartOwnerContext, dto: AddCartItemDto): Promise<CartResponse>;
    /**
     * Updates quantity of a specific item in the cart.
     * Optimistically checks expectedVersion and atomically increments version.
     */
    updateItem(owner: CartOwnerContext, itemId: string, dto: UpdateCartItemDto): Promise<CartResponse>;
    /**
     * Removes an item from the cart idempotently with optimistic version check.
     */
    removeItem(owner: CartOwnerContext, itemId: string, dto?: RemoveCartItemDto): Promise<void>;
    /**
     * Merges a guest cart into a registered user cart.
     * If any item is incompatible with current catalog state or has changed price/availability,
     * returns a structured conflict list without dropping any item.
     */
    mergeCart(userId: string, sessionId?: string, options?: {
        expectedUserCartVersion?: number;
    }): Promise<CartMergeResult>;
}
export declare const cartService: CartService;
