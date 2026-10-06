"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toSafeNotificationDto = toSafeNotificationDto;
function toSafeNotificationDto(notification) {
    return {
        id: notification._id.toString(),
        type: notification.type,
        title: {
            ar: notification.title.ar,
            en: notification.title.en ?? undefined,
        },
        body: {
            ar: notification.body.ar,
            en: notification.body.en ?? undefined,
        },
        entityType: notification.entityType ?? null,
        entityId: notification.entityId ?? null,
        actionUrl: notification.actionUrl ?? null,
        read: Boolean(notification.readAt),
        readAt: notification.readAt ?? null,
        createdAt: notification.createdAt,
    };
}
//# sourceMappingURL=notification.projection.js.map