import { Schema } from 'mongoose';
import { ISettingDocument } from '../types/setting.types';
export declare const settingSchema: Schema<ISettingDocument, import("mongoose").Model<ISettingDocument, any, any, any, import("mongoose").Document<unknown, any, ISettingDocument, any, {}> & import("../types/setting.types").ISetting & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, ISettingDocument, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<ISettingDocument>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<ISettingDocument> & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}>;
export declare const SettingModel: import("mongoose").Model<ISettingDocument, {}, {}, {}, import("mongoose").Document<unknown, {}, ISettingDocument, {}, {}> & import("../types/setting.types").ISetting & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}, any>;
