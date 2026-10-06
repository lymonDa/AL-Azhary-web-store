"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.preorderController = exports.PreorderController = void 0;
const preorder_service_1 = require("../services/preorder.service");
const preorder_schema_1 = require("../schemas/preorder.schema");
const response_util_1 = require("../../../common/utils/response.util");
const pagination_1 = require("../../../common/http/pagination");
class PreorderController {
    preorders;
    constructor(preorders = preorder_service_1.preorderService) {
        this.preorders = preorders;
    }
    /**
     * POST /api/v1/products/:slug/pre-orders
     * Customer / Guest submits a new pre-order request for an out-of-stock eligible product
     */
    createPreorder = async (req, res, next) => {
        try {
            const { slug } = preorder_schema_1.productSlugParamSchema.parse(req.params);
            const input = preorder_schema_1.createPreorderSchema.parse(req.body);
            const accessContext = {
                userId: req.user?.userId || null,
                role: req.user?.role || null,
                requestId: String(req.id || ''),
                ipHash: req.ip,
            };
            const preorder = await this.preorders.createPreorder(slug, input, accessContext);
            (0, response_util_1.sendCreated)(req, res, { preorder });
        }
        catch (err) {
            next(err);
        }
    };
    /**
     * GET /api/v1/pre-orders
     * Customer retrieves their own pre-orders (or Admin retrieves pre-orders)
     */
    listPreorders = async (req, res, next) => {
        try {
            const query = preorder_schema_1.listPreordersQuerySchema.parse(req.query);
            const pagination = (0, pagination_1.parsePagination)(query, { defaultLimit: 20, maxLimit: 100 });
            const isAdmin = req.user?.role === 'admin' ||
                req.user?.role === 'owner';
            const accessContext = {
                userId: req.user?.userId || null,
                role: req.user?.role || null,
                requestId: String(req.id || ''),
                ipHash: req.ip,
            };
            const filter = {};
            if (query.status)
                filter.status = query.status;
            if (query.productId)
                filter.productId = query.productId;
            if (query.variantId !== undefined)
                filter.variantId = query.variantId;
            if (query.reference)
                filter.reference = query.reference;
            if (isAdmin && query.customerId) {
                filter.customerId = query.customerId;
            }
            if (isAdmin) {
                const result = await this.preorders.listAdminPreorders(filter, pagination);
                (0, response_util_1.sendSuccess)(req, res, { preorders: result.preorders }, 200, result.pagination);
            }
            else {
                const result = await this.preorders.listCustomerPreorders(accessContext, filter, pagination);
                (0, response_util_1.sendSuccess)(req, res, { preorders: result.preorders }, 200, result.pagination);
            }
        }
        catch (err) {
            next(err);
        }
    };
    /**
     * GET /api/v1/pre-orders/:reference
     * Retrieves single pre-order by reference (ownership-scoped)
     */
    getPreorderByReference = async (req, res, next) => {
        try {
            const { reference } = preorder_schema_1.preorderReferenceParamSchema.parse(req.params);
            const accessContext = {
                userId: req.user?.userId || null,
                role: req.user?.role || null,
                requestId: String(req.id || ''),
                ipHash: req.ip,
            };
            const preorder = await this.preorders.getPreorderByReference(reference, accessContext);
            (0, response_util_1.sendSuccess)(req, res, { preorder });
        }
        catch (err) {
            next(err);
        }
    };
    /**
     * POST /api/v1/pre-orders/:reference/cancel
     * Customer or Admin cancels a pre-order request
     */
    cancelPreorder = async (req, res, next) => {
        try {
            const { reference } = preorder_schema_1.preorderReferenceParamSchema.parse(req.params);
            const input = preorder_schema_1.cancelPreorderSchema.parse(req.body);
            const accessContext = {
                userId: req.user?.userId || null,
                role: req.user?.role || null,
                requestId: String(req.id || ''),
                ipHash: req.ip,
            };
            const preorder = await this.preorders.cancelPreorder(reference, input, accessContext);
            (0, response_util_1.sendSuccess)(req, res, { preorder });
        }
        catch (err) {
            next(err);
        }
    };
    /**
     * POST /api/v1/admin/pre-orders/:reference/accept
     * Admin accepts a pre-order request (Section 48.7)
     */
    adminAcceptPreorder = async (req, res, next) => {
        try {
            const { reference } = preorder_schema_1.preorderReferenceParamSchema.parse(req.params);
            const input = preorder_schema_1.acceptPreorderSchema.parse(req.body);
            const accessContext = {
                userId: req.user?.userId || null,
                role: req.user?.role || 'admin',
                requestId: String(req.id || ''),
                ipHash: req.ip,
            };
            const preorder = await this.preorders.acceptPreorder(reference, input, accessContext);
            (0, response_util_1.sendSuccess)(req, res, { preorder });
        }
        catch (err) {
            next(err);
        }
    };
    /**
     * POST /api/v1/admin/pre-orders/:reference/reject
     * Admin rejects a pre-order request
     */
    adminRejectPreorder = async (req, res, next) => {
        try {
            const { reference } = preorder_schema_1.preorderReferenceParamSchema.parse(req.params);
            const input = preorder_schema_1.rejectPreorderSchema.parse(req.body);
            const accessContext = {
                userId: req.user?.userId || null,
                role: req.user?.role || 'admin',
                requestId: String(req.id || ''),
                ipHash: req.ip,
            };
            const preorder = await this.preorders.rejectPreorder(reference, input, accessContext);
            (0, response_util_1.sendSuccess)(req, res, { preorder });
        }
        catch (err) {
            next(err);
        }
    };
    /**
     * POST /api/v1/admin/pre-orders/:reference/available
     * Admin marks product available for confirmed pre-orders (PRE-005)
     */
    adminMarkAvailable = async (req, res, next) => {
        try {
            const { reference } = preorder_schema_1.preorderReferenceParamSchema.parse(req.params);
            const accessContext = {
                userId: req.user?.userId || null,
                role: req.user?.role || 'admin',
                requestId: String(req.id || ''),
                ipHash: req.ip,
            };
            const preorder = await this.preorders.markAvailable(reference, accessContext);
            (0, response_util_1.sendSuccess)(req, res, { preorder });
        }
        catch (err) {
            next(err);
        }
    };
    /**
     * GET /api/v1/admin/pre-orders
     * Admin lists all pre-orders with search and filter parameters
     */
    adminListPreorders = async (req, res, next) => {
        try {
            const query = preorder_schema_1.listPreordersQuerySchema.parse(req.query);
            const pagination = (0, pagination_1.parsePagination)(query, { defaultLimit: 20, maxLimit: 100 });
            const filter = {};
            if (query.status)
                filter.status = query.status;
            if (query.productId)
                filter.productId = query.productId;
            if (query.variantId !== undefined)
                filter.variantId = query.variantId;
            if (query.reference)
                filter.reference = query.reference;
            if (query.customerId)
                filter.customerId = query.customerId;
            const result = await this.preorders.listAdminPreorders(filter, pagination);
            (0, response_util_1.sendSuccess)(req, res, { preorders: result.preorders }, 200, result.pagination);
        }
        catch (err) {
            next(err);
        }
    };
}
exports.PreorderController = PreorderController;
exports.preorderController = new PreorderController();
//# sourceMappingURL=preorder.controller.js.map