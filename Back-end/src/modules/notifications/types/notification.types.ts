import { Types, Document } from 'mongoose';

export type NotificationChannel = 'in_app' | 'email' | 'socket';

export const NotificationTypes = {
  USER_REGISTERED: 'user_registered',
  EMAIL_VERIFIED: 'email_verified',
  ORDER_CREATED: 'order_created',
  ORDER_ACCEPTED: 'order_accepted',
  ORDER_REJECTED: 'order_rejected',
  PAYMENT_PROOF_SUBMITTED: 'payment_proof_submitted',
  PAYMENT_VERIFIED: 'payment_verified',
  PAYMENT_NEW_PROOF_REQUESTED: 'payment_new_proof_requested',
  ORDER_CONFIRMED: 'order_confirmed',
  ORDER_FULFILLMENT_CHANGED: 'order_fulfillment_changed',
  SERVICE_REQUESTED: 'service_requested',
  QUOTATION_SENT: 'quotation_sent',
  QUOTATION_DECISION_RECORDED: 'quotation_decision_recorded',
  PREORDER_STATUS_CHANGED: 'preorder_status_changed',
  RETURN_STATUS_CHANGED: 'return_status_changed',
  REFUND_COMPLETED: 'refund_completed',
} as const;

export type NotificationType = (typeof NotificationTypes)[keyof typeof NotificationTypes];

export interface LocalizedContent {
  ar: string;
  en?: string;
}

export interface INotification {
  _id: Types.ObjectId;
  recipientUserId: Types.ObjectId;
  recipientRoleContext?: string | null;
  type: NotificationType;
  title: LocalizedContent;
  body: LocalizedContent;
  entityType?: string | null;
  entityId?: string | null;
  actionUrl?: string | null;
  readAt?: Date | null;
  channels: NotificationChannel[];
  deliveryStatus?: Record<string, unknown> | null;
  dedupeKey?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type INotificationDocument = INotification & Document<Types.ObjectId>;

export interface CreateNotificationInput {
  recipientUserId: Types.ObjectId | string;
  recipientRoleContext?: string | null;
  type: NotificationType;
  title: LocalizedContent;
  body: LocalizedContent;
  entityType?: string | null;
  entityId?: string | null;
  actionUrl?: string | null;
  channels?: NotificationChannel[];
  deliveryStatus?: Record<string, unknown> | null;
  dedupeKey?: string | null;
}

export interface NotificationQueryOptions {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
}

export interface SafeNotificationDto {
  id: string;
  type: NotificationType;
  title: LocalizedContent;
  body: LocalizedContent;
  entityType: string | null;
  entityId: string | null;
  actionUrl: string | null;
  read: boolean;
  readAt: Date | null;
  createdAt: Date;
}
