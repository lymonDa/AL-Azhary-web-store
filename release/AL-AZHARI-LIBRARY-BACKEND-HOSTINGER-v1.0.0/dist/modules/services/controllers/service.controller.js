"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serviceController = exports.ServiceController = void 0;
const service_service_1 = require("../services/service.service");
const service_schema_1 = require("../schemas/service.schema");
const service_projection_1 = require("../utils/service.projection");
const response_util_1 = require("../../../common/utils/response.util");
const errors_1 = require("../../../common/errors");
const errorCodes_1 = require("../../../common/errors/errorCodes");
function detectForbiddenAttachments(obj) {
    if (!obj || typeof obj !== 'object')
        return false;
    for (const [key, val] of Object.entries(obj)) {
        const normalized = key.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (service_schema_1.FORBIDDEN_ATTACHMENT_KEYS.includes(normalized))
            return true;
        if (typeof val === 'string' && val.startsWith('data:') && val.includes(';base64,'))
            return true;
        if (val && typeof val === 'object' && detectForbiddenAttachments(val))
            return true;
    }
    return false;
}
class ServiceController {
    services;
    constructor(services = service_service_1.serviceService) {
        this.services = services;
    }
    /**
     * GET /api/v1/services
     * Public list of active service categories
     */
    getServices = async (req, res, next) => {
        try {
            const categories = await this.services.getActiveCategories();
            (0, response_util_1.sendSuccess)(req, res, { categories });
        }
        catch (err) {
            next(err);
        }
    };
    /**
     * GET /api/v1/services/:slug
     * Public service category details and active form configuration
     */
    getServiceBySlug = async (req, res, next) => {
        try {
            const { slug } = service_schema_1.serviceSlugParamSchema.parse(req.params);
            const category = await this.services.getCategoryBySlug(slug);
            (0, response_util_1.sendSuccess)(req, res, { category });
        }
        catch (err) {
            next(err);
        }
    };
    /**
     * POST /api/v1/services/:slug/requests
     * Customer / Guest creates a new service request
     */
    createServiceRequest = async (req, res, next) => {
        try {
            // 1. Explicit attachment prohibition check
            if (detectForbiddenAttachments(req.body)) {
                throw new errors_1.AppError(errorCodes_1.ErrorCodes.ATTACHMENT_NOT_ALLOWED, 'File attachments, uploads, and file URLs are strictly prohibited for service requests. Exchange files externally via WhatsApp or Telegram.', 400);
            }
            // Check if contentType is multipart/form-data
            const contentType = req.headers['content-type'] || '';
            if (contentType.includes('multipart/form-data')) {
                throw new errors_1.AppError(errorCodes_1.ErrorCodes.ATTACHMENT_NOT_ALLOWED, 'Multipart file uploads are prohibited for service requests.', 400);
            }
            const { slug } = service_schema_1.serviceSlugParamSchema.parse(req.params);
            const input = service_schema_1.createServiceRequestSchema.parse(req.body);
            const guestToken = req.headers['x-guest-token'] || req.query.token || undefined;
            const result = await this.services.createServiceRequest(slug, input, {
                userId: req.user?.userId,
                role: req.user?.role,
                guestToken,
                requestId: String(req.id || ''),
                ipHash: req.ip,
            });
            (0, response_util_1.sendSuccess)(req, res, {
                serviceRequest: (0, service_projection_1.toSafeServiceRequest)(result.request),
                guestAccessToken: result.guestAccessToken,
            }, 201);
        }
        catch (err) {
            next(err);
        }
    };
    /**
     * GET /api/v1/service-requests/:reference
     * Retrieves a single service request with strict customer ownership / admin validation
     */
    getServiceRequestByReference = async (req, res, next) => {
        try {
            const { reference } = service_schema_1.serviceReferenceParamSchema.parse(req.params);
            const guestToken = req.headers['x-guest-token'] || req.query.token || undefined;
            const serviceRequest = await this.services.getServiceRequestByReference(reference, {
                userId: req.user?.userId,
                role: req.user?.role,
                guestToken,
                requestId: String(req.id || ''),
                ipHash: req.ip,
            });
            (0, response_util_1.sendSuccess)(req, res, { serviceRequest });
        }
        catch (err) {
            next(err);
        }
    };
}
exports.ServiceController = ServiceController;
exports.serviceController = new ServiceController();
//# sourceMappingURL=service.controller.js.map