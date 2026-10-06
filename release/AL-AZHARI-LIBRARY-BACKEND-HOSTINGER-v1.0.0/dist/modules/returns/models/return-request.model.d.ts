import { IReturnRequestDocument } from '../types/returns.types';
export declare const ReturnRequestModel: import("mongoose").Model<IReturnRequestDocument, {}, {}, {}, import("mongoose").Document<unknown, {}, IReturnRequestDocument, {}, {}> & import("../types/returns.types").IReturnRequest & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}, any>;
