import { Types, Document } from 'mongoose';
export type NotificationChannel = 'in_app' | 'email' | 'socket';
export declare const NotificationTypes: {
    readonly USER_REGISTERED: "user_registered";
    readonly EMAIL_VERIFIED: "email_verified";
    readonly ORDER_CREATED: "order_created";
    readonly ORDER_ACCEPTED: "order_accepted";
    readonly ORDER_REJECTED: "order_rejected";
    readonly PAYMENT_PROOF_SUBMITTED: "payment_proof_submitted";
    readonly PAYMENT_VERIFIED: "payment_verified";
    readonly PAYMENT_NEW_PROOF_REQUESTED: "payment_new_proof_requested";
    readonly ORDER_CONFIRMED: "order_confirmed";
    readonly ORDER_FULFILLMENT_CHANGED: "order_fulfillment_changed";
    readonly SERVICE_REQUESTED: "service_requested";
    readonly QUOTATION_SENT: "quotation_sent";
    readonly QUOTATION_DECISION_RECORDED: "quotation_decision_recorded";
    readonly PREORDER_STATUS_CHANGED: "preorder_status_changed";
    readonly RETURN_STATUS_CHANGED: "return_status_changed";
    readonly REFUND_COMPLETED: "refund_completed";
};
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
