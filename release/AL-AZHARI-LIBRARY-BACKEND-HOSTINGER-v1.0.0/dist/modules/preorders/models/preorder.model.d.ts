import { Schema } from 'mongoose';
import { IPreorderDocument } from '../types/preorder.types';
export declare const preorderSchema: Schema<IPreorderDocument, import("mongoose").Model<IPreorderDocument, any, any, any, import("mongoose").Document<unknown, any, IPreorderDocument, any, {}> & import("../types/preorder.types").IPreorder & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, IPreorderDocument, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<IPreorderDocument>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<IPreorderDocument> & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}>;
export declare const PreorderModel: import("mongoose").Model<IPreorderDocument, {}, {}, {}, import("mongoose").Document<unknown, {}, IPreorderDocument, {}, {}> & import("../types/preorder.types").IPreorder & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}, any>;
