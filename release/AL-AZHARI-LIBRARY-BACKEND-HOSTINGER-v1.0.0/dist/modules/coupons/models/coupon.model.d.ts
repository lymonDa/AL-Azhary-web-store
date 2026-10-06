import { Schema } from 'mongoose';
import { ICouponDocument } from '../types/coupon.types';
export declare const couponSchema: Schema<ICouponDocument, import("mongoose").Model<ICouponDocument, any, any, any, import("mongoose").Document<unknown, any, ICouponDocument, any, {}> & import("../types/coupon.types").ICoupon & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, ICouponDocument, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<ICouponDocument>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<ICouponDocument> & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}>;
export declare const CouponModel: import("mongoose").Model<ICouponDocument, {}, {}, {}, import("mongoose").Document<unknown, {}, ICouponDocument, {}, {}> & import("../types/coupon.types").ICoupon & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}, any>;
