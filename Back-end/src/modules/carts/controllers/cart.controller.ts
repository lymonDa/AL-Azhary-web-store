import { Request, Response, NextFunction } from 'express';
import { cartService } from '../services/cart.service';
import { sendSuccess, sendNoContent } from '../../../common/utils/response.util';
import { UnauthorizedError } from '../../../common/errors';
import { ErrorCodes } from '../../../common/errors/errorCodes';
import { GUEST_SESSION_COOKIE_NAME, GUEST_SESSION_HEADER_NAME } from '../middleware/cart-owner.middleware';

export class CartController {
  /**
   * GET /api/v1/cart
   * Returns current active cart for authenticated user or guest session.
   */
  async getCart(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.cartOwner) {
        throw new UnauthorizedError('Cart owner could not be resolved', ErrorCodes.AUTH_REQUIRED);
      }

      const cart = await cartService.getCart(req.cartOwner);
      sendSuccess(req, res, cart);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/cart/items
   * Adds an item to the cart or increments existing quantity.
   */
  async addItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.cartOwner) {
        throw new UnauthorizedError('Cart owner could not be resolved', ErrorCodes.AUTH_REQUIRED);
      }

      const cart = await cartService.addItem(req.cartOwner, req.body);
      sendSuccess(req, res, cart, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/cart/items/:itemId
   * Updates quantity of an item with optimistic version check.
   */
  async updateItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.cartOwner) {
        throw new UnauthorizedError('Cart owner could not be resolved', ErrorCodes.AUTH_REQUIRED);
      }

      const { itemId } = req.params;
      const cart = await cartService.updateItem(req.cartOwner, itemId, req.body);
      sendSuccess(req, res, cart);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/cart/items/:itemId
   * Removes an item idempotently with optimistic version check.
   */
  async removeItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.cartOwner) {
        throw new UnauthorizedError('Cart owner could not be resolved', ErrorCodes.AUTH_REQUIRED);
      }

      const { itemId } = req.params;
      const queryExpected = req.query.expectedVersion
        ? Number(req.query.expectedVersion)
        : undefined;
      const bodyExpected = req.body?.expectedVersion
        ? Number(req.body.expectedVersion)
        : undefined;
      const expectedVersion = queryExpected ?? bodyExpected;

      await cartService.removeItem(req.cartOwner, itemId, { expectedVersion });
      sendNoContent(res);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/cart/merge
   * Merges guest cart into authenticated customer account.
   */
  async mergeCart(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.userId) {
        throw new UnauthorizedError(
          'Authentication required to merge cart',
          ErrorCodes.AUTH_REQUIRED,
        );
      }

      const sessionId =
        req.body?.sessionId ||
        (req.headers[GUEST_SESSION_HEADER_NAME] as string | undefined) ||
        (req.headers['x-session-id'] as string | undefined) ||
        req.cookies?.[GUEST_SESSION_COOKIE_NAME];

      const result = await cartService.mergeCart(req.user.userId, sessionId, {
        expectedUserCartVersion: req.body?.expectedUserCartVersion,
      });

      sendSuccess(req, res, result);
    } catch (error) {
      next(error);
    }
  }
}

export const cartController = new CartController();
