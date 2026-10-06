"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.orderService = exports.OrderService = void 0;
const mongoose_1 = require("mongoose");
const order_repository_1 = require("../repositories/order.repository");
const cart_repository_1 = require("../../carts/repositories/cart.repository");
const product_repository_1 = require("../../products/repositories/product.repository");
const shipping_service_1 = require("../../shipping/services/shipping.service");
const inventory_service_1 = require("../../inventory/services/inventory.service");
const audit_service_1 = require("../../audit/services/audit.service");
const transaction_1 = require("../../../database/transaction");
const order_utils_1 = require("../utils/order.utils");
const order_state_machine_1 = require("../utils/order-state-machine");
const errors_1 = require("../../../common/errors");
const errorCodes_1 = require("../../../common/errors/errorCodes");
const payment_repository_1 = require("../../payments/repositories/payment.repository");
const payment_methods_config_1 = require("../../payments/utils/payment-methods.config");
const coupon_service_1 = require("../../coupons/services/coupon.service");
const outbox_service_1 = require("../../notifications/services/outbox.service");
class OrderService {
    orderRepo;
    cartRepo;
    productRepo;
    shipService;
    invService;
    audit;
    paymentRepo;
    couponSvc;
    outbox;
    constructor(orderRepo = order_repository_1.orderRepository, cartRepo = cart_repository_1.cartRepository, productRepo = product_repository_1.productRepository, shipService = shipping_service_1.shippingService, invService = inventory_service_1.inventoryService, audit = audit_service_1.auditService, paymentRepo = payment_repository_1.paymentRepository, couponSvc = coupon_service_1.couponService, outbox = outbox_service_1.outboxService) {
        this.orderRepo = orderRepo;
        this.cartRepo = cartRepo;
        this.productRepo = productRepo;
        this.shipService = shipService;
        this.invService = invService;
        this.audit = audit;
        this.paymentRepo = paymentRepo;
        this.couponSvc = couponSvc;
        this.outbox = outbox;
    }
    /**
     * Authoritative Order Creation from Cart (Checkout).
     * Transactional, idempotent, with strict catalog revalidation.
     * NOTE: Order creation does NOT reserve inventory!
     */
    async createOrder(input, context) {
        const incomingOwnerKey = context.owner.ownerType === 'user'
            ? `user:${context.owner.userId}`
            : `guest:${context.owner.sessionId}`;
        const incomingFingerprint = (0, order_utils_1.calculateIdempotencyFingerprint)(input);
        // 1. Idempotency Check (Owner-scoped)
        const existingOrder = await this.orderRepo.findByIdempotencyKey(input.idempotencyKey);
        if (existingOrder) {
            if (existingOrder.idempotencyFingerprint !== incomingFingerprint) {
                throw new errors_1.ConflictError(errorCodes_1.ErrorCodes.IDEMPOTENCY_KEY_REUSED, 'Idempotency key was already used with a different request payload');
            }
            if (existingOrder.idempotencyOwner && existingOrder.idempotencyOwner !== incomingOwnerKey) {
                throw new errors_1.ConflictError(errorCodes_1.ErrorCodes.IDEMPOTENCY_KEY_REUSED, 'Idempotency key was already used by another owner');
            }
            // Verify owner match
            if (context.owner.ownerType === 'user') {
                if (existingOrder.customerId?.toString() !== context.owner.userId) {
                    throw new errors_1.ConflictError(errorCodes_1.ErrorCodes.IDEMPOTENCY_KEY_REUSED, 'Idempotency key belongs to another user');
                }
            }
            else {
                if (existingOrder.customerId) {
                    throw new errors_1.ConflictError(errorCodes_1.ErrorCodes.IDEMPOTENCY_KEY_REUSED, 'Idempotency key belongs to another user');
                }
            }
            return { order: existingOrder };
        }
        // 2. Validate Payment Method Configuration
        const normalizedPaymentMethodKey = input.paymentMethodKey.trim().toLowerCase();
        const SUPPORTED_PAYMENT_METHODS = [
            'cod',
            'instapay',
            'vodafone_cash',
            'orange_cash',
            'etisalat_cash',
            'we_pay',
        ];
        if (!SUPPORTED_PAYMENT_METHODS.includes(normalizedPaymentMethodKey)) {
            throw new errors_1.BusinessRuleViolationError(errorCodes_1.ErrorCodes.PAYMENT_METHOD_UNAVAILABLE, `Payment method "${input.paymentMethodKey}" is unavailable or not supported`);
        }
        // 3. Multi-document Transaction with concurrency handling
        try {
            return await (0, transaction_1.withTransaction)(async (session) => {
                const ctx = { session, requestId: context.requestId };
                // Check if concurrent request already created order with this key
                const concurrentOrder = await this.orderRepo.findByIdempotencyKey(input.idempotencyKey, ctx);
                if (concurrentOrder) {
                    if (concurrentOrder.idempotencyFingerprint !== incomingFingerprint) {
                        throw new errors_1.ConflictError(errorCodes_1.ErrorCodes.IDEMPOTENCY_KEY_REUSED, 'Idempotency key was already used with a different request payload');
                    }
                    if (concurrentOrder.idempotencyOwner && concurrentOrder.idempotencyOwner !== incomingOwnerKey) {
                        throw new errors_1.ConflictError(errorCodes_1.ErrorCodes.IDEMPOTENCY_KEY_REUSED, 'Idempotency key belongs to another user or session');
                    }
                    return { order: concurrentOrder };
                }
                // Load active cart within transaction session
                const cart = await this.cartRepo.findActiveByOwner(context.owner, session);
                if (!cart || cart.items.length === 0) {
                    // In case a concurrent checkout request just cleared this cart and created the order:
                    const orderRecheck = await this.orderRepo.findByIdempotencyKey(input.idempotencyKey, ctx);
                    if (orderRecheck) {
                        if (orderRecheck.idempotencyFingerprint !== incomingFingerprint) {
                            throw new errors_1.ConflictError(errorCodes_1.ErrorCodes.IDEMPOTENCY_KEY_REUSED, 'Idempotency key was already used with a different request payload');
                        }
                        if (orderRecheck.idempotencyOwner && orderRecheck.idempotencyOwner !== incomingOwnerKey) {
                            throw new errors_1.ConflictError(errorCodes_1.ErrorCodes.IDEMPOTENCY_KEY_REUSED, 'Idempotency key belongs to another user or session');
                        }
                        return { order: orderRecheck };
                    }
                    throw new errors_1.BusinessRuleViolationError(errorCodes_1.ErrorCodes.CART_EMPTY, 'Cannot checkout with an empty or non-existent cart');
                }
                // Re-read current catalog values & revalidate price/availability
                let productSubtotalMinor = 0;
                const orderItems = [];
                for (const cartItem of cart.items) {
                    const product = await this.productRepo.findById(cartItem.productId, session);
                    if (!product || !product.isPublished) {
                        throw new errors_1.BusinessRuleViolationError(errorCodes_1.ErrorCodes.AVAILABILITY_CHANGED, `Product is no longer available: ${cartItem.productNameSnapshot.ar}`);
                    }
                    let currentPriceMinor = 0;
                    let currentAvailability = '';
                    let stockItemKey = product._id.toString();
                    let selectedAttributes = {};
                    if (product.hasVariants) {
                        if (!cartItem.variantId) {
                            throw new errors_1.ValidationError('Variant ID is required for product with variants');
                        }
                        const variant = product.variants.find((v) => v.variantId === cartItem.variantId);
                        if (!variant || variant.availability === 'out_of_stock') {
                            throw new errors_1.BusinessRuleViolationError(errorCodes_1.ErrorCodes.AVAILABILITY_CHANGED, `Product variant is no longer available: ${cartItem.productNameSnapshot.ar}`);
                        }
                        currentPriceMinor = variant.priceMinor;
                        currentAvailability = variant.availability;
                        stockItemKey = `${product._id.toString()}:${variant.variantId}`;
                        selectedAttributes =
                            variant.attributes instanceof Map
                                ? Object.fromEntries(variant.attributes)
                                : variant.attributes || {};
                    }
                    else {
                        if (product.availability === 'out_of_stock') {
                            throw new errors_1.BusinessRuleViolationError(errorCodes_1.ErrorCodes.AVAILABILITY_CHANGED, `Product is out of stock: ${product.name.ar}`);
                        }
                        currentPriceMinor = product.priceMinor;
                        currentAvailability = product.availability;
                    }
                    // PRICE_CHANGED Check
                    if (currentPriceMinor !== cartItem.unitPriceMinor) {
                        throw new errors_1.ConflictError(errorCodes_1.ErrorCodes.PRICE_CHANGED, `Price changed for item "${cartItem.productNameSnapshot.ar}". Please refresh your cart.`);
                    }
                    const lineTotalMinor = currentPriceMinor * cartItem.quantity;
                    productSubtotalMinor += lineTotalMinor;
                    orderItems.push({
                        productId: product._id,
                        variantId: cartItem.variantId ?? null,
                        nameSnapshot: {
                            ar: product.name.ar,
                            en: product.name.en ?? null,
                        },
                        imageSnapshot: cartItem.imageSnapshot ?? null,
                        categorySnapshot: product.categoryId.toString(),
                        attributesSnapshot: selectedAttributes,
                        quantity: cartItem.quantity,
                        unitPriceMinor: currentPriceMinor,
                        lineTotalMinor,
                        availabilityAtSubmission: currentAvailability,
                        stockItemKey,
                    });
                }
                // Calculate Shipping Estimate
                const shippingEstimate = await this.shipService.estimateShipping({
                    method: input.fulfillment.method,
                    governorate: input.fulfillment.address?.governorate,
                    city: input.fulfillment.address?.city,
                    area: input.fulfillment.address?.area ?? undefined,
                });
                if (!shippingEstimate.serviceable) {
                    throw new errors_1.BusinessRuleViolationError(errorCodes_1.ErrorCodes.SHIPPING_CONFIGURATION_UNAVAILABLE, 'Shipping destination is not serviceable');
                }
                const shippingCostMinor = shippingEstimate.costMinor;
                // 5. Server-side coupon validation and discount calculation (COUP-001 to COUP-005)
                let discountMinor = 0;
                let couponSnapshotData = null;
                let validatedCouponId = null;
                if (input.couponCode && input.couponCode.trim().length > 0) {
                    const cartItemsForCoupon = orderItems.map((it) => ({
                        productId: it.productId,
                        categoryId: it.categorySnapshot ?? null,
                        categorySnapshot: it.categorySnapshot ?? null,
                        unitPriceMinor: it.unitPriceMinor,
                        quantity: it.quantity,
                        lineTotalMinor: it.lineTotalMinor,
                    }));
                    // Re-validate coupon server-side inside transaction — never trust pre-checked result
                    const couponResult = await this.couponSvc.validateCoupon({
                        code: input.couponCode,
                        customerId: context.owner.ownerType === 'user' ? context.owner.userId : null,
                        items: cartItemsForCoupon,
                        subtotalMinor: productSubtotalMinor,
                    }, session);
                    discountMinor = couponResult.discountMinor;
                    validatedCouponId = new mongoose_1.Types.ObjectId(couponResult.couponId);
                    couponSnapshotData = {
                        couponId: couponResult.couponId,
                        code: couponResult.code,
                        discountType: couponResult.discountType,
                        value: couponResult.value,
                        discountMinor: couponResult.discountMinor,
                        scopeType: couponResult.scopeType,
                        scopeIds: couponResult.scopeIds,
                    };
                }
                // Order total: items subtotal - coupon discount + shipping (Section 16)
                // Discount never exceeds subtotal; minimum total is 0
                const totalMinor = Math.max(0, productSubtotalMinor - discountMinor + shippingCostMinor);
                // Guest Token Generation
                let guestTokenHash = null;
                let rawGuestToken;
                if (context.owner.ownerType === 'guest') {
                    const guestAuth = (0, order_utils_1.generateGuestAccessToken)();
                    rawGuestToken = guestAuth.rawToken;
                    guestTokenHash = guestAuth.tokenHash;
                }
                const reference = (0, order_utils_1.generateOrderReference)();
                const idempotencyFingerprint = (0, order_utils_1.calculateIdempotencyFingerprint)(input);
                const paymentId = new mongoose_1.Types.ObjectId();
                const isCod = input.paymentMethodKey.toLowerCase() === 'cod';
                const methodSnapshot = (0, payment_methods_config_1.getPaymentMethodSnapshot)(input.paymentMethodKey) ?? {
                    key: input.paymentMethodKey,
                    name: { ar: input.paymentMethodKey, en: input.paymentMethodKey },
                    type: isCod ? 'cash_on_delivery' : 'manual_transfer',
                    proofRequired: !isCod,
                };
                // Create Order document
                const order = await this.orderRepo.create({
                    reference,
                    customerId: context.owner.ownerType === 'user' ? new mongoose_1.Types.ObjectId(context.owner.userId) : null,
                    guestAccessTokenHash: guestTokenHash,
                    paymentId,
                    customerSnapshot: {
                        name: input.contact.name.trim(),
                        phone: input.contact.phone.trim(),
                        email: input.contact.email ? input.contact.email.trim().toLowerCase() : null,
                    },
                    items: orderItems,
                    totals: {
                        productSubtotalMinor,
                        shippingEstimateMinor: shippingCostMinor,
                        shippingFinalMinor: null,
                        discountMinor,
                        totalMinor,
                        currency: 'EGP',
                    },
                    fulfillment: {
                        method: input.fulfillment.method,
                        addressSnapshot: input.fulfillment.address
                            ? {
                                governorate: input.fulfillment.address.governorate.trim(),
                                city: input.fulfillment.address.city.trim(),
                                area: input.fulfillment.address.area?.trim() || null,
                                street: input.fulfillment.address.street.trim(),
                                building: input.fulfillment.address.building?.trim() || null,
                                apartment: input.fulfillment.address.apartment?.trim() || null,
                                landmark: input.fulfillment.address.landmark?.trim() || null,
                            }
                            : null,
                        provider: null,
                        shippingStatus: 'pending',
                        estimateSource: shippingEstimate.scope || null,
                        finalCostConfirmedAt: null,
                    },
                    paymentMethodKey: input.paymentMethodKey,
                    status: 'pending_review',
                    paymentStatus: 'not_submitted',
                    statusHistory: [
                        {
                            fromStatus: 'pending_review',
                            toStatus: 'pending_review',
                            actorRole: context.owner.ownerType,
                            reason: 'Order submitted by customer',
                            timestamp: new Date(),
                        },
                    ],
                    couponSnapshot: couponSnapshotData,
                    submittedAt: new Date(),
                    idempotencyKey: input.idempotencyKey,
                    idempotencyOwner: incomingOwnerKey,
                    idempotencyFingerprint,
                    version: 1,
                }, ctx);
                // Create linked payment document
                await this.paymentRepo.create({
                    _id: paymentId,
                    ownerType: 'order',
                    ownerId: order._id,
                    customerId: order.customerId ?? null,
                    methodKey: input.paymentMethodKey,
                    methodSnapshot,
                    amountDueMinor: totalMinor,
                    currency: 'EGP',
                    status: 'not_submitted',
                    proofRequired: !isCod,
                    proofSubmissionCount: 0,
                    confirmedAt: null,
                    rejectedAt: null,
                    version: 1,
                }, ctx);
                // Atomic coupon redemption inside the transaction (after order is created)
                if (validatedCouponId && couponSnapshotData) {
                    const customerId = context.owner.ownerType === 'user'
                        ? new mongoose_1.Types.ObjectId(context.owner.userId)
                        : null;
                    try {
                        await this.couponSvc.redeemCoupon(validatedCouponId, order._id, customerId, discountMinor, session);
                    }
                    catch (err) {
                        // Handle duplicate-key (11000) as idempotent — same order already redeemed this coupon
                        const mongoErr = err;
                        if (mongoErr?.code !== 11000) {
                            throw err;
                        }
                    }
                    // Persist coupon_used outbox event for downstream processing (Phase 14 worker)
                    await this.outbox.record({
                        eventType: 'coupon_used',
                        aggregateType: 'Coupon',
                        aggregateId: validatedCouponId.toString(),
                        payload: {
                            couponId: validatedCouponId.toString(),
                            code: couponSnapshotData.code,
                            orderId: order._id.toString(),
                            orderReference: order.reference,
                            discountMinor,
                            customerId: context.owner.ownerType === 'user' ? context.owner.userId : null,
                        },
                        dedupeKey: `coupon_used:${validatedCouponId.toString()}:${order._id.toString()}`,
                    }, session);
                }
                // Clear & version cart after successful order creation
                await this.cartRepo.updateWithVersion(cart._id, cart.version, {
                    $set: { items: [] },
                    $inc: { version: 1 },
                }, undefined, session);
                // Audit Record
                await this.audit.record({
                    actorId: context.owner.ownerType === 'user' ? context.owner.userId : undefined,
                    actorRole: context.owner.ownerType,
                    action: 'order.created',
                    entityType: 'Order',
                    entityId: order.reference,
                    newState: {
                        reference: order.reference,
                        totalMinor: order.totals.totalMinor,
                        itemsCount: order.items.length,
                    },
                    requestId: context.requestId,
                    ipHash: context.ipHash,
                });
                return { order, rawGuestToken };
            });
        }
        catch (err) {
            const mongoErr = err;
            const appErr = err;
            if ((mongoErr?.code === 11000 && mongoErr?.keyPattern?.idempotencyKey) ||
                appErr?.code === errorCodes_1.ErrorCodes.CART_EMPTY) {
                const recheck = await this.orderRepo.findByIdempotencyKey(input.idempotencyKey);
                if (recheck) {
                    if (recheck.idempotencyFingerprint !== incomingFingerprint) {
                        throw new errors_1.ConflictError(errorCodes_1.ErrorCodes.IDEMPOTENCY_KEY_REUSED, 'Idempotency key was already used with a different request payload');
                    }
                    if (recheck.idempotencyOwner && recheck.idempotencyOwner !== incomingOwnerKey) {
                        throw new errors_1.ConflictError(errorCodes_1.ErrorCodes.IDEMPOTENCY_KEY_REUSED, 'Idempotency key belongs to another user or session');
                    }
                    return { order: recheck };
                }
            }
            throw err;
        }
    }
    /**
     * Retrieves order by reference with strict ownership validation:
     * - Registered customer owns the order (or Admin)
     * - Guest presents valid guest access token (or Admin)
     */
    async getOrderByReference(reference, access) {
        const order = await this.orderRepo.findByReference(reference);
        if (!order) {
            throw new errors_1.NotFoundError(`Order not found: ${reference}`, errorCodes_1.ErrorCodes.ORDER_NOT_FOUND);
        }
        // Admin / Store Owner bypass
        if (access.role === 'admin' || access.role === 'owner') {
            return order;
        }
        // Registered Customer
        if (access.userId) {
            if (order.customerId?.toString() === access.userId) {
                return order;
            }
            throw new errors_1.ForbiddenError('You do not have permission to view this order');
        }
        // Guest Token Access
        if (access.guestToken) {
            const hashed = (0, order_utils_1.hashGuestToken)(access.guestToken);
            if (order.guestAccessTokenHash === hashed) {
                return order;
            }
            throw new errors_1.ForbiddenError('Invalid guest order access token');
        }
        throw new errors_1.ForbiddenError('Authentication or guest access token required to view this order');
    }
    /**
     * Customer edits an order in pending_review.
     */
    async updatePendingOrder(reference, input, access) {
        const order = await this.getOrderByReference(reference, access);
        if (order.status !== 'pending_review') {
            throw new errors_1.BusinessRuleViolationError(errorCodes_1.ErrorCodes.ORDER_STATE_CONFLICT, 'Only orders in pending_review status can be edited by customer');
        }
        const updateQuery = {
            $inc: { version: 1 },
        };
        if (input.contact) {
            if (input.contact.name)
                updateQuery['customerSnapshot.name'] = input.contact.name.trim();
            if (input.contact.phone)
                updateQuery['customerSnapshot.phone'] = input.contact.phone.trim();
            if (input.contact.email !== undefined) {
                updateQuery['customerSnapshot.email'] = input.contact.email ? input.contact.email.trim().toLowerCase() : null;
            }
        }
        let calculatedSubtotal = order.totals.productSubtotalMinor;
        // Handle items update if customer modifies lines while in pending_review
        if (input.items && input.items.length > 0) {
            let productSubtotalMinor = 0;
            const orderItems = [];
            for (const itemInput of input.items) {
                const product = await this.productRepo.findById(itemInput.productId);
                if (!product || !product.isPublished) {
                    throw new errors_1.BusinessRuleViolationError(errorCodes_1.ErrorCodes.AVAILABILITY_CHANGED, `Product is no longer available: ${itemInput.productId}`);
                }
                let currentPriceMinor = 0;
                let currentAvailability = '';
                let stockItemKey = product._id.toString();
                let selectedAttributes = {};
                if (product.hasVariants) {
                    if (!itemInput.variantId) {
                        throw new errors_1.ValidationError('Variant ID is required for product with variants');
                    }
                    const variant = product.variants.find((v) => v.variantId === itemInput.variantId);
                    if (!variant || variant.availability === 'out_of_stock') {
                        throw new errors_1.BusinessRuleViolationError(errorCodes_1.ErrorCodes.AVAILABILITY_CHANGED, `Product variant is no longer available`);
                    }
                    currentPriceMinor = variant.priceMinor;
                    currentAvailability = variant.availability;
                    stockItemKey = `${product._id.toString()}:${variant.variantId}`;
                    selectedAttributes =
                        variant.attributes instanceof Map
                            ? Object.fromEntries(variant.attributes)
                            : variant.attributes || {};
                }
                else {
                    if (product.availability === 'out_of_stock') {
                        throw new errors_1.BusinessRuleViolationError(errorCodes_1.ErrorCodes.AVAILABILITY_CHANGED, `Product is out of stock: ${product.name.ar}`);
                    }
                    currentPriceMinor = product.priceMinor;
                    currentAvailability = product.availability;
                }
                const lineTotalMinor = currentPriceMinor * itemInput.quantity;
                productSubtotalMinor += lineTotalMinor;
                orderItems.push({
                    productId: product._id,
                    variantId: itemInput.variantId ?? null,
                    nameSnapshot: {
                        ar: product.name.ar,
                        en: product.name.en ?? null,
                    },
                    imageSnapshot: (product.images && product.images[0]?.publicId) ?? null,
                    categorySnapshot: product.categoryId.toString(),
                    attributesSnapshot: selectedAttributes,
                    quantity: itemInput.quantity,
                    unitPriceMinor: currentPriceMinor,
                    lineTotalMinor,
                    availabilityAtSubmission: currentAvailability,
                    stockItemKey,
                });
            }
            calculatedSubtotal = productSubtotalMinor;
            updateQuery['items'] = orderItems;
            updateQuery['totals.productSubtotalMinor'] = calculatedSubtotal;
        }
        // Handle fulfillment update
        let currentShippingEstimate = order.totals.shippingEstimateMinor;
        if (input.fulfillment) {
            const targetMethod = input.fulfillment.method || order.fulfillment.method;
            const targetAddress = input.fulfillment.address !== undefined
                ? input.fulfillment.address
                : order.fulfillment.addressSnapshot;
            if (targetMethod === 'delivery' && !targetAddress) {
                throw new errors_1.ValidationError('Delivery address is required for delivery fulfillment');
            }
            const shippingEstimate = await this.shipService.estimateShipping({
                method: targetMethod,
                governorate: targetAddress?.governorate,
                city: targetAddress?.city,
                area: targetAddress?.area ?? undefined,
            });
            if (!shippingEstimate.serviceable) {
                throw new errors_1.BusinessRuleViolationError(errorCodes_1.ErrorCodes.SHIPPING_CONFIGURATION_UNAVAILABLE, 'Shipping destination is not serviceable');
            }
            currentShippingEstimate = shippingEstimate.costMinor;
            updateQuery['fulfillment.method'] = targetMethod;
            updateQuery['fulfillment.addressSnapshot'] = targetAddress
                ? {
                    governorate: targetAddress.governorate.trim(),
                    city: targetAddress.city.trim(),
                    area: targetAddress.area?.trim() || null,
                    street: targetAddress.street.trim(),
                    building: targetAddress.building?.trim() || null,
                    apartment: targetAddress.apartment?.trim() || null,
                    landmark: targetAddress.landmark?.trim() || null,
                }
                : null;
            updateQuery['fulfillment.estimateSource'] = shippingEstimate.scope || null;
            updateQuery['totals.shippingEstimateMinor'] = currentShippingEstimate;
        }
        if (input.items || input.fulfillment) {
            updateQuery['totals.totalMinor'] =
                calculatedSubtotal + currentShippingEstimate - (order.totals.discountMinor || 0);
        }
        const updated = await this.orderRepo.updateWithVersion(reference, input.expectedVersion, updateQuery);
        if (!updated) {
            throw new errors_1.ConflictError(errorCodes_1.ErrorCodes.ORDER_VERSION_CONFLICT, `Order version conflict: expected version ${input.expectedVersion}`);
        }
        await this.audit.record({
            actorId: access.userId,
            actorRole: access.userId ? 'customer' : 'guest',
            action: 'order.updated',
            entityType: 'Order',
            entityId: reference,
            previousState: { version: input.expectedVersion },
            newState: { version: input.expectedVersion + 1 },
        });
        return updated;
    }
    /**
     * Customer cancels an order in pending_review.
     * Since order creation does not reserve stock, no inventory release is needed.
     */
    async cancelOrder(reference, expectedVersion, access, reason) {
        const order = await this.getOrderByReference(reference, access);
        (0, order_state_machine_1.validateOrderTransition)(order.status, 'cancelled');
        return (0, transaction_1.withTransaction)(async (session) => {
            const ctx = { session };
            const updated = await this.orderRepo.updateWithVersion(reference, expectedVersion, {
                $set: {
                    status: 'cancelled',
                    cancelledAt: new Date(),
                },
                $push: {
                    statusHistory: {
                        fromStatus: order.status,
                        toStatus: 'cancelled',
                        actorRole: access.userId ? 'customer' : 'guest',
                        reason: reason || 'Cancelled by customer',
                        timestamp: new Date(),
                    },
                },
                $inc: { version: 1 },
            }, ctx);
            if (!updated) {
                throw new errors_1.ConflictError(errorCodes_1.ErrorCodes.ORDER_VERSION_CONFLICT, `Order version conflict: expected version ${expectedVersion}`);
            }
            await this.audit.record({
                actorId: access.userId,
                actorRole: access.userId ? 'customer' : 'guest',
                action: 'order.cancelled',
                entityType: 'Order',
                entityId: reference,
                previousState: { status: order.status, version: expectedVersion },
                newState: { status: 'cancelled', version: expectedVersion + 1 },
            });
            return updated;
        });
    }
    /**
     * Admin accepts order.
     * Multi-document transaction:
     * 1. Validates transition pending_review -> accepted.
     * 2. Atomically reserves all physical inventory lines using Phase 7 inventory service.
     * 3. Transitions order status to 'accepted'.
     * 4. Updates payment status / sets next state (awaiting_payment or customer_confirmation_required).
     */
    async adminAcceptOrder(reference, expectedVersion, admin) {
        return (0, transaction_1.withTransaction)(async (session) => {
            const ctx = { session };
            const order = await this.orderRepo.findByReference(reference, ctx);
            if (!order) {
                throw new errors_1.NotFoundError(`Order not found: ${reference}`, errorCodes_1.ErrorCodes.ORDER_NOT_FOUND);
            }
            (0, order_state_machine_1.validateOrderTransition)(order.status, 'accepted');
            if (order.version !== expectedVersion) {
                throw new errors_1.ConflictError(errorCodes_1.ErrorCodes.ORDER_VERSION_CONFLICT, `Order version conflict: expected ${expectedVersion}, current ${order.version}`);
            }
            // Map order items to Inventory Line Items
            const reservationLines = order.items.map((item, idx) => ({
                orderItemId: `${order._id.toString()}_${idx}`,
                productId: item.productId.toString(),
                variantId: item.variantId ?? null,
                quantity: item.quantity,
            }));
            // 1. Atomically reserve all lines via Phase 7 InventoryService
            await this.invService.reserveOrderStock(order._id.toString(), reservationLines, { id: admin.id, role: admin.role }, { session });
            // Determine next state based on payment method
            const isCod = order.paymentMethodKey.toLowerCase() === 'cod';
            const targetStatus = isCod ? 'customer_confirmation_required' : 'awaiting_payment';
            // 2. Transition order
            const updated = await this.orderRepo.updateWithVersion(reference, expectedVersion, {
                $set: {
                    status: targetStatus,
                    acceptedAt: new Date(),
                },
                $push: {
                    statusHistory: [
                        {
                            fromStatus: order.status,
                            toStatus: 'accepted',
                            actorId: new mongoose_1.Types.ObjectId(admin.id),
                            actorRole: admin.role,
                            reason: 'Order accepted by administrator',
                            timestamp: new Date(),
                        },
                        {
                            fromStatus: 'accepted',
                            toStatus: targetStatus,
                            actorId: new mongoose_1.Types.ObjectId(admin.id),
                            actorRole: admin.role,
                            reason: isCod ? 'COD confirmation required' : 'Awaiting digital payment proof',
                            timestamp: new Date(),
                        },
                    ],
                },
                $inc: { version: 1 },
            }, ctx);
            if (!updated) {
                throw new errors_1.ConflictError(errorCodes_1.ErrorCodes.ORDER_VERSION_CONFLICT, 'Order version conflict during acceptance');
            }
            // Audit Record
            await this.audit.record({
                actorId: admin.id,
                actorRole: admin.role,
                action: 'order.accepted',
                entityType: 'Order',
                entityId: reference,
                previousState: { status: order.status, version: expectedVersion },
                newState: { status: targetStatus, version: expectedVersion + 1 },
            });
            return updated;
        });
    }
    /**
     * Admin rejects order.
     * Multi-document transaction:
     * 1. Validates transition.
     * 2. Defensively releases any existing reservations via Phase 7.
     * 3. Transitions status to 'rejected'.
     */
    async adminRejectOrder(reference, expectedVersion, reason, admin) {
        return (0, transaction_1.withTransaction)(async (session) => {
            const ctx = { session };
            const order = await this.orderRepo.findByReference(reference, ctx);
            if (!order) {
                throw new errors_1.NotFoundError(`Order not found: ${reference}`, errorCodes_1.ErrorCodes.ORDER_NOT_FOUND);
            }
            (0, order_state_machine_1.validateOrderTransition)(order.status, 'rejected');
            // Defensively release any reservations
            await this.invService.releaseOrderReservations(order._id.toString(), `Order rejected: ${reason}`, { id: admin.id, role: admin.role }, { session });
            const updated = await this.orderRepo.updateWithVersion(reference, expectedVersion, {
                $set: { status: 'rejected' },
                $push: {
                    statusHistory: {
                        fromStatus: order.status,
                        toStatus: 'rejected',
                        actorId: new mongoose_1.Types.ObjectId(admin.id),
                        actorRole: admin.role,
                        reason,
                        timestamp: new Date(),
                    },
                },
                $inc: { version: 1 },
            }, ctx);
            if (!updated) {
                throw new errors_1.ConflictError(errorCodes_1.ErrorCodes.ORDER_VERSION_CONFLICT, 'Order version conflict during rejection');
            }
            await this.audit.record({
                actorId: admin.id,
                actorRole: admin.role,
                action: 'order.rejected',
                entityType: 'Order',
                entityId: reference,
                previousState: { status: order.status, version: expectedVersion },
                newState: { status: 'rejected', version: expectedVersion + 1 },
                metadata: { reason },
            });
            return updated;
        });
    }
    /**
     * Admin updates operational order status (fulfilling transitions like preparing, shipped, delivered, etc.).
     */
    async adminUpdateOrderStatus(reference, targetStatus, expectedVersion, admin, reason) {
        return (0, transaction_1.withTransaction)(async (session) => {
            const ctx = { session };
            const order = await this.orderRepo.findByReference(reference, ctx);
            if (!order) {
                throw new errors_1.NotFoundError(`Order not found: ${reference}`, errorCodes_1.ErrorCodes.ORDER_NOT_FOUND);
            }
            (0, order_state_machine_1.validateOrderTransition)(order.status, targetStatus);
            // If transition reaches Delivered or Picked Up, trigger final stock deduction via Phase 7
            if (targetStatus === 'delivered' || targetStatus === 'picked_up') {
                await this.invService.deductOrderReservations(order._id.toString(), { id: admin.id, role: admin.role }, { session });
            }
            const isShippingStatus = [
                'pending',
                'preparing',
                'ready_for_pickup',
                'picked_up',
                'shipped',
                'out_for_delivery',
                'delivered',
                'completed',
            ].includes(targetStatus);
            const updateQuery = {
                $set: {
                    status: targetStatus,
                    ...(targetStatus === 'completed' ? { completedAt: new Date() } : {}),
                    ...(isShippingStatus ? { 'fulfillment.shippingStatus': targetStatus } : {}),
                },
                $push: {
                    statusHistory: {
                        fromStatus: order.status,
                        toStatus: targetStatus,
                        actorId: new mongoose_1.Types.ObjectId(admin.id),
                        actorRole: admin.role,
                        reason: reason || `Status updated to ${targetStatus}`,
                        timestamp: new Date(),
                    },
                },
                $inc: { version: 1 },
            };
            const updated = await this.orderRepo.updateWithVersion(reference, expectedVersion, updateQuery, ctx);
            if (!updated) {
                throw new errors_1.ConflictError(errorCodes_1.ErrorCodes.ORDER_VERSION_CONFLICT, 'Order version conflict during status update');
            }
            await this.audit.record({
                actorId: admin.id,
                actorRole: admin.role,
                action: 'order.status_updated',
                entityType: 'Order',
                entityId: reference,
                previousState: { status: order.status, version: expectedVersion },
                newState: { status: targetStatus, version: expectedVersion + 1 },
            });
            return updated;
        });
    }
    /**
     * Customer confirms COD order.
     * Allowed only from 'customer_confirmation_required' status.
     */
    async confirmCodOrder(reference, expectedVersion, access) {
        const order = await this.getOrderByReference(reference, access);
        if (order.status !== 'customer_confirmation_required') {
            throw new errors_1.BusinessRuleViolationError(errorCodes_1.ErrorCodes.ORDER_STATE_CONFLICT, `Order is in "${order.status}" status, not awaiting customer confirmation`);
        }
        (0, order_state_machine_1.validateOrderTransition)(order.status, 'confirmed');
        return (0, transaction_1.withTransaction)(async (session) => {
            const ctx = { session };
            const updated = await this.orderRepo.updateWithVersion(reference, expectedVersion, {
                $set: { status: 'confirmed' },
                $push: {
                    statusHistory: {
                        fromStatus: order.status,
                        toStatus: 'confirmed',
                        actorRole: access.userId ? 'customer' : 'guest',
                        reason: 'Customer confirmed COD order',
                        timestamp: new Date(),
                    },
                },
                $inc: { version: 1 },
            }, ctx);
            if (!updated) {
                throw new errors_1.ConflictError(errorCodes_1.ErrorCodes.ORDER_VERSION_CONFLICT, `Order version conflict: expected version ${expectedVersion}`);
            }
            await this.audit.record({
                actorId: access.userId,
                actorRole: access.userId ? 'customer' : 'guest',
                action: 'order.cod_confirmed',
                entityType: 'Order',
                entityId: reference,
                previousState: { status: order.status, version: expectedVersion },
                newState: { status: 'confirmed', version: expectedVersion + 1 },
            });
            return updated;
        });
    }
    /**
     * Admin updates shipping carrier and records final shipping cost.
     */
    async adminUpdateShipping(reference, input, admin) {
        return (0, transaction_1.withTransaction)(async (session) => {
            const ctx = { session };
            const order = await this.orderRepo.findByReference(reference, ctx);
            if (!order) {
                throw new errors_1.NotFoundError(`Order not found: ${reference}`, errorCodes_1.ErrorCodes.ORDER_NOT_FOUND);
            }
            if (order.version !== input.expectedVersion) {
                throw new errors_1.ConflictError(errorCodes_1.ErrorCodes.ORDER_VERSION_CONFLICT, `Order version conflict: expected ${input.expectedVersion}, current ${order.version}`);
            }
            const totalMinor = order.totals.productSubtotalMinor + input.finalCostMinor - (order.totals.discountMinor || 0);
            const updated = await this.orderRepo.updateWithVersion(reference, input.expectedVersion, {
                $set: {
                    'fulfillment.provider': input.provider.trim(),
                    'fulfillment.finalCostConfirmedAt': new Date(),
                    'totals.shippingFinalMinor': input.finalCostMinor,
                    'totals.totalMinor': totalMinor,
                },
                $push: {
                    statusHistory: {
                        fromStatus: order.status,
                        toStatus: order.status,
                        actorId: new mongoose_1.Types.ObjectId(admin.id),
                        actorRole: admin.role,
                        reason: input.reason || `Shipping carrier ${input.provider} and final cost updated`,
                        timestamp: new Date(),
                    },
                },
                $inc: { version: 1 },
            }, ctx);
            if (!updated) {
                throw new errors_1.ConflictError(errorCodes_1.ErrorCodes.ORDER_VERSION_CONFLICT, 'Order version conflict while updating shipping');
            }
            await this.audit.record({
                actorId: admin.id,
                actorRole: admin.role,
                action: 'order.shipping_updated',
                entityType: 'Order',
                entityId: reference,
                previousState: { version: input.expectedVersion },
                newState: {
                    provider: input.provider,
                    shippingFinalMinor: input.finalCostMinor,
                    version: input.expectedVersion + 1,
                },
                metadata: { reason: input.reason },
            });
            return updated;
        });
    }
}
exports.OrderService = OrderService;
exports.orderService = new OrderService();
//# sourceMappingURL=order.service.js.map