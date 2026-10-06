import { Schema } from 'mongoose';
import { IOrderDocument } from '../types/order.types';
export declare const orderSchema: Schema<IOrderDocument, import("mongoose").Model<IOrderDocument, any, any, any, import("mongoose").Document<unknown, any, IOrderDocument, any, {}> & import("../types/order.types").IOrder & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, IOrderDocument, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<IOrderDocument>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<IOrderDocument> & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}>;
export declare const OrderModel: import("mongoose").Model<IOrderDocument, {}, {}, {}, import("mongoose").Document<unknown, {}, IOrderDocument, {}, {}> & import("../types/order.types").IOrder & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}, any>;
