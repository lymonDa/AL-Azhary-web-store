import { Schema } from 'mongoose';
import { INotificationDocument } from '../types/notification.types';
export declare const notificationSchema: Schema<INotificationDocument, import("mongoose").Model<INotificationDocument, any, any, any, import("mongoose").Document<unknown, any, INotificationDocument, any, {}> & import("../types/notification.types").INotification & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, INotificationDocument, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<INotificationDocument>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<INotificationDocument> & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}>;
export declare const NotificationModel: import("mongoose").Model<INotificationDocument, {}, {}, {}, import("mongoose").Document<unknown, {}, INotificationDocument, {}, {}> & import("../types/notification.types").INotification & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}, any>;
