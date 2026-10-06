import { Schema } from 'mongoose';
import { IPaymentDocument } from '../types/payment.types';
export declare const paymentSchema: Schema<IPaymentDocument, import("mongoose").Model<IPaymentDocument, any, any, any, import("mongoose").Document<unknown, any, IPaymentDocument, any, {}> & import("../types/payment.types").IPayment & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, IPaymentDocument, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<IPaymentDocument>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<IPaymentDocument> & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}>;
export declare const PaymentModel: import("mongoose").Model<IPaymentDocument, {}, {}, {}, import("mongoose").Document<unknown, {}, IPaymentDocument, {}, {}> & import("../types/payment.types").IPayment & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}, any>;
