import { Schema } from 'mongoose';
import { IServiceCategoryDocument } from '../types/service.types';
export declare const serviceCategorySchema: Schema<IServiceCategoryDocument, import("mongoose").Model<IServiceCategoryDocument, any, any, any, import("mongoose").Document<unknown, any, IServiceCategoryDocument, any, {}> & import("../types/service.types").IServiceCategory & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, IServiceCategoryDocument, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<IServiceCategoryDocument>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<IServiceCategoryDocument> & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}>;
export declare const ServiceCategoryModel: import("mongoose").Model<IServiceCategoryDocument, {}, {}, {}, import("mongoose").Document<unknown, {}, IServiceCategoryDocument, {}, {}> & import("../types/service.types").IServiceCategory & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}, any>;
