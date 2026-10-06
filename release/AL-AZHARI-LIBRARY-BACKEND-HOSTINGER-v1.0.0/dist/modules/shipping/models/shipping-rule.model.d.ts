import { Schema } from 'mongoose';
import { IShippingRuleDocument } from '../types/shipping.types';
export declare const shippingRuleSchema: Schema<IShippingRuleDocument, import("mongoose").Model<IShippingRuleDocument, any, any, any, import("mongoose").Document<unknown, any, IShippingRuleDocument, any, {}> & import("../types/shipping.types").IShippingRule & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, IShippingRuleDocument, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<IShippingRuleDocument>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<IShippingRuleDocument> & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}>;
export declare const ShippingRuleModel: import("mongoose").Model<IShippingRuleDocument, {}, {}, {}, import("mongoose").Document<unknown, {}, IShippingRuleDocument, {}, {}> & import("../types/shipping.types").IShippingRule & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}, any>;
