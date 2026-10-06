"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.preorderService = exports.PreorderService = void 0;
const mongoose_1 = require("mongoose");
const preorder_repository_1 = require("../repositories/preorder.repository");
const product_repository_1 = require("../../products/repositories/product.repository");
const user_model_1 = require("../../users/models/user.model");
const audit_service_1 = require("../../audit/services/audit.service");
const outbox_service_1 = require("../../notifications/services/outbox.service");
const notification_service_1 = require("../../notifications/services/notification.service");
const notification_types_1 = require("../../notifications/types/notification.types");
const transaction_1 = require("../../../database/transaction");
const preorder_utils_1 = require("../utils/preorder.utils");
const preorder_projection_1 = require("../utils/preorder.projection");
const errors_1 = require("../../../common/errors");
const errorCodes_1 = require("../../../common/errors/errorCodes");
const pagination_1 = require("../../../common/http/pagination");
class PreorderService {
    preorderRepo;
    productRepo;
    audit;
    outbox;
    notifications;
    constructor(preorderRepo = preorder_repository_1.preorderRepository, productRepo = product_repository_1.productRepository, audit = audit_service_1.auditService, outbox = outbox_service_1.outboxService, notifications = notification_service_1.notificationService) {
        this.preorderRepo = preorderRepo;
        this.productRepo = productRepo;
        this.audit = audit;
        this.outbox = outbox;
        this.notifications = notifications;
    }
    /**
     * Helper: checks if a product or variant is out of stock.
     */
    isOutOfStock(stockTotal, stockReserved, availability) {
        const availableStock = stockTotal - stockReserved;
        return availableStock <= 0 || availability === 'out_of_stock' || availability === 'pre_order_eligible';
    }
    /**
     * Creates a new Pre-order request for an eligible, out-of-stock product/variant.
     *
     * PRE-001: Only out-of-stock, pre-order-eligible products/variants can create a pre-order.
     * PRE-002: Enters Admin Review before proceeding (status: 'requested' / 'admin_review').
     * PRE-004: Retains customer, product/variant, quantity, captured price snapshot, and statuses.
     * OD-10: Price snapshot captured at request time; no price policy hard-coded.
     * OD-11: No inventory reservation created (acceptance/creation creates no stock reservation).
     */
    async createPreorder(slug, input, access) {
        // 1. Fetch published product
        const product = await this.productRepo.findBySlug(slug);
        if (!product || !product.isPublished) {
            throw new errors_1.NotFoundError('Product not found', errorCodes_1.ErrorCodes.PRODUCT_NOT_FOUND);
        }
        // 2. Validate variant if product has variants
        let variantId = null;
        let variantLabel = null;
        let sku = product.metadata?.isbn || null;
        let image = product.images?.[0]?.publicId || null;
        let capturedPriceMinor = product.priceMinor;
        let currency = product.currency || 'EGP';
        let attributes = {};
        if (product.hasVariants) {
            if (!input.variantId) {
                throw new errors_1.ValidationError('Product requires a valid variantId for pre-ordering', null, errorCodes_1.ErrorCodes.VARIANT_REQUIRED);
            }
            const variant = product.variants.find((v) => v.variantId === input.variantId);
            if (!variant) {
                throw new errors_1.NotFoundError(`Variant "${input.variantId}" not found on product`, errorCodes_1.ErrorCodes.VARIANT_NOT_FOUND);
            }
            // Check variant pre-order eligibility
            const isEligible = variant.preOrderEligible || variant.availability === 'pre_order_eligible';
            if (!isEligible) {
                throw new errors_1.BusinessRuleViolationError(errorCodes_1.ErrorCodes.PREORDER_NOT_ELIGIBLE, 'This product variant is not eligible for pre-order');
            }
            // Check variant stock (must be out of stock)
            const outOfStock = this.isOutOfStock(variant.stockTotal, variant.stockReserved, variant.availability);
            if (!outOfStock && variant.availability === 'in_stock') {
                throw new errors_1.BusinessRuleViolationError(errorCodes_1.ErrorCodes.PREORDER_NOT_OUT_OF_STOCK, 'Product variant is currently in stock; add to cart instead of pre-ordering');
            }
            variantId = variant.variantId;
            variantLabel = variant.label;
            sku = variant.sku || null;
            if (variant.images && variant.images.length > 0) {
                image = variant.images[0].publicId;
            }
            capturedPriceMinor = variant.priceMinor;
            currency = variant.currency || 'EGP';
            if (variant.attributes) {
                attributes = variant.attributes instanceof Map ? Object.fromEntries(variant.attributes) : variant.attributes;
            }
        }
        else {
            // Standalone product without variants
            const isEligible = product.preOrderEligible || product.availability === 'pre_order_eligible';
            if (!isEligible) {
                throw new errors_1.BusinessRuleViolationError(errorCodes_1.ErrorCodes.PREORDER_NOT_ELIGIBLE, 'This product is not eligible for pre-order');
            }
            // Check product stock (must be out of stock)
            const outOfStock = this.isOutOfStock(product.stockTotal, product.stockReserved, product.availability);
            if (!outOfStock && product.availability === 'in_stock') {
                throw new errors_1.BusinessRuleViolationError(errorCodes_1.ErrorCodes.PREORDER_NOT_OUT_OF_STOCK, 'Product is currently in stock; add to cart instead of pre-ordering');
            }
        }
        // 3. Resolve customer identity and contact snapshot
        let customerId = null;
        let customerSnapshot;
        if (access.userId) {
            customerId = new mongoose_1.Types.ObjectId(access.userId);
            if (input.customer && input.customer.name && input.customer.phone) {
                customerSnapshot = {
                    name: input.customer.name.trim(),
                    phone: input.customer.phone.trim(),
                    email: input.customer.email ? input.customer.email.trim().toLowerCase() : null,
                };
            }
            else {
                const user = await user_model_1.UserModel.findById(customerId).lean().exec();
                if (!user) {
                    throw new errors_1.NotFoundError('Authenticated user not found', errorCodes_1.ErrorCodes.NOT_FOUND);
                }
                customerSnapshot = {
                    name: user.name,
                    phone: user.phone,
                    email: user.email || null,
                };
            }
        }
        else {
            // Guest pre-order: contact info is mandatory
            if (!input.customer || !input.customer.name || !input.customer.phone) {
                throw new errors_1.ValidationError('Customer name and phone are required for guest pre-orders', errorCodes_1.ErrorCodes.VALIDATION_ERROR);
            }
            customerSnapshot = {
                name: input.customer.name.trim(),
                phone: input.customer.phone.trim(),
                email: input.customer.email ? input.customer.email.trim().toLowerCase() : null,
            };
        }
        // 4. Quantity validation
        const quantity = input.quantity ?? 1;
        if (!Number.isInteger(quantity) || quantity < 1) {
            throw new errors_1.ValidationError('Quantity must be an integer greater than 0', errorCodes_1.ErrorCodes.INVALID_QUANTITY);
        }
        // 5. Generate unique reference
        const reference = (0, preorder_utils_1.generatePreorderReference)();
        // 6. Execute atomic creation within transaction
        const createdPreorder = await (0, transaction_1.withTransaction)(async (session) => {
            const preorderData = {
                reference,
                customerId,
                customerSnapshot,
                productId: product._id,
                variantId,
                productSnapshot: {
                    name: {
                        ar: product.name.ar,
                        en: product.name.en ?? null,
                    },
                    slug: product.slug,
                    variantLabel,
                    sku,
                    image,
                    attributes,
                },
                quantity,
                capturedPriceMinor,
                currency,
                status: 'requested',
                expectedAvailabilityAt: null,
                paymentId: null,
                linkedOrderId: null,
                allocationSequence: null, // OD-11: Open Decision
                notes: input.notes ? input.notes.trim() : null,
                version: 1,
            };
            const doc = await this.preorderRepo.create(preorderData, { session });
            // Outbox event for asynchronous notification / admin alert (Section 48.7)
            await this.outbox.record({
                eventType: 'preorder.created',
                aggregateType: 'Preorder',
                aggregateId: doc._id.toString(),
                payload: {
                    reference: doc.reference,
                    customerId: customerId ? customerId.toString() : null,
                    productId: product._id.toString(),
                    variantId,
                    quantity: doc.quantity,
                    capturedPriceMinor: doc.capturedPriceMinor,
                    currency: doc.currency,
                    status: doc.status,
                    customerName: customerSnapshot.name,
                    customerPhone: customerSnapshot.phone,
                },
            }, session);
            return doc;
        });
        return (0, preorder_projection_1.toSafePreorderDto)(createdPreorder);
    }
    /**
     * Admin accepts a pre-order request.
     *
     * PRE-003: Once Admin accepts a pre-order request, customer can pay immediately ('accepted' -> 'payment_pending').
     * PRE-006: System shall NOT display or promise a specific availability date unless Admin entered one.
     * OD-11: Acceptance creates NO inventory reservation.
     * Section 48.7: POST /admin/pre-orders/:reference/accept -> Audit/outbox, 200 accepted.
     * Idempotent: Repeated acceptance returns existing accepted pre-order without duplicate side effects.
     */
    async acceptPreorder(reference, input, access) {
        const existing = await this.preorderRepo.findByReference(reference);
        if (!existing) {
            throw new errors_1.NotFoundError(`Pre-order "${reference}" not found`, errorCodes_1.ErrorCodes.PREORDER_NOT_FOUND);
        }
        // Idempotency: If already accepted or awaiting payment, return existing state
        if (existing.status === 'accepted' || existing.status === 'payment_pending') {
            if (input.expectedVersion !== undefined && existing.version !== input.expectedVersion) {
                throw new errors_1.ConflictError(errorCodes_1.ErrorCodes.PREORDER_VERSION_CONFLICT, 'Pre-order version conflict; record has already changed');
            }
            return (0, preorder_projection_1.toSafePreorderDto)(existing, true);
        }
        // State transition guard: can only accept from 'requested' or 'admin_review' (or 'pending' legacy)
        const validPreviousStates = ['requested', 'admin_review', 'pending'];
        if (!validPreviousStates.includes(existing.status)) {
            throw new errors_1.ConflictError(errorCodes_1.ErrorCodes.PREORDER_STATE_CONFLICT, `Cannot accept pre-order in current status: "${existing.status}"`);
        }
        // Optimistic version check
        if (input.expectedVersion !== undefined && existing.version !== input.expectedVersion) {
            throw new errors_1.ConflictError(errorCodes_1.ErrorCodes.PREORDER_VERSION_CONFLICT, 'Pre-order version conflict; record was updated concurrently');
        }
        // Parse optional expected availability date (PRE-006)
        let parsedAvailabilityDate = null;
        if (input.expectedAvailabilityAt) {
            parsedAvailabilityDate = new Date(input.expectedAvailabilityAt);
            if (isNaN(parsedAvailabilityDate.getTime())) {
                throw new errors_1.ValidationError('Invalid expectedAvailabilityAt date format', errorCodes_1.ErrorCodes.VALIDATION_ERROR);
            }
        }
        const acceptedPreorder = await (0, transaction_1.withTransaction)(async (session) => {
            const updatePayload = {
                status: 'accepted',
                acceptedAt: new Date(),
                adminNotes: input.adminNotes ? input.adminNotes.trim() : existing.adminNotes,
                expectedAvailabilityAt: parsedAvailabilityDate ?? existing.expectedAvailabilityAt,
            };
            const updated = await this.preorderRepo.updateStatusWithVersion(reference, validPreviousStates, 'accepted', updatePayload, input.expectedVersion, { session });
            if (!updated) {
                throw new errors_1.ConflictError(errorCodes_1.ErrorCodes.PREORDER_VERSION_CONFLICT, 'Pre-order update conflict; record status or version changed concurrently');
            }
            // Record immutable audit log
            await this.audit.record({
                actorId: access.userId ? new mongoose_1.Types.ObjectId(access.userId) : null,
                actorRole: access.role || 'admin',
                action: 'preorder.accepted',
                entityType: 'Preorder',
                entityId: updated._id.toString(),
                previousState: { status: existing.status, version: existing.version },
                newState: { status: updated.status, version: updated.version },
                metadata: {
                    reference: updated.reference,
                    expectedAvailabilityAt: updated.expectedAvailabilityAt,
                },
                requestId: access.requestId || null,
                ipHash: access.ipHash || null,
            }, { session });
            // Record outbox event for downstream delivery
            await this.outbox.record({
                eventType: 'preorder.accepted',
                aggregateType: 'Preorder',
                aggregateId: updated._id.toString(),
                payload: {
                    reference: updated.reference,
                    customerId: updated.customerId ? updated.customerId.toString() : null,
                    status: updated.status,
                    expectedAvailabilityAt: updated.expectedAvailabilityAt,
                },
            }, session);
            // Notify customer if associated with an account
            if (updated.customerId) {
                await this.notifications.createNotification({
                    recipientUserId: updated.customerId,
                    type: notification_types_1.NotificationTypes.PREORDER_STATUS_CHANGED,
                    title: {
                        ar: 'تم قبول طلب الحجز المسبق',
                        en: 'Pre-order Accepted',
                    },
                    body: {
                        ar: `تمت الموافقة على طلب الحجز المسبق رقم ${updated.reference}. يمكنك الآن متابعة الدفع.`,
                        en: `Your pre-order ${updated.reference} has been accepted. You can now proceed to payment.`,
                    },
                    entityType: 'Preorder',
                    entityId: updated._id.toString(),
                    actionUrl: `/pre-orders/${updated.reference}`,
                    dedupeKey: `preorder:${updated._id.toString()}:accepted`,
                }, session);
            }
            return updated;
        });
        return (0, preorder_projection_1.toSafePreorderDto)(acceptedPreorder, true);
    }
    /**
     * Admin rejects a pre-order request.
     * Idempotent: Repeated rejection returns existing rejected record.
     */
    async rejectPreorder(reference, input, access) {
        const existing = await this.preorderRepo.findByReference(reference);
        if (!existing) {
            throw new errors_1.NotFoundError(`Pre-order "${reference}" not found`, errorCodes_1.ErrorCodes.PREORDER_NOT_FOUND);
        }
        if (existing.status === 'rejected') {
            if (input.expectedVersion !== undefined && existing.version !== input.expectedVersion) {
                throw new errors_1.ConflictError(errorCodes_1.ErrorCodes.PREORDER_VERSION_CONFLICT, 'Pre-order version conflict; record has already changed');
            }
            return (0, preorder_projection_1.toSafePreorderDto)(existing, true);
        }
        const validPreviousStates = ['requested', 'admin_review', 'pending'];
        if (!validPreviousStates.includes(existing.status)) {
            throw new errors_1.ConflictError(errorCodes_1.ErrorCodes.PREORDER_STATE_CONFLICT, `Cannot reject pre-order in current status: "${existing.status}"`);
        }
        if (input.expectedVersion !== undefined && existing.version !== input.expectedVersion) {
            throw new errors_1.ConflictError(errorCodes_1.ErrorCodes.PREORDER_VERSION_CONFLICT, 'Pre-order version conflict; record was updated concurrently');
        }
        const rejectedPreorder = await (0, transaction_1.withTransaction)(async (session) => {
            const updatePayload = {
                status: 'rejected',
                rejectedAt: new Date(),
                rejectionReason: input.reason ? input.reason.trim() : null,
            };
            const updated = await this.preorderRepo.updateStatusWithVersion(reference, validPreviousStates, 'rejected', updatePayload, input.expectedVersion, { session });
            if (!updated) {
                throw new errors_1.ConflictError(errorCodes_1.ErrorCodes.PREORDER_VERSION_CONFLICT, 'Pre-order update conflict; record status or version changed concurrently');
            }
            await this.audit.record({
                actorId: access.userId ? new mongoose_1.Types.ObjectId(access.userId) : null,
                actorRole: access.role || 'admin',
                action: 'preorder.rejected',
                entityType: 'Preorder',
                entityId: updated._id.toString(),
                previousState: { status: existing.status, version: existing.version },
                newState: { status: updated.status, version: updated.version },
                reason: input.reason || null,
                metadata: { reference: updated.reference },
                requestId: access.requestId || null,
                ipHash: access.ipHash || null,
            }, { session });
            await this.outbox.record({
                eventType: 'preorder.rejected',
                aggregateType: 'Preorder',
                aggregateId: updated._id.toString(),
                payload: {
                    reference: updated.reference,
                    customerId: updated.customerId ? updated.customerId.toString() : null,
                    status: updated.status,
                    reason: updated.rejectionReason,
                },
            }, session);
            if (updated.customerId) {
                await this.notifications.createNotification({
                    recipientUserId: updated.customerId,
                    type: notification_types_1.NotificationTypes.PREORDER_STATUS_CHANGED,
                    title: {
                        ar: 'تم رفض طلب الحجز المسبق',
                        en: 'Pre-order Rejected',
                    },
                    body: {
                        ar: `نعتذر، تم رفض طلب الحجز المسبق رقم ${updated.reference}.`,
                        en: `Your pre-order ${updated.reference} was rejected.`,
                    },
                    entityType: 'Preorder',
                    entityId: updated._id.toString(),
                    actionUrl: `/pre-orders/${updated.reference}`,
                    dedupeKey: `preorder:${updated._id.toString()}:rejected`,
                }, session);
            }
            return updated;
        });
        return (0, preorder_projection_1.toSafePreorderDto)(rejectedPreorder, true);
    }
    /**
     * Cancels a pre-order request by customer (ownership check) or admin.
     */
    async cancelPreorder(reference, input, access) {
        const existing = await this.preorderRepo.findByReference(reference);
        if (!existing) {
            throw new errors_1.NotFoundError(`Pre-order "${reference}" not found`, errorCodes_1.ErrorCodes.PREORDER_NOT_FOUND);
        }
        // Ownership check: non-admin can only cancel their own pre-order
        const isAdmin = access.role === 'admin' || access.role === 'owner' || access.permissions?.includes('preorders.write');
        if (!isAdmin) {
            if (!access.userId || !existing.customerId || existing.customerId.toString() !== access.userId) {
                throw new errors_1.ForbiddenError('You are not authorized to cancel this pre-order', errorCodes_1.ErrorCodes.PREORDER_OWNERSHIP_DENIED);
            }
        }
        if (existing.status === 'cancelled') {
            return (0, preorder_projection_1.toSafePreorderDto)(existing, isAdmin);
        }
        // Only allow cancellation before fulfillment/availability
        const cancellableStates = [
            'requested',
            'admin_review',
            'pending',
            'accepted',
            'payment_pending',
        ];
        if (!cancellableStates.includes(existing.status)) {
            throw new errors_1.ConflictError(errorCodes_1.ErrorCodes.PREORDER_STATE_CONFLICT, `Cannot cancel pre-order in status: "${existing.status}"`);
        }
        const cancelledPreorder = await (0, transaction_1.withTransaction)(async (session) => {
            const updatePayload = {
                status: 'cancelled',
                cancelledAt: new Date(),
                cancellationReason: input.reason ? input.reason.trim() : null,
            };
            const updated = await this.preorderRepo.updateStatusWithVersion(reference, cancellableStates, 'cancelled', updatePayload, undefined, { session });
            if (!updated) {
                throw new errors_1.ConflictError(errorCodes_1.ErrorCodes.PREORDER_STATE_CONFLICT, 'Pre-order cancellation conflict; status changed concurrently');
            }
            await this.audit.record({
                actorId: access.userId ? new mongoose_1.Types.ObjectId(access.userId) : null,
                actorRole: access.role || 'customer',
                action: 'preorder.cancelled',
                entityType: 'Preorder',
                entityId: updated._id.toString(),
                previousState: { status: existing.status, version: existing.version },
                newState: { status: updated.status, version: updated.version },
                reason: input.reason || null,
                metadata: { reference: updated.reference },
                requestId: access.requestId || null,
                ipHash: access.ipHash || null,
            }, { session });
            await this.outbox.record({
                eventType: 'preorder.cancelled',
                aggregateType: 'Preorder',
                aggregateId: updated._id.toString(),
                payload: {
                    reference: updated.reference,
                    customerId: updated.customerId ? updated.customerId.toString() : null,
                    status: updated.status,
                    reason: updated.cancellationReason,
                },
            }, session);
            return updated;
        });
        return (0, preorder_projection_1.toSafePreorderDto)(cancelledPreorder, isAdmin);
    }
    /**
     * Transitions a confirmed pre-order to 'available' when stock arrives (PRE-005).
     */
    async markAvailable(reference, access) {
        const existing = await this.preorderRepo.findByReference(reference);
        if (!existing) {
            throw new errors_1.NotFoundError(`Pre-order "${reference}" not found`, errorCodes_1.ErrorCodes.PREORDER_NOT_FOUND);
        }
        if (existing.status === 'available') {
            return (0, preorder_projection_1.toSafePreorderDto)(existing, true);
        }
        const validPreviousStates = ['confirmed', 'accepted'];
        if (!validPreviousStates.includes(existing.status)) {
            throw new errors_1.ConflictError(errorCodes_1.ErrorCodes.PREORDER_STATE_CONFLICT, `Pre-order cannot be marked available from current status: "${existing.status}"`);
        }
        const updated = await (0, transaction_1.withTransaction)(async (session) => {
            const doc = await this.preorderRepo.updateStatusWithVersion(reference, validPreviousStates, 'available', { availableAt: new Date() }, undefined, { session });
            if (!doc) {
                throw new errors_1.ConflictError(errorCodes_1.ErrorCodes.PREORDER_STATE_CONFLICT, 'Pre-order state conflict during availability transition');
            }
            await this.audit.record({
                actorId: access.userId ? new mongoose_1.Types.ObjectId(access.userId) : null,
                actorRole: access.role || 'admin',
                action: 'preorder.available',
                entityType: 'Preorder',
                entityId: doc._id.toString(),
                previousState: { status: existing.status },
                newState: { status: doc.status },
                metadata: { reference: doc.reference },
                requestId: access.requestId || null,
            }, { session });
            await this.outbox.record({
                eventType: 'preorder.available',
                aggregateType: 'Preorder',
                aggregateId: doc._id.toString(),
                payload: { reference: doc.reference, customerId: doc.customerId, status: 'available' },
            }, session);
            if (doc.customerId) {
                await this.notifications.createNotification({
                    recipientUserId: doc.customerId,
                    type: notification_types_1.NotificationTypes.PREORDER_STATUS_CHANGED,
                    title: { ar: 'المنتج المحجوز أصبح متوفراً', en: 'Pre-ordered Item Available' },
                    body: {
                        ar: `المنتج في طلب الحجز المسبق ${doc.reference} أصبح متوفراً الآن وجارٍ تجهيزه.`,
                        en: `Item for pre-order ${doc.reference} is now available and preparing for fulfillment.`,
                    },
                    entityType: 'Preorder',
                    entityId: doc._id.toString(),
                    actionUrl: `/pre-orders/${doc.reference}`,
                    dedupeKey: `preorder:${doc._id.toString()}:available`,
                }, session);
            }
            return doc;
        });
        return (0, preorder_projection_1.toSafePreorderDto)(updated, true);
    }
    /**
     * Retrieves a single pre-order by reference with strict ownership enforcement.
     */
    async getPreorderByReference(reference, access) {
        const preorder = await this.preorderRepo.findByReference(reference);
        if (!preorder) {
            throw new errors_1.NotFoundError(`Pre-order "${reference}" not found`, errorCodes_1.ErrorCodes.PREORDER_NOT_FOUND);
        }
        const isAdmin = access.role === 'admin' ||
            access.role === 'owner' ||
            (access.permissions && access.permissions.includes('preorders.write'));
        if (!isAdmin) {
            if (!access.userId || !preorder.customerId || preorder.customerId.toString() !== access.userId) {
                throw new errors_1.ForbiddenError('Access denied: You can only view your own pre-orders', errorCodes_1.ErrorCodes.PREORDER_OWNERSHIP_DENIED);
            }
        }
        return (0, preorder_projection_1.toSafePreorderDto)(preorder, isAdmin);
    }
    /**
     * Retrieves paginated pre-orders owned by the authenticated customer.
     * Guarantees that customers never see other customers' records.
     */
    async listCustomerPreorders(access, filter, pagination) {
        if (!access.userId) {
            throw new errors_1.ForbiddenError('Authentication required to view pre-orders', errorCodes_1.ErrorCodes.AUTH_REQUIRED);
        }
        const { preorders, total } = await this.preorderRepo.findCustomerPreorders(access.userId, filter, { skip: pagination.skip, limit: pagination.limit });
        const safeList = preorders.map((doc) => (0, preorder_projection_1.toSafePreorderDto)(doc, false));
        const paginationMeta = (0, pagination_1.createPaginationMeta)({
            page: pagination.page,
            limit: pagination.limit,
            total,
        });
        return { preorders: safeList, pagination: paginationMeta };
    }
    /**
     * Retrieves paginated pre-orders for Admin with multi-field filtering.
     */
    async listAdminPreorders(filter, pagination) {
        const { preorders, total } = await this.preorderRepo.findAdminPreorders(filter, { skip: pagination.skip, limit: pagination.limit });
        const safeList = preorders.map((doc) => (0, preorder_projection_1.toSafePreorderDto)(doc, true));
        const paginationMeta = (0, pagination_1.createPaginationMeta)({
            page: pagination.page,
            limit: pagination.limit,
            total,
        });
        return { preorders: safeList, pagination: paginationMeta };
    }
}
exports.PreorderService = PreorderService;
exports.preorderService = new PreorderService();
//# sourceMappingURL=preorder.service.js.map