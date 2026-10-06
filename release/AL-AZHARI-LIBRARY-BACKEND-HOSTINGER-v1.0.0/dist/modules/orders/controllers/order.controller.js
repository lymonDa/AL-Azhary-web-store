"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.orderController = exports.OrderController = void 0;
const order_service_1 = require("../services/order.service");
const shipping_service_1 = require("../../shipping/services/shipping.service");
const order_schema_1 = require("../schemas/order.schema");
const shipping_schema_1 = require("../../shipping/schemas/shipping.schema");
const order_projection_1 = require("../utils/order.projection");
const response_util_1 = require("../../../common/utils/response.util");
const errors_1 = require("../../../common/errors");
class OrderController {
    orders;
    shipping;
    constructor(orders = order_service_1.orderService, shipping = shipping_service_1.shippingService) {
        this.orders = orders;
        this.shipping = shipping;
    }
    /**
     * Helper to extract cart owner context from request (authenticated customer or guest session header)
     */
    getCartOwnerContext(req) {
        if (req.user) {
            return {
                ownerType: 'user',
                userId: req.user.userId,
            };
        }
        const sessionId = req.headers['x-guest-session-id'] || req.cookies?.guest_session_id;
        if (!sessionId || typeof sessionId !== 'string' || sessionId.trim().length === 0) {
            throw new errors_1.UnauthorizedError('Authentication or guest session ID required');
        }
        return {
            ownerType: 'guest',
            sessionId: sessionId.trim(),
        };
    }
    /**
     * POST /api/v1/checkout/shipping-estimate
     */
    estimateShipping = async (req, res, next) => {
        try {
            const input = shipping_schema_1.shippingEstimateSchema.parse(req.body);
            const result = await this.shipping.estimateShipping({
                method: input.method,
                governorate: input.governorate,
                city: input.city,
                area: input.area,
            });
            (0, response_util_1.sendSuccess)(req, res, result);
        }
        catch (error) {
            next(error);
        }
    };
    /**
     * POST /api/v1/orders
     * Create an authoritative order from current cart.
     */
    createOrder = async (req, res, next) => {
        try {
            const owner = this.getCartOwnerContext(req);
            const input = order_schema_1.createOrderSchema.parse(req.body);
            const result = await this.orders.createOrder(input, {
                owner,
                requestId: String(req.id || ''),
                ipHash: req.ip,
            });
            const safeResponse = (0, order_projection_1.toSafeOrderResponse)(result.order, result.rawGuestToken);
            (0, response_util_1.sendSuccess)(req, res, safeResponse, 201);
        }
        catch (error) {
            next(error);
        }
    };
    /**
     * GET /api/v1/orders/:reference
     */
    getOrderByReference = async (req, res, next) => {
        try {
            const { reference } = req.params;
            const guestToken = req.headers['x-guest-token'] || req.query.token;
            const order = await this.orders.getOrderByReference(reference, {
                userId: req.user?.userId,
                role: req.user?.role,
                guestToken,
            });
            (0, response_util_1.sendSuccess)(req, res, (0, order_projection_1.toSafeOrderResponse)(order));
        }
        catch (error) {
            next(error);
        }
    };
    /**
     * PATCH /api/v1/orders/:reference
     */
    updatePendingOrder = async (req, res, next) => {
        try {
            const { reference } = req.params;
            const guestToken = req.headers['x-guest-token'] || req.query.token;
            const input = order_schema_1.updatePendingOrderSchema.parse(req.body);
            const order = await this.orders.updatePendingOrder(reference, input, { userId: req.user?.userId, guestToken });
            (0, response_util_1.sendSuccess)(req, res, (0, order_projection_1.toSafeOrderResponse)(order));
        }
        catch (error) {
            next(error);
        }
    };
    /**
     * POST /api/v1/orders/:reference/cancel
     */
    cancelOrder = async (req, res, next) => {
        try {
            const { reference } = req.params;
            const guestToken = req.headers['x-guest-token'] || req.query.token;
            const input = order_schema_1.cancelOrderSchema.parse(req.body);
            const order = await this.orders.cancelOrder(reference, input.expectedVersion, { userId: req.user?.userId, guestToken }, input.reason);
            (0, response_util_1.sendSuccess)(req, res, (0, order_projection_1.toSafeOrderResponse)(order));
        }
        catch (error) {
            next(error);
        }
    };
    /**
     * GET /api/v1/admin/orders
     */
    listAdminOrders = async (req, res, next) => {
        try {
            const query = order_schema_1.orderQuerySchema.parse(req.query);
            const filter = {};
            if (query.status)
                filter.status = query.status;
            const result = await order_service_1.orderService['orderRepo'].findAdminOrders(filter, {
                page: query.page,
                limit: query.limit,
            });
            (0, response_util_1.sendSuccess)(req, res, result.items.map((o) => (0, order_projection_1.toSafeOrderResponse)(o)), 200, {
                page: result.page,
                limit: result.limit,
                total: result.total,
                totalPages: result.totalPages,
            });
        }
        catch (error) {
            next(error);
        }
    };
    /**
     * POST /api/v1/admin/orders/:reference/accept
     */
    adminAcceptOrder = async (req, res, next) => {
        try {
            if (!req.user)
                throw new errors_1.UnauthorizedError('Authentication required');
            const { reference } = req.params;
            const input = order_schema_1.adminAcceptOrderSchema.parse(req.body);
            const order = await this.orders.adminAcceptOrder(reference, input.expectedVersion, { id: req.user.userId, role: req.user.role });
            (0, response_util_1.sendSuccess)(req, res, (0, order_projection_1.toSafeOrderResponse)(order));
        }
        catch (error) {
            next(error);
        }
    };
    /**
     * POST /api/v1/admin/orders/:reference/reject
     */
    adminRejectOrder = async (req, res, next) => {
        try {
            if (!req.user)
                throw new errors_1.UnauthorizedError('Authentication required');
            const { reference } = req.params;
            const input = order_schema_1.adminRejectOrderSchema.parse(req.body);
            const order = await this.orders.adminRejectOrder(reference, input.expectedVersion, input.reason, { id: req.user.userId, role: req.user.role });
            (0, response_util_1.sendSuccess)(req, res, (0, order_projection_1.toSafeOrderResponse)(order));
        }
        catch (error) {
            next(error);
        }
    };
    /**
     * POST /api/v1/admin/orders/:reference/status
     */
    adminUpdateOrderStatus = async (req, res, next) => {
        try {
            if (!req.user)
                throw new errors_1.UnauthorizedError('Authentication required');
            const { reference } = req.params;
            const input = order_schema_1.adminOrderStatusSchema.parse(req.body);
            const order = await this.orders.adminUpdateOrderStatus(reference, input.targetStatus, input.expectedVersion, { id: req.user.userId, role: req.user.role }, input.reason);
            (0, response_util_1.sendSuccess)(req, res, (0, order_projection_1.toSafeOrderResponse)(order));
        }
        catch (error) {
            next(error);
        }
    };
    /**
     * POST /api/v1/orders/:reference/confirm-cod
     */
    confirmCodOrder = async (req, res, next) => {
        try {
            const { reference } = req.params;
            const guestToken = req.headers['x-guest-token'] || req.query.token;
            const expectedVersion = Number(req.body.expectedVersion);
            if (!expectedVersion || Number.isNaN(expectedVersion)) {
                throw new errors_1.ValidationError('expectedVersion is required and must be a valid number');
            }
            const order = await this.orders.confirmCodOrder(reference, expectedVersion, { userId: req.user?.userId, guestToken });
            (0, response_util_1.sendSuccess)(req, res, (0, order_projection_1.toSafeOrderResponse)(order));
        }
        catch (error) {
            next(error);
        }
    };
    /**
     * GET /api/v1/admin/orders/:reference
     */
    getAdminOrderByReference = async (req, res, next) => {
        try {
            if (!req.user)
                throw new errors_1.UnauthorizedError('Authentication required');
            const { reference } = req.params;
            const order = await this.orders.getOrderByReference(reference, {
                userId: req.user.userId,
                role: req.user.role,
            });
            (0, response_util_1.sendSuccess)(req, res, (0, order_projection_1.toSafeOrderResponse)(order));
        }
        catch (error) {
            next(error);
        }
    };
    /**
     * POST /api/v1/admin/orders/:reference/shipping
     */
    adminUpdateShipping = async (req, res, next) => {
        try {
            if (!req.user)
                throw new errors_1.UnauthorizedError('Authentication required');
            const { reference } = req.params;
            const input = order_schema_1.adminOrderShippingSchema.parse(req.body);
            const order = await this.orders.adminUpdateShipping(reference, input, { id: req.user.userId, role: req.user.role });
            (0, response_util_1.sendSuccess)(req, res, (0, order_projection_1.toSafeOrderResponse)(order));
        }
        catch (error) {
            next(error);
        }
    };
}
exports.OrderController = OrderController;
exports.orderController = new OrderController();
//# sourceMappingURL=order.controller.js.map