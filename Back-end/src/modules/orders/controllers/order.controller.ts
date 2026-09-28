import { Request, Response, NextFunction } from 'express';
import { orderService, OrderService } from '../services/order.service';
import { shippingService, ShippingService } from '../../shipping/services/shipping.service';
import {
  createOrderSchema,
  updatePendingOrderSchema,
  cancelOrderSchema,
  adminAcceptOrderSchema,
  adminRejectOrderSchema,
  adminOrderStatusSchema,
  adminOrderShippingSchema,
  orderQuerySchema,
} from '../schemas/order.schema';
import { shippingEstimateSchema } from '../../shipping/schemas/shipping.schema';
import { toSafeOrderResponse } from '../utils/order.projection';
import { sendSuccess } from '../../../common/utils/response.util';
import { CartOwnerContext } from '../../carts/types/cart.types';
import { UnauthorizedError, ValidationError } from '../../../common/errors';
import { OrderStatus } from '../types/order.types';

export class OrderController {
  constructor(
    private readonly orders: OrderService = orderService,
    private readonly shipping: ShippingService = shippingService,
  ) {}

  /**
   * Helper to extract cart owner context from request (authenticated customer or guest session header)
   */
  private getCartOwnerContext(req: Request): CartOwnerContext {
    if (req.user) {
      return {
        ownerType: 'user',
        userId: req.user.userId,
      };
    }

    const sessionId = (req.headers['x-guest-session-id'] as string) || req.cookies?.guest_session_id;
    if (!sessionId || typeof sessionId !== 'string' || sessionId.trim().length === 0) {
      throw new UnauthorizedError('Authentication or guest session ID required');
    }

    return {
      ownerType: 'guest',
      sessionId: sessionId.trim(),
    };
  }

  /**
   * POST /api/v1/checkout/shipping-estimate
   */
  estimateShipping = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input = shippingEstimateSchema.parse(req.body);
      const result = await this.shipping.estimateShipping({
        method: input.method,
        governorate: input.governorate,
        city: input.city,
        area: input.area,
      });

      sendSuccess(req, res, result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/orders
   * Create an authoritative order from current cart.
   */
  createOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const owner = this.getCartOwnerContext(req);
      const input = createOrderSchema.parse(req.body);

      const result = await this.orders.createOrder(input, {
        owner,
        requestId: String(req.id || ''),
        ipHash: req.ip,
      });

      const safeResponse = toSafeOrderResponse(result.order, result.rawGuestToken);
      sendSuccess(req, res, safeResponse, 201);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/orders/:reference
   */
  getOrderByReference = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { reference } = req.params;
      const guestToken = (req.headers['x-guest-token'] as string) || (req.query.token as string);

      const order = await this.orders.getOrderByReference(reference, {
        userId: req.user?.userId,
        role: req.user?.role,
        guestToken,
      });

      sendSuccess(req, res, toSafeOrderResponse(order));
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /api/v1/orders/:reference
   */
  updatePendingOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { reference } = req.params;
      const guestToken = (req.headers['x-guest-token'] as string) || (req.query.token as string);
      const input = updatePendingOrderSchema.parse(req.body);

      const order = await this.orders.updatePendingOrder(
        reference,
        input,
        { userId: req.user?.userId, guestToken },
      );

      sendSuccess(req, res, toSafeOrderResponse(order));
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/orders/:reference/cancel
   */
  cancelOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { reference } = req.params;
      const guestToken = (req.headers['x-guest-token'] as string) || (req.query.token as string);
      const input = cancelOrderSchema.parse(req.body);

      const order = await this.orders.cancelOrder(
        reference,
        input.expectedVersion,
        { userId: req.user?.userId, guestToken },
        input.reason,
      );

      sendSuccess(req, res, toSafeOrderResponse(order));
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/admin/orders
   */
  listAdminOrders = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = orderQuerySchema.parse(req.query);
      const filter: Record<string, unknown> = {};
      if (query.status) filter.status = query.status;

      const result = await orderService['orderRepo'].findAdminOrders(filter, {
        page: query.page,
        limit: query.limit,
      });

      sendSuccess(
        req,
        res,
        result.items.map((o) => toSafeOrderResponse(o)),
        200,
        {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages,
        },
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/admin/orders/:reference/accept
   */
  adminAcceptOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) throw new UnauthorizedError('Authentication required');
      const { reference } = req.params;
      const input = adminAcceptOrderSchema.parse(req.body);

      const order = await this.orders.adminAcceptOrder(
        reference,
        input.expectedVersion,
        { id: req.user.userId, role: req.user.role },
      );

      sendSuccess(req, res, toSafeOrderResponse(order));
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/admin/orders/:reference/reject
   */
  adminRejectOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) throw new UnauthorizedError('Authentication required');
      const { reference } = req.params;
      const input = adminRejectOrderSchema.parse(req.body);

      const order = await this.orders.adminRejectOrder(
        reference,
        input.expectedVersion,
        input.reason,
        { id: req.user.userId, role: req.user.role },
      );

      sendSuccess(req, res, toSafeOrderResponse(order));
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/admin/orders/:reference/status
   */
  adminUpdateOrderStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) throw new UnauthorizedError('Authentication required');
      const { reference } = req.params;
      const input = adminOrderStatusSchema.parse(req.body);

      const order = await this.orders.adminUpdateOrderStatus(
        reference,
        input.targetStatus as OrderStatus,
        input.expectedVersion,
        { id: req.user.userId, role: req.user.role },
        input.reason,
      );

      sendSuccess(req, res, toSafeOrderResponse(order));
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/orders/:reference/confirm-cod
   */
  confirmCodOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { reference } = req.params;
      const guestToken = (req.headers['x-guest-token'] as string) || (req.query.token as string);
      const expectedVersion = Number(req.body.expectedVersion);
      if (!expectedVersion || Number.isNaN(expectedVersion)) {
        throw new ValidationError('expectedVersion is required and must be a valid number');
      }

      const order = await this.orders.confirmCodOrder(
        reference,
        expectedVersion,
        { userId: req.user?.userId, guestToken },
      );

      sendSuccess(req, res, toSafeOrderResponse(order));
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/admin/orders/:reference
   */
  getAdminOrderByReference = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) throw new UnauthorizedError('Authentication required');
      const { reference } = req.params;

      const order = await this.orders.getOrderByReference(reference, {
        userId: req.user.userId,
        role: req.user.role,
      });

      sendSuccess(req, res, toSafeOrderResponse(order));
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/admin/orders/:reference/shipping
   */
  adminUpdateShipping = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) throw new UnauthorizedError('Authentication required');
      const { reference } = req.params;
      const input = adminOrderShippingSchema.parse(req.body);

      const order = await this.orders.adminUpdateShipping(
        reference,
        input,
        { id: req.user.userId, role: req.user.role },
      );

      sendSuccess(req, res, toSafeOrderResponse(order));
    } catch (error) {
      next(error);
    }
  };
}

export const orderController = new OrderController();
