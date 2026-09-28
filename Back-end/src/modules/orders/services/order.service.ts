import { Types, ClientSession } from 'mongoose';
import { orderRepository, OrderRepository } from '../repositories/order.repository';
import {
  CreateOrderInput,
  IOrderDocument,
  IOrderItem,
  OrderStatus,
  UpdatePendingOrderInput,
} from '../types/order.types';
import { cartRepository, CartRepository } from '../../carts/repositories/cart.repository';
import { CartOwnerContext } from '../../carts/types/cart.types';
import { productRepository, ProductRepository } from '../../products/repositories/product.repository';
import { shippingService, ShippingService } from '../../shipping/services/shipping.service';
import { inventoryService, InventoryService } from '../../inventory/services/inventory.service';
import { auditService, AuditService } from '../../audit/services/audit.service';
import { withTransaction } from '../../../database/transaction';
import {
  generateOrderReference,
  generateGuestAccessToken,
  hashGuestToken,
  calculateIdempotencyFingerprint,
} from '../utils/order.utils';
import { validateOrderTransition } from '../utils/order-state-machine';
import {
  NotFoundError,
  ConflictError,
  ValidationError,
  ForbiddenError,
  BusinessRuleViolationError,
} from '../../../common/errors';
import { ErrorCodes } from '../../../common/errors/errorCodes';
import { RepositoryContext } from '../../../common/types';

export interface CheckoutContext {
  owner: CartOwnerContext;
  requestId?: string;
  ipHash?: string;
}

export class OrderService {
  constructor(
    private readonly orderRepo: OrderRepository = orderRepository,
    private readonly cartRepo: CartRepository = cartRepository,
    private readonly productRepo: ProductRepository = productRepository,
    private readonly shipService: ShippingService = shippingService,
    private readonly invService: InventoryService = inventoryService,
    private readonly audit: AuditService = auditService,
  ) {}

  /**
   * Authoritative Order Creation from Cart (Checkout).
   * Transactional, idempotent, with strict catalog revalidation.
   * NOTE: Order creation does NOT reserve inventory!
   */
  async createOrder(
    input: CreateOrderInput,
    context: CheckoutContext,
  ): Promise<{ order: IOrderDocument; rawGuestToken?: string }> {
    const incomingOwnerKey =
      context.owner.ownerType === 'user'
        ? `user:${context.owner.userId}`
        : `guest:${context.owner.sessionId}`;
    const incomingFingerprint = calculateIdempotencyFingerprint(input);

    // 1. Idempotency Check (Owner-scoped)
    const existingOrder = await this.orderRepo.findByIdempotencyKey(input.idempotencyKey);
    if (existingOrder) {
      if (existingOrder.idempotencyFingerprint !== incomingFingerprint) {
        throw new ConflictError(
          ErrorCodes.IDEMPOTENCY_KEY_REUSED,
          'Idempotency key was already used with a different request payload',
        );
      }

      if (existingOrder.idempotencyOwner && existingOrder.idempotencyOwner !== incomingOwnerKey) {
        throw new ConflictError(
          ErrorCodes.IDEMPOTENCY_KEY_REUSED,
          'Idempotency key was already used by another owner',
        );
      }

      // Verify owner match
      if (context.owner.ownerType === 'user') {
        if (existingOrder.customerId?.toString() !== context.owner.userId) {
          throw new ConflictError(
            ErrorCodes.IDEMPOTENCY_KEY_REUSED,
            'Idempotency key belongs to another user',
          );
        }
      } else {
        if (existingOrder.customerId) {
          throw new ConflictError(
            ErrorCodes.IDEMPOTENCY_KEY_REUSED,
            'Idempotency key belongs to another user',
          );
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
      throw new BusinessRuleViolationError(
        ErrorCodes.PAYMENT_METHOD_UNAVAILABLE,
        `Payment method "${input.paymentMethodKey}" is unavailable or not supported`,
      );
    }

    // 3. Multi-document Transaction with concurrency handling
    try {
      return await withTransaction(async (session: ClientSession) => {
        const ctx: RepositoryContext = { session, requestId: context.requestId };

        // Check if concurrent request already created order with this key
        const concurrentOrder = await this.orderRepo.findByIdempotencyKey(input.idempotencyKey, ctx);
        if (concurrentOrder) {
          if (concurrentOrder.idempotencyFingerprint !== incomingFingerprint) {
            throw new ConflictError(
              ErrorCodes.IDEMPOTENCY_KEY_REUSED,
              'Idempotency key was already used with a different request payload',
            );
          }
          if (concurrentOrder.idempotencyOwner && concurrentOrder.idempotencyOwner !== incomingOwnerKey) {
            throw new ConflictError(
              ErrorCodes.IDEMPOTENCY_KEY_REUSED,
              'Idempotency key belongs to another user or session',
            );
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
              throw new ConflictError(
                ErrorCodes.IDEMPOTENCY_KEY_REUSED,
                'Idempotency key was already used with a different request payload',
              );
            }
            if (orderRecheck.idempotencyOwner && orderRecheck.idempotencyOwner !== incomingOwnerKey) {
              throw new ConflictError(
                ErrorCodes.IDEMPOTENCY_KEY_REUSED,
                'Idempotency key belongs to another user or session',
              );
            }
            return { order: orderRecheck };
          }

          throw new BusinessRuleViolationError(
            ErrorCodes.CART_EMPTY,
            'Cannot checkout with an empty or non-existent cart',
          );
        }

        // Re-read current catalog values & revalidate price/availability
        let productSubtotalMinor = 0;
        const orderItems: IOrderItem[] = [];

        for (const cartItem of cart.items) {
          const product = await this.productRepo.findById(cartItem.productId, session);
          if (!product || !product.isPublished) {
            throw new BusinessRuleViolationError(
              ErrorCodes.AVAILABILITY_CHANGED,
              `Product is no longer available: ${cartItem.productNameSnapshot.ar}`,
            );
          }

          let currentPriceMinor = 0;
          let currentAvailability = '';
          let stockItemKey = product._id.toString();
          let selectedAttributes: Record<string, string> = {};

          if (product.hasVariants) {
            if (!cartItem.variantId) {
              throw new ValidationError('Variant ID is required for product with variants');
            }
            const variant = product.variants.find((v) => v.variantId === cartItem.variantId);
            if (!variant || variant.availability === 'out_of_stock') {
              throw new BusinessRuleViolationError(
                ErrorCodes.AVAILABILITY_CHANGED,
                `Product variant is no longer available: ${cartItem.productNameSnapshot.ar}`,
              );
            }
            currentPriceMinor = variant.priceMinor;
            currentAvailability = variant.availability;
            stockItemKey = `${product._id.toString()}:${variant.variantId}`;
            selectedAttributes =
              variant.attributes instanceof Map
                ? Object.fromEntries(variant.attributes)
                : (variant.attributes as Record<string, string>) || {};
          } else {
            if (product.availability === 'out_of_stock') {
              throw new BusinessRuleViolationError(
                ErrorCodes.AVAILABILITY_CHANGED,
                `Product is out of stock: ${product.name.ar}`,
              );
            }
            currentPriceMinor = product.priceMinor;
            currentAvailability = product.availability;
          }

        // PRICE_CHANGED Check
        if (currentPriceMinor !== cartItem.unitPriceMinor) {
          throw new ConflictError(
            ErrorCodes.PRICE_CHANGED,
            `Price changed for item "${cartItem.productNameSnapshot.ar}". Please refresh your cart.`,
          );
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
        throw new BusinessRuleViolationError(
          ErrorCodes.SHIPPING_CONFIGURATION_UNAVAILABLE,
          'Shipping destination is not serviceable',
        );
      }

      const shippingCostMinor = shippingEstimate.costMinor;
      const discountMinor = 0; // Coupon calculation handled when active coupon passed
      const totalMinor = productSubtotalMinor + shippingCostMinor - discountMinor;

      // Guest Token Generation
      let guestTokenHash: string | null = null;
      let rawGuestToken: string | undefined;

      if (context.owner.ownerType === 'guest') {
        const guestAuth = generateGuestAccessToken();
        rawGuestToken = guestAuth.rawToken;
        guestTokenHash = guestAuth.tokenHash;
      }

      const reference = generateOrderReference();
      const idempotencyFingerprint = calculateIdempotencyFingerprint(input);

      // Create Order document
      const order = await this.orderRepo.create(
        {
          reference,
          customerId:
            context.owner.ownerType === 'user' ? new Types.ObjectId(context.owner.userId) : null,
          guestAccessTokenHash: guestTokenHash,
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
          couponSnapshot: null,
          submittedAt: new Date(),
          idempotencyKey: input.idempotencyKey,
          idempotencyOwner: incomingOwnerKey,
          idempotencyFingerprint,
          version: 1,
        },
        ctx,
      );

      // Clear & version cart after successful order creation
      await this.cartRepo.updateWithVersion(
        cart._id,
        cart.version,
        {
          $set: { items: [] },
          $inc: { version: 1 },
        },
        undefined,
        session,
      );

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
  } catch (err: unknown) {
    const mongoErr = err as { code?: number; keyPattern?: Record<string, number> };
    const appErr = err as { code?: string };
    if (
      (mongoErr?.code === 11000 && mongoErr?.keyPattern?.idempotencyKey) ||
      appErr?.code === ErrorCodes.CART_EMPTY
    ) {
      const recheck = await this.orderRepo.findByIdempotencyKey(input.idempotencyKey);
      if (recheck) {
        if (recheck.idempotencyFingerprint !== incomingFingerprint) {
          throw new ConflictError(
            ErrorCodes.IDEMPOTENCY_KEY_REUSED,
            'Idempotency key was already used with a different request payload',
          );
        }
        if (recheck.idempotencyOwner && recheck.idempotencyOwner !== incomingOwnerKey) {
          throw new ConflictError(
            ErrorCodes.IDEMPOTENCY_KEY_REUSED,
            'Idempotency key belongs to another user or session',
          );
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
  async getOrderByReference(
    reference: string,
    access: {
      userId?: string;
      role?: string;
      guestToken?: string;
    },
  ): Promise<IOrderDocument> {
    const order = await this.orderRepo.findByReference(reference);
    if (!order) {
      throw new NotFoundError(`Order not found: ${reference}`, ErrorCodes.ORDER_NOT_FOUND);
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
      throw new ForbiddenError('You do not have permission to view this order');
    }

    // Guest Token Access
    if (access.guestToken) {
      const hashed = hashGuestToken(access.guestToken);
      if (order.guestAccessTokenHash === hashed) {
        return order;
      }
      throw new ForbiddenError('Invalid guest order access token');
    }

    throw new ForbiddenError('Authentication or guest access token required to view this order');
  }

  /**
   * Customer edits an order in pending_review.
   */
  async updatePendingOrder(
    reference: string,
    input: UpdatePendingOrderInput,
    access: { userId?: string; guestToken?: string },
  ): Promise<IOrderDocument> {
    const order = await this.getOrderByReference(reference, access);

    if (order.status !== 'pending_review') {
      throw new BusinessRuleViolationError(
        ErrorCodes.ORDER_STATE_CONFLICT,
        'Only orders in pending_review status can be edited by customer',
      );
    }

    const updateQuery: Record<string, unknown> = {
      $inc: { version: 1 },
    };

    if (input.contact) {
      if (input.contact.name) updateQuery['customerSnapshot.name'] = input.contact.name.trim();
      if (input.contact.phone) updateQuery['customerSnapshot.phone'] = input.contact.phone.trim();
      if (input.contact.email !== undefined) {
        updateQuery['customerSnapshot.email'] = input.contact.email ? input.contact.email.trim().toLowerCase() : null;
      }
    }

    let calculatedSubtotal = order.totals.productSubtotalMinor;

    // Handle items update if customer modifies lines while in pending_review
    if (input.items && input.items.length > 0) {
      let productSubtotalMinor = 0;
      const orderItems: IOrderItem[] = [];

      for (const itemInput of input.items) {
        const product = await this.productRepo.findById(itemInput.productId);
        if (!product || !product.isPublished) {
          throw new BusinessRuleViolationError(
            ErrorCodes.AVAILABILITY_CHANGED,
            `Product is no longer available: ${itemInput.productId}`,
          );
        }

        let currentPriceMinor = 0;
        let currentAvailability = '';
        let stockItemKey = product._id.toString();
        let selectedAttributes: Record<string, string> = {};

        if (product.hasVariants) {
          if (!itemInput.variantId) {
            throw new ValidationError('Variant ID is required for product with variants');
          }
          const variant = product.variants.find((v) => v.variantId === itemInput.variantId);
          if (!variant || variant.availability === 'out_of_stock') {
            throw new BusinessRuleViolationError(
              ErrorCodes.AVAILABILITY_CHANGED,
              `Product variant is no longer available`,
            );
          }
          currentPriceMinor = variant.priceMinor;
          currentAvailability = variant.availability;
          stockItemKey = `${product._id.toString()}:${variant.variantId}`;
          selectedAttributes =
            variant.attributes instanceof Map
              ? Object.fromEntries(variant.attributes)
              : (variant.attributes as Record<string, string>) || {};
        } else {
          if (product.availability === 'out_of_stock') {
            throw new BusinessRuleViolationError(
              ErrorCodes.AVAILABILITY_CHANGED,
              `Product is out of stock: ${product.name.ar}`,
            );
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
      const targetAddress =
        input.fulfillment.address !== undefined
          ? input.fulfillment.address
          : order.fulfillment.addressSnapshot;

      if (targetMethod === 'delivery' && !targetAddress) {
        throw new ValidationError('Delivery address is required for delivery fulfillment');
      }

      const shippingEstimate = await this.shipService.estimateShipping({
        method: targetMethod,
        governorate: targetAddress?.governorate,
        city: targetAddress?.city,
        area: targetAddress?.area ?? undefined,
      });

      if (!shippingEstimate.serviceable) {
        throw new BusinessRuleViolationError(
          ErrorCodes.SHIPPING_CONFIGURATION_UNAVAILABLE,
          'Shipping destination is not serviceable',
        );
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

    const updated = await this.orderRepo.updateWithVersion(
      reference,
      input.expectedVersion,
      updateQuery,
    );

    if (!updated) {
      throw new ConflictError(
        ErrorCodes.ORDER_VERSION_CONFLICT,
        `Order version conflict: expected version ${input.expectedVersion}`,
      );
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
  async cancelOrder(
    reference: string,
    expectedVersion: number,
    access: { userId?: string; guestToken?: string },
    reason?: string,
  ): Promise<IOrderDocument> {
    const order = await this.getOrderByReference(reference, access);

    validateOrderTransition(order.status, 'cancelled');

    return withTransaction(async (session: ClientSession) => {
      const ctx: RepositoryContext = { session };

      const updated = await this.orderRepo.updateWithVersion(
        reference,
        expectedVersion,
        {
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
        },
        ctx,
      );

      if (!updated) {
        throw new ConflictError(
          ErrorCodes.ORDER_VERSION_CONFLICT,
          `Order version conflict: expected version ${expectedVersion}`,
        );
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
  async adminAcceptOrder(
    reference: string,
    expectedVersion: number,
    admin: { id: string; role: string },
  ): Promise<IOrderDocument> {
    return withTransaction(async (session: ClientSession) => {
      const ctx: RepositoryContext = { session };
      const order = await this.orderRepo.findByReference(reference, ctx);
      if (!order) {
        throw new NotFoundError(`Order not found: ${reference}`, ErrorCodes.ORDER_NOT_FOUND);
      }

      validateOrderTransition(order.status, 'accepted');

      if (order.version !== expectedVersion) {
        throw new ConflictError(
          ErrorCodes.ORDER_VERSION_CONFLICT,
          `Order version conflict: expected ${expectedVersion}, current ${order.version}`,
        );
      }

      // Map order items to Inventory Line Items
      const reservationLines = order.items.map((item, idx) => ({
        orderItemId: `${order._id.toString()}_${idx}`,
        productId: item.productId.toString(),
        variantId: item.variantId ?? null,
        quantity: item.quantity,
      }));

      // 1. Atomically reserve all lines via Phase 7 InventoryService
      await this.invService.reserveOrderStock(
        order._id.toString(),
        reservationLines,
        { id: admin.id, role: admin.role },
        { session },
      );

      // Determine next state based on payment method
      const isCod = order.paymentMethodKey.toLowerCase() === 'cod';
      const targetStatus: OrderStatus = isCod ? 'customer_confirmation_required' : 'awaiting_payment';

      // 2. Transition order
      const updated = await this.orderRepo.updateWithVersion(
        reference,
        expectedVersion,
        {
          $set: {
            status: targetStatus,
            acceptedAt: new Date(),
          },
          $push: {
            statusHistory: [
              {
                fromStatus: order.status,
                toStatus: 'accepted',
                actorId: new Types.ObjectId(admin.id),
                actorRole: admin.role,
                reason: 'Order accepted by administrator',
                timestamp: new Date(),
              },
              {
                fromStatus: 'accepted',
                toStatus: targetStatus,
                actorId: new Types.ObjectId(admin.id),
                actorRole: admin.role,
                reason: isCod ? 'COD confirmation required' : 'Awaiting digital payment proof',
                timestamp: new Date(),
              },
            ],
          },
          $inc: { version: 1 },
        },
        ctx,
      );

      if (!updated) {
        throw new ConflictError(
          ErrorCodes.ORDER_VERSION_CONFLICT,
          'Order version conflict during acceptance',
        );
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
  async adminRejectOrder(
    reference: string,
    expectedVersion: number,
    reason: string,
    admin: { id: string; role: string },
  ): Promise<IOrderDocument> {
    return withTransaction(async (session: ClientSession) => {
      const ctx: RepositoryContext = { session };
      const order = await this.orderRepo.findByReference(reference, ctx);
      if (!order) {
        throw new NotFoundError(`Order not found: ${reference}`, ErrorCodes.ORDER_NOT_FOUND);
      }

      validateOrderTransition(order.status, 'rejected');

      // Defensively release any reservations
      await this.invService.releaseOrderReservations(
        order._id.toString(),
        `Order rejected: ${reason}`,
        { id: admin.id, role: admin.role },
        { session },
      );

      const updated = await this.orderRepo.updateWithVersion(
        reference,
        expectedVersion,
        {
          $set: { status: 'rejected' },
          $push: {
            statusHistory: {
              fromStatus: order.status,
              toStatus: 'rejected',
              actorId: new Types.ObjectId(admin.id),
              actorRole: admin.role,
              reason,
              timestamp: new Date(),
            },
          },
          $inc: { version: 1 },
        },
        ctx,
      );

      if (!updated) {
        throw new ConflictError(
          ErrorCodes.ORDER_VERSION_CONFLICT,
          'Order version conflict during rejection',
        );
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
  async adminUpdateOrderStatus(
    reference: string,
    targetStatus: OrderStatus,
    expectedVersion: number,
    admin: { id: string; role: string },
    reason?: string,
  ): Promise<IOrderDocument> {
    return withTransaction(async (session: ClientSession) => {
      const ctx: RepositoryContext = { session };
      const order = await this.orderRepo.findByReference(reference, ctx);
      if (!order) {
        throw new NotFoundError(`Order not found: ${reference}`, ErrorCodes.ORDER_NOT_FOUND);
      }

      validateOrderTransition(order.status, targetStatus);

      // If transition reaches Delivered or Picked Up, trigger final stock deduction via Phase 7
      if (targetStatus === 'delivered' || targetStatus === 'picked_up') {
        await this.invService.deductOrderReservations(
          order._id.toString(),
          { id: admin.id, role: admin.role },
          { session },
        );
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

      const updateQuery: Record<string, unknown> = {
        $set: {
          status: targetStatus,
          ...(targetStatus === 'completed' ? { completedAt: new Date() } : {}),
          ...(isShippingStatus ? { 'fulfillment.shippingStatus': targetStatus } : {}),
        },
        $push: {
          statusHistory: {
            fromStatus: order.status,
            toStatus: targetStatus,
            actorId: new Types.ObjectId(admin.id),
            actorRole: admin.role,
            reason: reason || `Status updated to ${targetStatus}`,
            timestamp: new Date(),
          },
        },
        $inc: { version: 1 },
      };

      const updated = await this.orderRepo.updateWithVersion(
        reference,
        expectedVersion,
        updateQuery,
        ctx,
      );

      if (!updated) {
        throw new ConflictError(
          ErrorCodes.ORDER_VERSION_CONFLICT,
          'Order version conflict during status update',
        );
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
  async confirmCodOrder(
    reference: string,
    expectedVersion: number,
    access: { userId?: string; guestToken?: string },
  ): Promise<IOrderDocument> {
    const order = await this.getOrderByReference(reference, access);

    if (order.status !== 'customer_confirmation_required') {
      throw new BusinessRuleViolationError(
        ErrorCodes.ORDER_STATE_CONFLICT,
        `Order is in "${order.status}" status, not awaiting customer confirmation`,
      );
    }

    validateOrderTransition(order.status, 'confirmed');

    return withTransaction(async (session: ClientSession) => {
      const ctx: RepositoryContext = { session };
      const updated = await this.orderRepo.updateWithVersion(
        reference,
        expectedVersion,
        {
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
        },
        ctx,
      );

      if (!updated) {
        throw new ConflictError(
          ErrorCodes.ORDER_VERSION_CONFLICT,
          `Order version conflict: expected version ${expectedVersion}`,
        );
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
  async adminUpdateShipping(
    reference: string,
    input: {
      provider: string;
      finalCostMinor: number;
      expectedVersion: number;
      reason?: string;
    },
    admin: { id: string; role: string },
  ): Promise<IOrderDocument> {
    return withTransaction(async (session: ClientSession) => {
      const ctx: RepositoryContext = { session };
      const order = await this.orderRepo.findByReference(reference, ctx);
      if (!order) {
        throw new NotFoundError(`Order not found: ${reference}`, ErrorCodes.ORDER_NOT_FOUND);
      }

      if (order.version !== input.expectedVersion) {
        throw new ConflictError(
          ErrorCodes.ORDER_VERSION_CONFLICT,
          `Order version conflict: expected ${input.expectedVersion}, current ${order.version}`,
        );
      }

      const totalMinor =
        order.totals.productSubtotalMinor + input.finalCostMinor - (order.totals.discountMinor || 0);

      const updated = await this.orderRepo.updateWithVersion(
        reference,
        input.expectedVersion,
        {
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
              actorId: new Types.ObjectId(admin.id),
              actorRole: admin.role,
              reason: input.reason || `Shipping carrier ${input.provider} and final cost updated`,
              timestamp: new Date(),
            },
          },
          $inc: { version: 1 },
        },
        ctx,
      );

      if (!updated) {
        throw new ConflictError(
          ErrorCodes.ORDER_VERSION_CONFLICT,
          'Order version conflict while updating shipping',
        );
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

export const orderService = new OrderService();
