import { OrderStatus } from '../types/order.types';
export declare const VALID_ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]>;
export declare function validateOrderTransition(currentStatus: OrderStatus, targetStatus: OrderStatus): void;
