"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serviceService = exports.ServiceService = void 0;
const mongoose_1 = require("mongoose");
const service_category_repository_1 = require("../repositories/service-category.repository");
const service_request_repository_1 = require("../repositories/service-request.repository");
const service_projection_1 = require("../utils/service.projection");
const service_utils_1 = require("../utils/service.utils");
const order_utils_1 = require("../../orders/utils/order.utils");
const transaction_1 = require("../../../database/transaction");
const audit_service_1 = require("../../audit/services/audit.service");
const outbox_service_1 = require("../../notifications/services/outbox.service");
const errors_1 = require("../../../common/errors");
const errorCodes_1 = require("../../../common/errors/errorCodes");
const quotation_model_1 = require("../../quotations/models/quotation.model");
const users_repository_1 = require("../../users/repositories/users.repository");
class ServiceService {
    categoryRepo;
    requestRepo;
    audit;
    outbox;
    constructor(categoryRepo = service_category_repository_1.serviceCategoryRepository, requestRepo = service_request_repository_1.serviceRequestRepository, audit = audit_service_1.auditService, outbox = outbox_service_1.outboxService) {
        this.categoryRepo = categoryRepo;
        this.requestRepo = requestRepo;
        this.audit = audit;
        this.outbox = outbox;
    }
    /**
     * Retrieves all active service categories (Public).
     */
    async getActiveCategories() {
        const categories = await this.categoryRepo.findActive();
        return categories.map(service_projection_1.toPublicServiceCategory);
    }
    /**
     * Retrieves a single active service category by slug (Public).
     */
    async getCategoryBySlug(slug) {
        const category = await this.categoryRepo.findBySlug(slug);
        if (!category || !category.isActive) {
            throw new errors_1.NotFoundError(`Service category not found: ${slug}`, errorCodes_1.ErrorCodes.SERVICE_NOT_FOUND);
        }
        return (0, service_projection_1.toPublicServiceCategory)(category);
    }
    /**
     * Validates submitted dynamic form fields against the category's active form definition.
     * Strict validation: rejects unknown fields, missing required fields, and type mismatches.
     */
    validateFormFields(category, submittedFields = {}) {
        const activeFields = (category.fields || []).filter((f) => f.active);
        const activeFieldMap = new Map(activeFields.map((f) => [f.key, f]));
        // Check for missing required fields
        for (const field of activeFields) {
            if (field.required) {
                const val = submittedFields[field.key];
                if (val === undefined || val === null || val === '') {
                    throw new errors_1.ValidationError(`Missing required field: ${field.key}`, { field: field.key }, errorCodes_1.ErrorCodes.INVALID_SERVICE_FORM);
                }
            }
        }
        // Check submitted fields for type validity and unknown keys
        for (const [key, val] of Object.entries(submittedFields)) {
            const fieldDef = activeFieldMap.get(key);
            if (!fieldDef) {
                throw new errors_1.ValidationError(`Unknown field submitted for service "${category.slug}": ${key}`, { field: key }, errorCodes_1.ErrorCodes.INVALID_SERVICE_FORM);
            }
            if (val === undefined || val === null || val === '') {
                continue;
            }
            switch (fieldDef.type) {
                case 'number':
                    if (typeof val !== 'number' || isNaN(val)) {
                        throw new errors_1.ValidationError(`Field "${key}" must be a number`, { field: key, expected: 'number' }, errorCodes_1.ErrorCodes.INVALID_SERVICE_FORM);
                    }
                    break;
                case 'boolean':
                    if (typeof val !== 'boolean') {
                        throw new errors_1.ValidationError(`Field "${key}" must be a boolean`, { field: key, expected: 'boolean' }, errorCodes_1.ErrorCodes.INVALID_SERVICE_FORM);
                    }
                    break;
                case 'select':
                    if (typeof val !== 'string' || (fieldDef.options && !fieldDef.options.includes(val))) {
                        throw new errors_1.ValidationError(`Invalid option for field "${key}". Allowed: ${fieldDef.options?.join(', ')}`, { field: key, allowed: fieldDef.options }, errorCodes_1.ErrorCodes.INVALID_SERVICE_FORM);
                    }
                    break;
                case 'text':
                case 'textarea':
                    if (typeof val !== 'string') {
                        throw new errors_1.ValidationError(`Field "${key}" must be a string`, { field: key, expected: 'string' }, errorCodes_1.ErrorCodes.INVALID_SERVICE_FORM);
                    }
                    break;
            }
        }
    }
    /**
     * Submits a new Service Request (Guest or Customer).
     * Generates reference, validates form against active category configuration,
     * rejects attachments, records audit and outbox side effects atomically.
     */
    async createServiceRequest(slug, input, access) {
        const category = await this.categoryRepo.findBySlug(slug);
        if (!category) {
            throw new errors_1.NotFoundError(`Service category not found: ${slug}`, errorCodes_1.ErrorCodes.SERVICE_NOT_FOUND);
        }
        if (!category.isActive) {
            throw new errors_1.BusinessRuleViolationError(errorCodes_1.ErrorCodes.SERVICE_INACTIVE, `Service category "${slug}" is currently inactive`);
        }
        // Server-authoritative dynamic form validation
        const submittedFields = input.submittedFields || {};
        this.validateFormFields(category, submittedFields);
        // Resolve customer / guest contact information
        let customerId = null;
        let guestAccessToken;
        let guestAccessTokenHash = null;
        let contactName;
        let contactPhone;
        let contactEmail = null;
        if (access.userId) {
            customerId = new mongoose_1.Types.ObjectId(access.userId);
            let userDoc = null;
            if (!input.contact?.phone || !input.contact?.name) {
                userDoc = await users_repository_1.usersRepository.findById(access.userId);
            }
            contactName = input.contact?.name || access.userSnapshot?.name || userDoc?.name || 'Customer';
            contactPhone = input.contact?.phone || access.userSnapshot?.phone || userDoc?.phone || '';
            contactEmail = input.contact?.email ?? access.userSnapshot?.email ?? userDoc?.email ?? null;
            if (!contactPhone) {
                throw new errors_1.ValidationError('Contact phone is required for service request', { field: 'contact.phone' });
            }
        }
        else {
            // Guest submission requires explicit contact details
            if (!input.contact?.name || !input.contact?.phone) {
                throw new errors_1.ValidationError('Guest service requests require contact name and phone number', { field: 'contact' });
            }
            contactName = input.contact.name.trim();
            contactPhone = input.contact.phone.trim();
            contactEmail = input.contact.email?.trim() || null;
            const guestTokens = (0, order_utils_1.generateGuestAccessToken)();
            guestAccessToken = guestTokens.rawToken;
            guestAccessTokenHash = guestTokens.tokenHash;
        }
        const reference = (0, service_utils_1.generateServiceReference)();
        return (0, transaction_1.withTransaction)(async (session) => {
            const ctx = { session, requestId: access.requestId };
            const request = await this.requestRepo.create({
                reference,
                customerId,
                guestAccessTokenHash,
                customerSnapshot: {
                    name: contactName,
                    phone: contactPhone,
                    email: contactEmail,
                },
                serviceCategoryId: category._id,
                serviceCategorySnapshot: {
                    slug: category.slug,
                    name: category.name,
                    formVersion: category.formVersion,
                },
                submittedFields,
                description: input.description.trim(),
                status: 'admin_review',
                quotationId: null,
                paymentId: null,
                communicationContext: input.communicationContext ?? null,
                statusHistory: [
                    {
                        status: 'admin_review',
                        changedBy: customerId,
                        changedAt: new Date(),
                        reason: 'Service request submitted by customer',
                    },
                ],
                version: 1,
            }, ctx);
            // Persist outbox event for downstream notification (Phase 13/14)
            await this.outbox.record({
                eventType: 'service_request.created',
                aggregateType: 'ServiceRequest',
                aggregateId: request._id.toString(),
                payload: {
                    reference: request.reference,
                    serviceCategoryId: category._id.toString(),
                    serviceSlug: category.slug,
                    customerId: customerId ? customerId.toString() : null,
                    status: request.status,
                    customerName: contactName,
                    customerPhone: contactPhone,
                },
                dedupeKey: `service_request_created:${request._id.toString()}`,
            }, session);
            // Record audit log
            await this.audit.record({
                actorId: access.userId ?? undefined,
                actorRole: access.role ?? 'guest',
                action: 'service_request_created',
                entityType: 'serviceRequest',
                entityId: request.reference,
                newState: { status: 'admin_review' },
                metadata: {
                    reference: request.reference,
                    categorySlug: category.slug,
                    formVersion: category.formVersion,
                },
                requestId: access.requestId,
                ipHash: access.ipHash,
            });
            return { request, guestAccessToken };
        });
    }
    /**
     * Retrieves service request by reference with strict ownership validation.
     */
    async getServiceRequestByReference(reference, access) {
        const request = await this.requestRepo.findByReference(reference);
        if (!request) {
            throw new errors_1.NotFoundError(`Service request not found: ${reference}`, errorCodes_1.ErrorCodes.SERVICE_REQUEST_NOT_FOUND);
        }
        // Admin / Owner bypass
        if (access.role === 'admin' || access.role === 'owner') {
            let quoteDoc = null;
            if (request.quotationId) {
                quoteDoc = await quotation_model_1.QuotationModel.findById(request.quotationId);
            }
            return (0, service_projection_1.toSafeServiceRequest)(request, quoteDoc);
        }
        // Registered Customer ownership
        if (access.userId) {
            if (request.customerId && request.customerId.toString() === access.userId) {
                let quoteDoc = null;
                if (request.quotationId) {
                    quoteDoc = await quotation_model_1.QuotationModel.findById(request.quotationId);
                }
                return (0, service_projection_1.toSafeServiceRequest)(request, quoteDoc);
            }
            throw new errors_1.ForbiddenError('You do not have permission to view this service request', errorCodes_1.ErrorCodes.SERVICE_OWNERSHIP_DENIED);
        }
        // Guest Token Access
        if (access.guestToken) {
            const hashed = (0, order_utils_1.hashGuestToken)(access.guestToken);
            if (request.guestAccessTokenHash === hashed) {
                let quoteDoc = null;
                if (request.quotationId) {
                    quoteDoc = await quotation_model_1.QuotationModel.findById(request.quotationId);
                }
                return (0, service_projection_1.toSafeServiceRequest)(request, quoteDoc);
            }
            throw new errors_1.ForbiddenError('Invalid guest service access token', errorCodes_1.ErrorCodes.SERVICE_OWNERSHIP_DENIED);
        }
        throw new errors_1.ForbiddenError('Authentication or guest access token required to view this service request', errorCodes_1.ErrorCodes.SERVICE_OWNERSHIP_DENIED);
    }
}
exports.ServiceService = ServiceService;
exports.serviceService = new ServiceService();
//# sourceMappingURL=service.service.js.map