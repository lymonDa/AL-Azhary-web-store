import { Schema } from 'mongoose';
import { IPaymentProofDocument } from '../types/payment.types';
export declare const paymentProofSchema: Schema<IPaymentProofDocument, import("mongoose").Model<IPaymentProofDocument, any, any, any, import("mongoose").Document<unknown, any, IPaymentProofDocument, any, {}> & import("../types/payment.types").IPaymentProof & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, IPaymentProofDocument, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<IPaymentProofDocument>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<IPaymentProofDocument> & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}>;
export declare const PaymentProofModel: import("mongoose").Model<IPaymentProofDocument, {}, {}, {}, import("mongoose").Document<unknown, {}, IPaymentProofDocument, {}, {}> & import("../types/payment.types").IPaymentProof & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}, any>;
