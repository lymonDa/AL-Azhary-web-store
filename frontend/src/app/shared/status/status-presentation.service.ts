import { Injectable, inject } from '@angular/core';
import { LocaleService } from '../../core/i18n/locale.service';
import {
  StatusKind,
  StatusPresentationMeta,
} from './status-presentation.model';

const ORDER_STATUS_MAP: Record<string, StatusPresentationMeta> = {
  pending_review: {
    labelAr: 'قيد المراجعة',
    labelEn: 'Pending Review',
    tone: 'warning',
    icon: 'clock-3',
  },
  accepted: {
    labelAr: 'مقبول',
    labelEn: 'Accepted',
    tone: 'info',
    icon: 'clipboard-check',
  },
  awaiting_payment: {
    labelAr: 'بانتظار الدفع',
    labelEn: 'Awaiting Payment',
    tone: 'warning',
    icon: 'wallet-cards',
  },
  payment_verification: {
    labelAr: 'التحقق من الدفع',
    labelEn: 'Payment Verification',
    tone: 'info',
    icon: 'search-check',
  },
  awaiting_new_proof: {
    labelAr: 'مطلوب إشعار جديد',
    labelEn: 'Awaiting New Proof',
    tone: 'error',
    icon: 'upload',
  },
  payment_confirmed: {
    labelAr: 'تم تأكيد الدفع',
    labelEn: 'Payment Confirmed',
    tone: 'success',
    icon: 'badge-check',
  },
  customer_confirmation_required: {
    labelAr: 'بانتظار تأكيد العميل',
    labelEn: 'Confirmation Required',
    tone: 'warning',
    icon: 'circle-alert',
  },
  confirmed: {
    labelAr: 'مؤكد',
    labelEn: 'Confirmed',
    tone: 'success',
    icon: 'check-circle-2',
  },
  preparing: {
    labelAr: 'قيد التجهيز',
    labelEn: 'Preparing',
    tone: 'info',
    icon: 'package-open',
  },
  ready_for_pickup: {
    labelAr: 'جاهز للاستلام',
    labelEn: 'Ready for Pickup',
    tone: 'success',
    icon: 'store',
  },
  picked_up: {
    labelAr: 'تم الاستلام',
    labelEn: 'Picked Up',
    tone: 'success',
    icon: 'hand-coins',
  },
  shipped: {
    labelAr: 'تم الشحن',
    labelEn: 'Shipped',
    tone: 'info',
    icon: 'truck',
  },
  out_for_delivery: {
    labelAr: 'جاري التوصيل',
    labelEn: 'Out for Delivery',
    tone: 'info',
    icon: 'route',
  },
  delivered: {
    labelAr: 'تم التوصيل',
    labelEn: 'Delivered',
    tone: 'success',
    icon: 'package-check',
  },
  completed: {
    labelAr: 'مكتمل',
    labelEn: 'Completed',
    tone: 'success',
    icon: 'check-circle-2',
  },
  rejected: {
    labelAr: 'مرفوض',
    labelEn: 'Rejected',
    tone: 'error',
    icon: 'x-circle',
  },
  cancelled: {
    labelAr: 'ملغي',
    labelEn: 'Cancelled',
    tone: 'neutral',
    icon: 'ban',
  },
  returned: {
    labelAr: 'مرتجع',
    labelEn: 'Returned',
    tone: 'warning',
    icon: 'undo-2',
  },
};

const PAYMENT_STATUS_MAP: Record<string, StatusPresentationMeta> = {
  not_submitted: {
    labelAr: 'لم يتم الإرسال',
    labelEn: 'Not Submitted',
    tone: 'neutral',
    icon: 'circle',
  },
  proof_uploaded: {
    labelAr: 'تم رفع الإشعار',
    labelEn: 'Proof Uploaded',
    tone: 'info',
    icon: 'upload',
  },
  under_review: {
    labelAr: 'قيد المراجعة',
    labelEn: 'Under Review',
    tone: 'warning',
    icon: 'clock-3',
  },
  confirmed: {
    labelAr: 'تم التأكيد',
    labelEn: 'Confirmed',
    tone: 'success',
    icon: 'badge-check',
  },
  rejected: {
    labelAr: 'مرفوض',
    labelEn: 'Rejected',
    tone: 'error',
    icon: 'x-circle',
  },
  new_proof_requested: {
    labelAr: 'مطلوب إشعار جديد',
    labelEn: 'New Proof Requested',
    tone: 'warning',
    icon: 'refresh-cw',
  },
  refund_initiated: {
    labelAr: 'جاري الاسترداد',
    labelEn: 'Refund Initiated',
    tone: 'warning',
    icon: 'arrow-down-to-line',
  },
  refund_completed: {
    labelAr: 'تم الاسترداد',
    labelEn: 'Refund Completed',
    tone: 'success',
    icon: 'check-circle-2',
  },
};

const SERVICE_STATUS_MAP: Record<string, StatusPresentationMeta> = {
  submitted: {
    labelAr: 'تم تقديم الطلب',
    labelEn: 'Submitted',
    tone: 'info',
    icon: 'clock-3',
  },
  admin_review: {
    labelAr: 'قيد المراجعة',
    labelEn: 'Admin Review',
    tone: 'info',
    icon: 'clock-3',
  },
  quotation_sent: {
    labelAr: 'تم إرسال عرض السعر',
    labelEn: 'Quotation Sent',
    tone: 'warning',
    icon: 'clock-3',
  },
  awaiting_payment: {
    labelAr: 'بانتظار الدفع',
    labelEn: 'Awaiting Payment',
    tone: 'warning',
    icon: 'wallet-cards',
  },
  payment_verification: {
    labelAr: 'التحقق من الدفع',
    labelEn: 'Payment Verification',
    tone: 'info',
    icon: 'search-check',
  },
  payment_confirmed: {
    labelAr: 'تم تأكيد الدفع',
    labelEn: 'Payment Confirmed',
    tone: 'success',
    icon: 'badge-check',
  },
  processing: {
    labelAr: 'جاري التنفيذ',
    labelEn: 'Processing',
    tone: 'info',
    icon: 'package-open',
  },
  completed: {
    labelAr: 'مكتمل',
    labelEn: 'Completed',
    tone: 'success',
    icon: 'check-circle-2',
  },
  closed_not_proceeding: {
    labelAr: 'مغلق',
    labelEn: 'Closed',
    tone: 'neutral',
    icon: 'ban',
  },
  closed_declined: {
    labelAr: 'مرفوض',
    labelEn: 'Declined',
    tone: 'error',
    icon: 'x-circle',
  },
};

const INVENTORY_STATUS_MAP: Record<string, StatusPresentationMeta> = {
  in_stock: {
    labelAr: 'متوفر',
    labelEn: 'In Stock',
    tone: 'success',
    icon: 'check-circle-2',
  },
  out_of_stock: {
    labelAr: 'نفدت الكمية',
    labelEn: 'Out of Stock',
    tone: 'error',
    icon: 'x-circle',
  },
  preorder_eligible: {
    labelAr: 'متاح للحجز المسبق',
    labelEn: 'Pre-order Eligible',
    tone: 'warning',
    icon: 'clock-3',
  },
  reserved: {
    labelAr: 'محجوز',
    labelEn: 'Reserved',
    tone: 'info',
    icon: 'clock-3',
  },
};

@Injectable({
  providedIn: 'root',
})
export class StatusPresentationService {
  private readonly localeService = inject(LocaleService, { optional: true });

  resolve(kind: StatusKind, status: string): StatusPresentationMeta {
    const normalizedKey = status.toLowerCase().replace(/[\s-]+/g, '_');
    let map: Record<string, StatusPresentationMeta>;

    switch (kind) {
      case 'order':
        map = ORDER_STATUS_MAP;
        break;
      case 'payment':
        map = PAYMENT_STATUS_MAP;
        break;
      case 'service':
        map = SERVICE_STATUS_MAP;
        break;
      case 'inventory':
        map = INVENTORY_STATUS_MAP;
        break;
      case 'custom':
      default:
        return {
          labelAr: status,
          labelEn: status,
          tone: 'neutral',
          icon: 'circle',
        };
    }

    const found = map[normalizedKey];
    if (found) {
      return found;
    }

    return {
      labelAr: status,
      labelEn: status,
      tone: 'neutral',
      icon: 'circle',
    };
  }

  getLabel(meta: StatusPresentationMeta): string {
    const isArabic = this.localeService?.currentLocale() !== 'en';
    return isArabic ? meta.labelAr : meta.labelEn;
  }
}
