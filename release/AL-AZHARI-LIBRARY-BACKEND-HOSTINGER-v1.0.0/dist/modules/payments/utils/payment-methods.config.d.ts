import { IPaymentMethodSnapshot } from '../types/payment.types';
export interface ConfiguredPaymentMethod {
    key: string;
    name: {
        ar: string;
        en?: string;
    };
    type: 'cash_on_delivery' | 'instant_payment' | 'digital_wallet';
    proofRequired: boolean;
    isActive: boolean;
    instructions: {
        ar: string;
        en?: string;
    };
    details?: Record<string, unknown>;
}
export declare const CONFIGURED_PAYMENT_METHODS: Record<string, ConfiguredPaymentMethod>;
export declare function getPaymentMethodConfig(methodKey: string): ConfiguredPaymentMethod | null;
export declare function getPaymentMethodSnapshot(methodKey: string): IPaymentMethodSnapshot | null;
