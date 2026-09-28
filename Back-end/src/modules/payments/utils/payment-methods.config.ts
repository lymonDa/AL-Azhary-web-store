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

export const CONFIGURED_PAYMENT_METHODS: Record<string, ConfiguredPaymentMethod> = {
  cod: {
    key: 'cod',
    name: {
      ar: 'الدفع عند الاستلام',
      en: 'Cash on Delivery (COD)',
    },
    type: 'cash_on_delivery',
    proofRequired: false,
    isActive: true,
    instructions: {
      ar: 'يتم سداد المبلغ نقداً لمندوب الشحن عند استلام الطلب.',
      en: 'Pay the total amount in cash to the delivery representative upon receiving your order.',
    },
  },
  instapay: {
    key: 'instapay',
    name: {
      ar: 'إنستاباي (InstaPay)',
      en: 'InstaPay',
    },
    type: 'instant_payment',
    proofRequired: true,
    isActive: true,
    instructions: {
      ar: 'قم بالتحويل عبر تطبيق إنستاباي إلى العنوان المحدد، ثم ارفع لقطة شاشة لإيصال التحويل.',
      en: 'Transfer via InstaPay app to our address, then upload a screenshot of the transfer receipt.',
    },
    details: {
      ipa: 'alazhari@instapay',
    },
  },
  vodafone_cash: {
    key: 'vodafone_cash',
    name: {
      ar: 'فودافون كاش',
      en: 'Vodafone Cash',
    },
    type: 'digital_wallet',
    proofRequired: true,
    isActive: true,
    instructions: {
      ar: 'قم بتحويل المبلغ إلى رقم فودافون كاش الخاص بالمكتبة، ثم ارفع لقطة شاشة لإيصال التحويل.',
      en: 'Transfer to the library Vodafone Cash number, then upload a screenshot of the transfer confirmation.',
    },
    details: {
      walletNumber: '010XXXXXXXX',
    },
  },
  orange_cash: {
    key: 'orange_cash',
    name: {
      ar: 'أورنج كاش',
      en: 'Orange Cash',
    },
    type: 'digital_wallet',
    proofRequired: true,
    isActive: true,
    instructions: {
      ar: 'قم بتحويل المبلغ إلى محفظة أورنج كاش الخاصة بالمكتبة، ثم ارفع لقطة شاشة لإيصال التحويل.',
      en: 'Transfer to the library Orange Cash wallet, then upload a screenshot of the transfer confirmation.',
    },
    details: {
      walletNumber: '012XXXXXXXX',
    },
  },
  etisalat_cash: {
    key: 'etisalat_cash',
    name: {
      ar: 'اتصالات كاش',
      en: 'Etisalat Cash',
    },
    type: 'digital_wallet',
    proofRequired: true,
    isActive: true,
    instructions: {
      ar: 'قم بتحويل المبلغ إلى محفظة اتصالات كاش، ثم ارفع لقطة شاشة لإيصال التحويل.',
      en: 'Transfer to the library Etisalat Cash wallet, then upload a screenshot of the transfer confirmation.',
    },
    details: {
      walletNumber: '011XXXXXXXX',
    },
  },
  we_pay: {
    key: 'we_pay',
    name: {
      ar: 'وي باي (WE Pay)',
      en: 'WE Pay',
    },
    type: 'digital_wallet',
    proofRequired: true,
    isActive: true,
    instructions: {
      ar: 'قم بتحويل المبلغ إلى محفظة WE Pay، ثم ارفع لقطة شاشة لإيصال التحويل.',
      en: 'Transfer to the library WE Pay wallet, then upload a screenshot of the transfer confirmation.',
    },
    details: {
      walletNumber: '015XXXXXXXX',
    },
  },
};

export function getPaymentMethodConfig(methodKey: string): ConfiguredPaymentMethod | null {
  const normalized = methodKey.trim().toLowerCase();
  const method = CONFIGURED_PAYMENT_METHODS[normalized];
  if (!method || !method.isActive) {
    return null;
  }
  return method;
}

export function getPaymentMethodSnapshot(methodKey: string): IPaymentMethodSnapshot | null {
  const config = getPaymentMethodConfig(methodKey);
  if (!config) return null;

  return {
    key: config.key,
    name: config.name,
    type: config.type,
    proofRequired: config.proofRequired,
    instructions: config.instructions,
    details: config.details,
  };
}
