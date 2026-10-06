import { Request, Response, NextFunction } from 'express';
export declare class CartController {
    /**
     * GET /api/v1/cart
     * Returns current active cart for authenticated user or guest session.
     */
    getCart(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * POST /api/v1/cart/items
     * Adds an item to the cart or increments existing quantity.
     */
    addItem(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * PATCH /api/v1/cart/items/:itemId
     * Updates quantity of an item with optimistic version check.
     */
    updateItem(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * DELETE /api/v1/cart/items/:itemId
     * Removes an item idempotently with optimistic version check.
     */
    removeItem(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * POST /api/v1/cart/merge
     * Merges guest cart into authenticated customer account.
     */
    mergeCart(req: Request, res: Response, next: NextFunction): Promise<void>;
}
export declare const cartController: CartController;
