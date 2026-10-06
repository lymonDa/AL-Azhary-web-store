import { Schema } from 'mongoose';
import { IQuotationDocument } from '../types/quotation.types';
export declare const quotationSchema: Schema<IQuotationDocument, import("mongoose").Model<IQuotationDocument, any, any, any, import("mongoose").Document<unknown, any, IQuotationDocument, any, {}> & import("../types/quotation.types").IQuotation & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, IQuotationDocument, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<IQuotationDocument>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<IQuotationDocument> & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}>;
export declare const QuotationModel: import("mongoose").Model<IQuotationDocument, {}, {}, {}, import("mongoose").Document<unknown, {}, IQuotationDocument, {}, {}> & import("../types/quotation.types").IQuotation & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}, any>;
