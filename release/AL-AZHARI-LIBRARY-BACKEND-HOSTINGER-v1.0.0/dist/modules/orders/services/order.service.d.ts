import { OrderRepository } from '../repositories/order.repository';
import { CreateOrderInput, IOrderDocument, OrderStatus, UpdatePendingOrderInput } from '../types/order.types';
import { CartRepository } from '../../carts/repositories/cart.repository';
import { CartOwnerContext } from '../../carts/types/cart.types';
import { ProductRepository } from '../../products/repositories/product.repository';
import { ShippingService } from '../../shipping/services/shipping.service';
import { InventoryService } from '../../inventory/services/inventory.service';
import { AuditService } from '../../audit/services/audit.service';
import { PaymentRepository } from '../../payments/repositories/payment.repository';
import { CouponService } from '../../coupons/services/coupon.service';
import { OutboxService } from '../../notifications/services/outbox.service';
export interface CheckoutContext {
    owner: CartOwnerContext;
    requestId?: string;
    ipHash?: string;
}
export declare class OrderService {
    private readonly orderRepo;
    private readonly cartRepo;
    private readonly productRepo;
    private readonly shipService;
    private readonly invService;
    private readonly audit;
    private readonly paymentRepo;
    private readonly couponSvc;
    private readonly outbox;
    constructor(orderRepo?: OrderRepository, cartRepo?: CartRepository, productRepo?: ProductRepository, shipService?: ShippingService, invService?: InventoryService, audit?: AuditService, paymentRepo?: PaymentRepository, couponSvc?: CouponService, outbox?: OutboxService);
    /**
     * Authoritative Order Creation from Cart (Checkout).
     * Transactional, idempotent, with strict catalog revalidation.
     * NOTE: Order creation does NOT reserve inventory!
     */
    createOrder(input: CreateOrderInput, context: CheckoutContext): Promise<{
        order: IOrderDocument;
        rawGuestToken?: string;
    }>;
    /**
     * Retrieves order by reference with strict ownership validation:
     * - Registered customer owns the order (or Admin)
     * - Guest presents valid guest access token (or Admin)
     */
    getOrderByReference(reference: string, access: {
        userId?: string;
        role?: string;
        guestToken?: string;
    }): Promise<IOrderDocument>;
    /**
     * Customer edits an order in pending_review.
     */
    updatePendingOrder(reference: string, input: UpdatePendingOrderInput, access: {
        userId?: string;
        guestToken?: string;
    }): Promise<IOrderDocument>;
    /**
     * Customer cancels an order in pending_review.
     * Since order creation does not reserve stock, no inventory release is needed.
     */
    cancelOrder(reference: string, expectedVersion: number, access: {
        userId?: string;
        guestToken?: string;
    }, reason?: string): Promise<IOrderDocument>;
    /**
     * Admin accepts order.
     * Multi-document transaction:
     * 1. Validates transition pending_review -> accepted.
     * 2. Atomically reserves all physical inventory lines using Phase 7 inventory service.
     * 3. Transitions order status to 'accepted'.
     * 4. Updates payment status / sets next state (awaiting_payment or customer_confirmation_required).
     */
    adminAcceptOrder(reference: string, expectedVersion: number, admin: {
        id: string;
        role: string;
    }): Promise<IOrderDocument>;
    /**
     * Admin rejects order.
     * Multi-document transaction:
     * 1. Validates transition.
     * 2. Defensively releases any existing reservations via Phase 7.
     * 3. Transitions status to 'rejected'.
     */
    adminRejectOrder(reference: string, expectedVersion: number, reason: string, admin: {
        id: string;
        role: string;
    }): Promise<IOrderDocument>;
    /**
     * Admin updates operational order status (fulfilling transitions like preparing, shipped, delivered, etc.).
     */
    adminUpdateOrderStatus(reference: string, targetStatus: OrderStatus, expectedVersion: number, admin: {
        id: string;
        role: string;
    }, reason?: string): Promise<IOrderDocument>;
    /**
     * Customer confirms COD order.
     * Allowed only from 'customer_confirmation_required' status.
     */
    confirmCodOrder(reference: string, expectedVersion: number, access: {
        userId?: string;
        guestToken?: string;
    }): Promise<IOrderDocument>;
    /**
     * Admin updates shipping carrier and records final shipping cost.
     */
    adminUpdateShipping(reference: string, input: {
        provider: string;
        finalCostMinor: number;
        expectedVersion: number;
        reason?: string;
    }, admin: {
        id: string;
        role: string;
    }): Promise<IOrderDocument>;
}
export declare const orderService: OrderService;
