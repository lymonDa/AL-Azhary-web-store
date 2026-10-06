import { IContentModuleDocument } from '../types/content.types';
export declare const ContentModuleModel: import("mongoose").Model<IContentModuleDocument, {}, {}, {}, import("mongoose").Document<unknown, {}, IContentModuleDocument, {}, {}> & import("../types/content.types").IContentModule & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}, any>;
