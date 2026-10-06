import { IRefundDocument } from '../types/returns.types';
export declare const RefundModel: import("mongoose").Model<IRefundDocument, {}, {}, {}, import("mongoose").Document<unknown, {}, IRefundDocument, {}, {}> & import("../types/returns.types").IRefund & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}, any>;
