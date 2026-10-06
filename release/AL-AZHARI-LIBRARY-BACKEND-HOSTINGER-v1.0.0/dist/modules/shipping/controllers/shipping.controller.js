"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shippingController = exports.ShippingController = void 0;
const shipping_service_1 = require("../services/shipping.service");
const shipping_schema_1 = require("../schemas/shipping.schema");
const response_util_1 = require("../../../common/utils/response.util");
const errors_1 = require("../../../common/errors");
class ShippingController {
    shipping;
    constructor(shipping = shipping_service_1.shippingService) {
        this.shipping = shipping;
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
     * POST /api/v1/admin/shipping/rules
     */
    createRule = async (req, res, next) => {
        try {
            if (!req.user)
                throw new errors_1.UnauthorizedError('Authentication required');
            const input = shipping_schema_1.createShippingRuleSchema.parse(req.body);
            const rule = await this.shipping.createRule(input, {
                id: req.user.userId,
                role: req.user.role,
            });
            (0, response_util_1.sendSuccess)(req, res, rule, 201);
        }
        catch (error) {
            next(error);
        }
    };
    /**
     * GET /api/v1/admin/shipping/rules
     */
    listRules = async (req, res, next) => {
        try {
            const query = shipping_schema_1.shippingRuleQuerySchema.parse(req.query);
            const result = await this.shipping.listRules(query);
            (0, response_util_1.sendSuccess)(req, res, result);
        }
        catch (error) {
            next(error);
        }
    };
    /**
     * GET /api/v1/admin/shipping/rules/:id
     */
    getRuleById = async (req, res, next) => {
        try {
            const { id } = req.params;
            const rule = await this.shipping.getRuleById(id);
            (0, response_util_1.sendSuccess)(req, res, rule);
        }
        catch (error) {
            next(error);
        }
    };
    /**
     * PATCH /api/v1/admin/shipping/rules/:id
     */
    updateRule = async (req, res, next) => {
        try {
            if (!req.user)
                throw new errors_1.UnauthorizedError('Authentication required');
            const { id } = req.params;
            const input = shipping_schema_1.updateShippingRuleSchema.parse(req.body);
            const updated = await this.shipping.updateRule(id, input, {
                id: req.user.userId,
                role: req.user.role,
            });
            (0, response_util_1.sendSuccess)(req, res, updated);
        }
        catch (error) {
            next(error);
        }
    };
    /**
     * DELETE /api/v1/admin/shipping/rules/:id
     */
    deleteRule = async (req, res, next) => {
        try {
            if (!req.user)
                throw new errors_1.UnauthorizedError('Authentication required');
            const { id } = req.params;
            const deleted = await this.shipping.deleteRule(id, {
                id: req.user.userId,
                role: req.user.role,
            });
            (0, response_util_1.sendSuccess)(req, res, deleted);
        }
        catch (error) {
            next(error);
        }
    };
}
exports.ShippingController = ShippingController;
exports.shippingController = new ShippingController();
//# sourceMappingURL=shipping.controller.js.map