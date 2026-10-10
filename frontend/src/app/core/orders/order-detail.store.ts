import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { OrdersApi } from '../api/commerce/orders-api.service';
import { mapSafeOrderToCustomerOrder } from '../api/mappers/order.mapper';
import type { CustomerOrder } from '../../domain/models/order.model';
import type { SafeCustomerPaymentResponseDto } from '../api/dto/checkout.dto';

export interface TrackingStep {
  readonly key: string;
  readonly labelAr: string;
  readonly labelEn: string;
  readonly isCompleted: boolean;
  readonly isCurrent: boolean;
  readonly timestamp?: string | null;
  readonly actorRole?: string;
  readonly note?: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class OrderDetailStore {
  private readonly ordersApi = inject(OrdersApi);

  readonly order = signal<CustomerOrder | null>(null);
  readonly payment = signal<SafeCustomerPaymentResponseDto | null>(null);

  readonly isLoading = signal<boolean>(false);
  readonly isCancelling = signal<boolean>(false);
  readonly isConfirmingCod = signal<boolean>(false);

  readonly error = signal<string | null>(null);
  readonly notFound = signal<boolean>(false);
  readonly forbidden = signal<boolean>(false);
  readonly conflictMessage = signal<string | null>(null);

  private activeReference: string | null = null;
  private activeGuestToken: string | undefined = undefined;

  loadOrder(reference: string, guestToken?: string): Observable<CustomerOrder> {
    this.activeReference = reference;
    this.activeGuestToken = guestToken;
    this.isLoading.set(true);
    this.error.set(null);
    this.notFound.set(false);
    this.forbidden.set(false);
    this.conflictMessage.set(null);

    return this.ordersApi.getOrder(reference, guestToken).pipe(
      tap({
        next: (dto) => {
          const mapped = mapSafeOrderToCustomerOrder(dto);
          this.order.set(mapped);
          this.isLoading.set(false);

          // Attempt to load payment info asynchronously
          this.loadPaymentDetails(reference, guestToken);
        },
        error: (err) => {
          this.isLoading.set(false);
          const status = err?.status || err?.statusCode;
          if (status === 404) {
            this.notFound.set(true);
          } else if (status === 403 || status === 401) {
            this.forbidden.set(true);
          } else {
            this.error.set(err?.message || 'Failed to load order');
          }
        },
      }),
    ) as unknown as Observable<CustomerOrder>;
  }

  loadPaymentDetails(reference: string, guestToken?: string): void {
    this.ordersApi.getPaymentDetails(reference, guestToken).pipe(
      tap({
        next: (payDto) => {
          this.payment.set(payDto);
        },
        error: () => {
          // Non-blocking: payments can be unavailable or not required
        },
      }),
      catchError(() => throwError(() => null)),
    ).subscribe();
  }

  cancelOrder(reason?: string): Observable<CustomerOrder> {
    const current = this.order();
    if (!current || !this.activeReference) {
      return throwError(() => new Error('No active order loaded'));
    }

    this.isCancelling.set(true);
    this.conflictMessage.set(null);

    return this.ordersApi
      .cancelOrder(
        this.activeReference,
        current.version,
        reason,
        this.activeGuestToken,
      )
      .pipe(
        tap({
          next: (dto) => {
            const mapped = mapSafeOrderToCustomerOrder(dto);
            this.order.set(mapped);
            this.isCancelling.set(false);
          },
          error: (err) => {
            this.isCancelling.set(false);
            const status = err?.status || err?.statusCode;
            if (status === 409 || err?.code === 'ORDER_VERSION_CONFLICT' || err?.code === 'ORDER_STATE_CONFLICT') {
              this.conflictMessage.set(
                'تغيرت حالة الطلب أو بياناته أثناء الإلغاء. تم تحديث البيانات تلقائياً.',
              );
              // Reload fresh order
              if (this.activeReference) {
                this.loadOrder(this.activeReference, this.activeGuestToken).subscribe();
              }
            } else {
              this.error.set(err?.message || 'Failed to cancel order');
            }
          },
        }),
      ) as unknown as Observable<CustomerOrder>;
  }

  confirmCodOrder(): Observable<CustomerOrder> {
    const current = this.order();
    if (!current || !this.activeReference) {
      return throwError(() => new Error('No active order loaded'));
    }

    this.isConfirmingCod.set(true);
    this.conflictMessage.set(null);

    return this.ordersApi
      .confirmCodOrder(
        this.activeReference,
        current.version,
        this.activeGuestToken,
      )
      .pipe(
        tap({
          next: (dto) => {
            const mapped = mapSafeOrderToCustomerOrder(dto);
            this.order.set(mapped);
            this.isConfirmingCod.set(false);
          },
          error: (err) => {
            this.isConfirmingCod.set(false);
            const status = err?.status || err?.statusCode;
            if (status === 409 || err?.code === 'ORDER_VERSION_CONFLICT' || err?.code === 'ORDER_STATE_CONFLICT') {
              this.conflictMessage.set(
                'تغيرت حالة الطلب أو بياناته. تم تحديث البيانات تلقائياً.',
              );
              if (this.activeReference) {
                this.loadOrder(this.activeReference, this.activeGuestToken).subscribe();
              }
            } else {
              this.error.set(err?.message || 'Failed to confirm order');
            }
          },
        }),
      ) as unknown as Observable<CustomerOrder>;
  }

  /**
   * Builds chronological tracking timeline steps based on verified order state machine.
   */
  getTrackingSteps(): TrackingStep[] {
    const o = this.order();
    if (!o) return [];

    const isPickup = o.fulfillment.method === 'pickup';
    const status = o.status;

    // Standard progression milestones
    const progression = [
      {
        key: 'submitted',
        labelAr: 'تم تقديم الطلب',
        labelEn: 'Order Submitted',
        timestamp: o.submittedAt,
      },
      {
        key: 'accepted',
        labelAr: 'تم قبول الطلب ومراجعة المخزون',
        labelEn: 'Order Accepted & Stock Reserved',
        timestamp: o.acceptedAt,
      },
      {
        key: 'confirmed',
        labelAr: 'تم تأكيد الطلب والدفع',
        labelEn: 'Order & Payment Confirmed',
        timestamp: null,
      },
      {
        key: 'preparing',
        labelAr: 'قيد تجهيز المراجع والكتب',
        labelEn: 'Preparing Items',
        timestamp: null,
      },
      isPickup
        ? {
            key: 'ready_for_pickup',
            labelAr: 'جاهز للاستلام بالمكتبة',
            labelEn: 'Ready for Pickup at Library',
            timestamp: null,
          }
        : {
            key: 'shipped',
            labelAr: 'خرج للشحن والتوصيل',
            labelEn: 'Dispatched for Delivery',
            timestamp: null,
          },
      {
        key: 'completed',
        labelAr: isPickup ? 'تم استلام الطلب بنجاح' : 'تم توصيل الطلب بنجاح',
        labelEn: 'Order Completed',
        timestamp: o.completedAt,
      },
    ];

    // Status ranking for progression completion
    const statusRank: Record<string, number> = {
      pending_review: 0,
      accepted: 1,
      awaiting_payment: 1,
      payment_verification: 1,
      awaiting_new_proof: 1,
      customer_confirmation_required: 1,
      confirmed: 2,
      payment_confirmed: 2,
      preparing: 3,
      ready_for_pickup: 4,
      shipped: 4,
      out_for_delivery: 4,
      picked_up: 5,
      delivered: 5,
      completed: 5,
    };

    const currentRank = statusRank[status] ?? 0;

    return progression.map((step, idx) => ({
      key: step.key,
      labelAr: step.labelAr,
      labelEn: step.labelEn,
      isCompleted: idx <= currentRank && status !== 'cancelled' && status !== 'rejected',
      isCurrent: idx === currentRank && status !== 'cancelled' && status !== 'rejected',
      timestamp: step.timestamp,
    }));
  }
}
