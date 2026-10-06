import { PaymentStatus } from '../types/payment.types';
export declare const VALID_PAYMENT_TRANSITIONS: Record<PaymentStatus, PaymentStatus[]>;
export declare function validatePaymentTransition(currentStatus: PaymentStatus, targetStatus: PaymentStatus): void;
