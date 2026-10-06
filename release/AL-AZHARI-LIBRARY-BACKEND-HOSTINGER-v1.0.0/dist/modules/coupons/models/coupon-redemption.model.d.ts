import { Schema } from 'mongoose';
import { ICouponRedemptionDocument } from '../types/coupon.types';
export declare const couponRedemptionSchema: Schema<ICouponRedemptionDocument, import("mongoose").Model<ICouponRedemptionDocument, any, any, any, import("mongoose").Document<unknown, any, ICouponRedemptionDocument, any, {}> & import("../types/coupon.types").ICouponRedemption & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, ICouponRedemptionDocument, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<ICouponRedemptionDocument>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<ICouponRedemptionDocument> & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}>;
export declare const CouponRedemptionModel: import("mongoose").Model<ICouponRedemptionDocument, {}, {}, {}, import("mongoose").Document<unknown, {}, ICouponRedemptionDocument, {}, {}> & import("../types/coupon.types").ICouponRedemption & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}, any>;
