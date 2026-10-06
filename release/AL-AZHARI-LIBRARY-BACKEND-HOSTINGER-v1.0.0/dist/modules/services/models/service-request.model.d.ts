import { Schema } from 'mongoose';
import { IServiceRequestDocument } from '../types/service.types';
export declare const serviceRequestSchema: Schema<IServiceRequestDocument, import("mongoose").Model<IServiceRequestDocument, any, any, any, import("mongoose").Document<unknown, any, IServiceRequestDocument, any, {}> & import("../types/service.types").IServiceRequest & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, IServiceRequestDocument, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<IServiceRequestDocument>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<IServiceRequestDocument> & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}>;
export declare const ServiceRequestModel: import("mongoose").Model<IServiceRequestDocument, {}, {}, {}, import("mongoose").Document<unknown, {}, IServiceRequestDocument, {}, {}> & import("../types/service.types").IServiceRequest & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}, any>;
